/**
 * Privacy-First Analytics with On-Device Pre-Aggregation
 * Processes emotional data locally before sending anonymized insights to server
 */

export interface JournalEntry {
  id: number;
  date: string;
  emotionScore: number;
  wordCount: number;
  themes: string[];
  createdAt: string;
}

export interface MoodWindow {
  date: string;
  avg: number;
  median: number;
  count: number;
  variance: number;
}

export interface PrivacyAnalytics {
  // Aggregated data only - no raw content
  rollingAverages: MoodWindow[];
  weeklyTrends: { week: string; avg: number; change: number }[];
  monthlyTrends: { month: string; avg: number; change: number }[];
  outlierDates: string[];
  streakData: { current: number; longest: number; type: 'positive' | 'negative' | 'neutral' };
  patterns: {
    bestDayOfWeek: string;
    worstDayOfWeek: string;
    bestTimeOfDay: string;
    mostProductiveWordCount: number;
  };
  summary: {
    totalEntries: number;
    avgMoodScore: number;
    moodStability: number; // variance measure
    growthTrend: 'improving' | 'stable' | 'declining';
  };
}

export class PrivacyAnalyticsEngine {
  // Calculate rolling window averages
  static calculateRollingAverages(entries: JournalEntry[], windowSize: number = 7): MoodWindow[] {
    if (entries.length === 0) return [];
    
    const sortedEntries = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const windows: MoodWindow[] = [];
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const windowStart = Math.max(0, i - windowSize + 1);
      const windowEntries = sortedEntries.slice(windowStart, i + 1);
      
      const scores = windowEntries.map(e => e.emotionScore);
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const median = this.calculateMedian(scores);
      const variance = this.calculateVariance(scores, avg);
      
      windows.push({
        date: sortedEntries[i].date,
        avg: Number(avg.toFixed(2)),
        median: Number(median.toFixed(2)),
        count: windowEntries.length,
        variance: Number(variance.toFixed(2))
      });
    }
    
    return windows;
  }

  // Detect emotional outliers using Z-score
  static detectOutliers(entries: JournalEntry[], threshold: number = 2): string[] {
    if (entries.length < 3) return [];
    
    const scores = entries.map(e => e.emotionScore);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const stdDev = Math.sqrt(this.calculateVariance(scores, mean));
    
    const outliers: string[] = [];
    
    entries.forEach(entry => {
      const zScore = Math.abs((entry.emotionScore - mean) / stdDev);
      if (zScore > threshold) {
        outliers.push(entry.date);
      }
    });
    
    return outliers;
  }

  // Calculate period-over-period trends
  static calculatePeriodTrends(entries: JournalEntry[], period: 'week' | 'month' = 'week') {
    const groupedData = this.groupByPeriod(entries, period);
    const trends: { period: string; avg: number; change: number }[] = [];
    
    const periods = Object.keys(groupedData).sort();
    
    for (let i = 0; i < periods.length; i++) {
      const currentPeriod = periods[i];
      const currentEntries = groupedData[currentPeriod];
      const currentAvg = currentEntries.reduce((sum, e) => sum + e.emotionScore, 0) / currentEntries.length;
      
      let change = 0;
      if (i > 0) {
        const previousPeriod = periods[i - 1];
        const previousEntries = groupedData[previousPeriod];
        const previousAvg = previousEntries.reduce((sum, e) => sum + e.emotionScore, 0) / previousEntries.length;
        change = ((currentAvg - previousAvg) / previousAvg) * 100;
      }
      
      trends.push({
        period: currentPeriod,
        avg: Number(currentAvg.toFixed(2)),
        change: Number(change.toFixed(2))
      });
    }
    
    return trends;
  }

  // Calculate journaling patterns
  static analyzePatterns(entries: JournalEntry[]) {
    if (entries.length === 0) {
      return {
        bestDayOfWeek: 'No data',
        worstDayOfWeek: 'No data',
        bestTimeOfDay: 'No data',
        mostProductiveWordCount: 0
      };
    }
    
    // Day of week analysis
    const dayScores: { [key: string]: number[] } = {};
    const timeScores: { [key: string]: number[] } = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.createdAt || entry.date);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();
      
      if (!dayScores[dayOfWeek]) dayScores[dayOfWeek] = [];
      dayScores[dayOfWeek].push(entry.emotionScore);
      
      const timeOfDay = hour < 6 ? 'Early Morning' :
                       hour < 12 ? 'Morning' :
                       hour < 18 ? 'Afternoon' : 'Evening';
      
      if (!timeScores[timeOfDay]) timeScores[timeOfDay] = [];
      timeScores[timeOfDay].push(entry.emotionScore);
    });
    
    const bestDayOfWeek = this.getBestCategory(dayScores);
    const worstDayOfWeek = this.getWorstCategory(dayScores);
    const bestTimeOfDay = this.getBestCategory(timeScores);
    
    // Word count analysis
    const avgWordCountByScore = entries.reduce((acc, entry) => {
      const scoreRange = Math.floor(entry.emotionScore);
      if (!acc[scoreRange]) acc[scoreRange] = [];
      acc[scoreRange].push(entry.wordCount);
      return acc;
    }, {} as { [key: number]: number[] });
    
    let mostProductiveWordCount = 0;
    let highestAvgScore = 0;
    
    Object.entries(avgWordCountByScore).forEach(([score, wordCounts]) => {
      const avgWordCount = wordCounts.reduce((sum, wc) => sum + wc, 0) / wordCounts.length;
      if (Number(score) > highestAvgScore) {
        highestAvgScore = Number(score);
        mostProductiveWordCount = Math.round(avgWordCount);
      }
    });
    
    return {
      bestDayOfWeek,
      worstDayOfWeek,
      bestTimeOfDay,
      mostProductiveWordCount
    };
  }

  // Calculate streak data
  static calculateStreaks(entries: JournalEntry[]) {
    if (entries.length === 0) {
      return { current: 0, longest: 0, type: 'neutral' as const };
    }
    
    const sortedEntries = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const threshold = 6; // Scores >= 6 are positive, <= 4 are negative
    
    let currentStreak = 0;
    let longestStreak = 0;
    let currentType: 'positive' | 'negative' | 'neutral' = 'neutral';
    let tempStreakLength = 0;
    let tempStreakType: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    for (let i = sortedEntries.length - 1; i >= 0; i--) {
      const entry = sortedEntries[i];
      const entryType = entry.emotionScore >= threshold ? 'positive' :
                       entry.emotionScore <= 4 ? 'negative' : 'neutral';
      
      if (i === sortedEntries.length - 1) {
        currentType = entryType;
        currentStreak = 1;
        tempStreakType = entryType;
        tempStreakLength = 1;
      } else {
        if (entryType === currentType && entryType !== 'neutral') {
          currentStreak++;
        } else {
          currentStreak = entryType !== 'neutral' ? 1 : 0;
          currentType = entryType;
        }
      }
      
      // Track longest streak throughout history
      if (entryType === tempStreakType && entryType !== 'neutral') {
        tempStreakLength++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreakLength);
        tempStreakLength = entryType !== 'neutral' ? 1 : 0;
        tempStreakType = entryType;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreakLength);
    
    return {
      current: currentStreak,
      longest: longestStreak,
      type: currentType
    };
  }

  // Generate complete privacy-safe analytics
  static generatePrivacyAnalytics(entries: JournalEntry[]): PrivacyAnalytics {
    const rollingAverages = this.calculateRollingAverages(entries, 7);
    const weeklyTrends = this.calculatePeriodTrends(entries, 'week');
    const monthlyTrends = this.calculatePeriodTrends(entries, 'month');
    const outlierDates = this.detectOutliers(entries);
    const streakData = this.calculateStreaks(entries);
    const patterns = this.analyzePatterns(entries);
    
    // Summary statistics
    const scores = entries.map(e => e.emotionScore);
    const avgMoodScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
    const moodStability = scores.length > 1 ? this.calculateVariance(scores, avgMoodScore) : 0;
    
    // Growth trend analysis
    let growthTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (weeklyTrends.length >= 2) {
      const recentTrend = weeklyTrends.slice(-2);
      const avgChange = recentTrend.reduce((sum, t) => sum + t.change, 0) / recentTrend.length;
      growthTrend = avgChange > 5 ? 'improving' : avgChange < -5 ? 'declining' : 'stable';
    }
    
    return {
      rollingAverages,
      weeklyTrends,
      monthlyTrends,
      outlierDates,
      streakData,
      patterns,
      summary: {
        totalEntries: entries.length,
        avgMoodScore: Number(avgMoodScore.toFixed(2)),
        moodStability: Number(moodStability.toFixed(2)),
        growthTrend
      }
    };
  }

  // Utility methods
  private static calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private static calculateVariance(numbers: number[], mean: number): number {
    if (numbers.length <= 1) return 0;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (numbers.length - 1);
  }

  private static groupByPeriod(entries: JournalEntry[], period: 'week' | 'month') {
    const grouped: { [key: string]: JournalEntry[] } = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.date);
      let key: string;
      
      if (period === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    });
    
    return grouped;
  }

  private static getBestCategory(categoryScores: { [key: string]: number[] }): string {
    let bestCategory = 'No data';
    let highestAvg = 0;
    
    Object.entries(categoryScores).forEach(([category, scores]) => {
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avg > highestAvg) {
        highestAvg = avg;
        bestCategory = category;
      }
    });
    
    return bestCategory;
  }

  private static getWorstCategory(categoryScores: { [key: string]: number[] }): string {
    let worstCategory = 'No data';
    let lowestAvg = 10;
    
    Object.entries(categoryScores).forEach(([category, scores]) => {
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avg < lowestAvg) {
        lowestAvg = avg;
        worstCategory = category;
      }
    });
    
    return worstCategory;
  }
}