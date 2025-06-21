import { openaiClient } from './openaiClient';

export class EmotionAnalyzer {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async analyzeEmotion(text, entryId = null) {
    try {
      console.log('🧠 Analyzing emotion for text:', text.substring(0, 50) + '...');
      
      const result = await openaiClient.scoreEmotion(text, entryId);
      
      if (result.success) {
        console.log('✅ Emotion analysis successful:', result.score);
        return {
          score: result.score,
          label: this.getEmotionLabel(result.score),
          confidence: 0.85,
          success: true
        };
      } else {
        console.warn('⚠️ OpenAI emotion analysis failed, using fallback');
        const fallbackScore = this.calculateFallbackScore(text);
        return {
          score: fallbackScore,
          label: this.getEmotionLabel(fallbackScore),
          confidence: 0.6,
          success: false,
          fallback: true
        };
      }
    } catch (error) {
      console.error('❌ Emotion analysis error:', error);
      const fallbackScore = this.calculateFallbackScore(text);
      return {
        score: fallbackScore,
        label: this.getEmotionLabel(fallbackScore),
        confidence: 0.4,
        success: false,
        error: error.message
      };
    }
  }

  calculateFallbackScore(text) {
    const words = text.toLowerCase().split(/\s+/);
    
    const emotionKeywords = {
      high: ['amazing', 'incredible', 'devastating', 'overwhelming', 'ecstatic', 'furious', 'heartbroken', 'elated'],
      medium: ['happy', 'sad', 'excited', 'worried', 'grateful', 'frustrated', 'hopeful', 'disappointed'],
      low: ['okay', 'fine', 'calm', 'peaceful', 'neutral', 'steady', 'balanced', 'mild']
    };

    let score = 5; // neutral baseline
    
    words.forEach(word => {
      if (emotionKeywords.high.includes(word)) {
        score += 2;
      } else if (emotionKeywords.medium.includes(word)) {
        score += 1;
      } else if (emotionKeywords.low.includes(word)) {
        score += 0.5;
      }
    });

    // Factor in punctuation intensity
    const exclamations = (text.match(/!/g) || []).length;
    const questions = (text.match(/\?/g) || []).length;
    const caps = (text.match(/[A-Z]{2,}/g) || []).length;

    score += exclamations * 0.5 + questions * 0.3 + caps * 0.4;

    return Math.max(1, Math.min(10, Math.round(score)));
  }

  getEmotionLabel(score) {
    if (score >= 9) return { label: 'Intense', color: 'red', description: 'Highly charged emotional state' };
    if (score >= 7) return { label: 'Strong', color: 'orange', description: 'Significant emotional engagement' };
    if (score >= 5) return { label: 'Moderate', color: 'yellow', description: 'Balanced emotional expression' };
    if (score >= 3) return { label: 'Gentle', color: 'green', description: 'Calm emotional state' };
    return { label: 'Peaceful', color: 'blue', description: 'Very calm and centered' };
  }

  async analyzeEmotionalTrends(entries) {
    try {
      console.log('📊 Analyzing emotional trends for', entries.length, 'entries');
      
      const scores = entries.map(entry => ({
        date: entry.createdAt,
        score: entry.emotion_score || this.calculateFallbackScore(entry.content),
        content_preview: entry.content.substring(0, 100)
      }));

      const analysis = this.calculateTrendMetrics(scores);
      console.log('✅ Trend analysis complete:', analysis);
      
      return {
        success: true,
        ...analysis
      };
    } catch (error) {
      console.error('❌ Trend analysis error:', error);
      return {
        success: false,
        error: error.message,
        average_intensity: 5,
        trend_direction: 'stable',
        volatility: 1
      };
    }
  }

  calculateTrendMetrics(scores) {
    if (scores.length === 0) {
      return {
        average_intensity: 5,
        highest_intensity: 5,
        lowest_intensity: 5,
        volatility: 0,
        trend_direction: 'insufficient_data',
        emotional_range: 0,
        total_entries: 0
      };
    }

    const values = scores.map(s => s.score);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    
    // Calculate volatility (standard deviation)
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const volatility = Math.sqrt(variance);

    // Calculate trend direction
    const trendDirection = this.calculateTrendDirection(scores);

    return {
      average_intensity: Math.round(average * 10) / 10,
      highest_intensity: highest,
      lowest_intensity: lowest,
      volatility: Math.round(volatility * 10) / 10,
      trend_direction: trendDirection,
      emotional_range: highest - lowest,
      total_entries: scores.length
    };
  }

  calculateTrendDirection(scores) {
    if (scores.length < 3) return 'insufficient_data';
    
    const recent = scores.slice(-7); // Last 7 entries
    const earlier = scores.slice(-14, -7); // Previous 7 entries
    
    if (recent.length === 0 || earlier.length === 0) return 'insufficient_data';
    
    const recentAvg = recent.reduce((sum, item) => sum + item.score, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, item) => sum + item.score, 0) / earlier.length;
    
    const difference = recentAvg - earlierAvg;
    
    if (Math.abs(difference) < 0.5) return 'stable';
    return difference > 0 ? 'increasing' : 'decreasing';
  }

  async testConnection() {
    try {
      console.log('🧪 Testing emotion analyzer connection...');
      const testResult = await this.analyzeEmotion('I feel happy and content today.');
      console.log('✅ Emotion analyzer test passed:', testResult);
      return testResult.success;
    } catch (error) {
      console.error('❌ Emotion analyzer test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emotionAnalyzer = new EmotionAnalyzer();

// Export convenience functions
export const analyzeEmotion = (text, entryId) => emotionAnalyzer.analyzeEmotion(text, entryId);
export const analyzeEmotionalTrends = (entries) => emotionAnalyzer.analyzeEmotionalTrends(entries);
export const testEmotionConnection = () => emotionAnalyzer.testConnection();