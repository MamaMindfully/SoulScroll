import { apiRequest } from '../lib/queryClient';

export async function scoreEntryEmotion(entryText, entryId) {
  try {
    const response = await apiRequest('POST', '/api/score-emotion', {
      entry_text: entryText,
      entry_id: entryId
    });

    const data = await response.json();
    return data.emotion_score || calculateFallbackScore(entryText);
  } catch (error) {
    console.error('Error scoring entry emotion:', error);
    return calculateFallbackScore(entryText);
  }
}

function calculateFallbackScore(entryText) {
  // Fallback emotional intensity scoring based on text analysis
  const text = entryText.toLowerCase();
  const words = text.split(/\s+/);
  
  // High intensity emotional words
  const highIntensityWords = [
    'overwhelming', 'devastated', 'ecstatic', 'furious', 'terrified',
    'heartbroken', 'elated', 'panicked', 'euphoric', 'agonizing',
    'thrilled', 'mortified', 'overjoyed', 'horrified', 'exhilarated'
  ];
  
  // Medium intensity emotional words
  const mediumIntensityWords = [
    'excited', 'worried', 'happy', 'sad', 'angry', 'anxious',
    'grateful', 'frustrated', 'hopeful', 'disappointed', 'nervous',
    'content', 'upset', 'pleased', 'concerned', 'relieved'
  ];
  
  // Low intensity emotional words
  const lowIntensityWords = [
    'okay', 'fine', 'alright', 'decent', 'calm', 'peaceful',
    'neutral', 'steady', 'stable', 'balanced', 'mild', 'gentle'
  ];

  let score = 5; // Start with neutral
  let wordCount = 0;

  words.forEach(word => {
    if (highIntensityWords.includes(word)) {
      score += 3;
      wordCount++;
    } else if (mediumIntensityWords.includes(word)) {
      score += 2;
      wordCount++;
    } else if (lowIntensityWords.includes(word)) {
      score += 1;
      wordCount++;
    }
  });

  // Factor in text length and punctuation
  const exclamationCount = (entryText.match(/!/g) || []).length;
  const questionCount = (entryText.match(/\?/g) || []).length;
  const capsCount = (entryText.match(/[A-Z]{2,}/g) || []).length;

  score += exclamationCount * 0.5;
  score += questionCount * 0.3;
  score += capsCount * 0.4;

  // Normalize based on text length
  if (words.length > 100) {
    score *= 1.2; // Longer entries tend to be more emotionally rich
  }

  // Ensure score is between 1 and 10
  return Math.max(1, Math.min(10, Math.round(score)));
}

export async function getEmotionalTrends(userId, days = 30) {
  try {
    const response = await apiRequest('GET', `/api/emotional-trends?days=${days}`);
    const trends = await response.json();
    return trends;
  } catch (error) {
    console.error('Error fetching emotional trends:', error);
    return null;
  }
}

export async function analyzeEmotionalPattern(entries) {
  try {
    const scores = entries.map(entry => ({
      date: entry.createdAt,
      score: entry.emotion_score || calculateFallbackScore(entry.content),
      content_preview: entry.content.substring(0, 100)
    }));

    const averageScore = scores.reduce((sum, item) => sum + item.score, 0) / scores.length;
    const highestScore = Math.max(...scores.map(s => s.score));
    const lowestScore = Math.min(...scores.map(s => s.score));
    
    // Calculate volatility (standard deviation)
    const variance = scores.reduce((sum, item) => sum + Math.pow(item.score - averageScore, 2), 0) / scores.length;
    const volatility = Math.sqrt(variance);

    return {
      average_intensity: Math.round(averageScore * 10) / 10,
      highest_intensity: highestScore,
      lowest_intensity: lowestScore,
      volatility: Math.round(volatility * 10) / 10,
      trend_direction: calculateTrendDirection(scores),
      emotional_range: highestScore - lowestScore,
      total_entries: scores.length
    };
  } catch (error) {
    console.error('Error analyzing emotional pattern:', error);
    return null;
  }
}

function calculateTrendDirection(scores) {
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

export async function generateEmotionalInsight(pattern) {
  try {
    const response = await apiRequest('POST', '/api/generate-emotional-insight', {
      pattern: pattern
    });

    const data = await response.json();
    return data.insight;
  } catch (error) {
    console.error('Error generating emotional insight:', error);
    return generateFallbackInsight(pattern);
  }
}

function generateFallbackInsight(pattern) {
  if (!pattern) return "Continue exploring your emotional landscape through journaling.";

  const { average_intensity, trend_direction, volatility } = pattern;

  let insight = "";

  // Base insight on average intensity
  if (average_intensity >= 7) {
    insight = "Your recent entries show high emotional intensity. ";
  } else if (average_intensity >= 4) {
    insight = "Your emotional expression appears balanced and moderate. ";
  } else {
    insight = "Your entries reflect a calm and measured emotional state. ";
  }

  // Add trend information
  if (trend_direction === 'increasing') {
    insight += "There's an upward trend in emotional intensity, suggesting you're processing significant experiences. ";
  } else if (trend_direction === 'decreasing') {
    insight += "Your emotional intensity has been settling, which may indicate growing inner peace or resolution. ";
  } else if (trend_direction === 'stable') {
    insight += "Your emotional patterns show consistency, reflecting stability in your inner world. ";
  }

  // Add volatility insight
  if (volatility > 2) {
    insight += "The variety in your emotional expression shows rich inner experiences worth exploring.";
  } else {
    insight += "Your steady emotional rhythm suggests developing emotional regulation skills.";
  }

  return insight;
}

export async function getHighIntensityEntries(userId, threshold = 7, limit = 10) {
  try {
    const response = await apiRequest('GET', `/api/high-intensity-entries?threshold=${threshold}&limit=${limit}`);
    const entries = await response.json();
    return entries;
  } catch (error) {
    console.error('Error fetching high intensity entries:', error);
    return [];
  }
}

export async function trackEmotionalMilestones(userId) {
  try {
    const response = await apiRequest('GET', '/api/emotional-milestones');
    const milestones = await response.json();
    return milestones;
  } catch (error) {
    console.error('Error tracking emotional milestones:', error);
    return null;
  }
}

export function getEmotionLabel(score) {
  if (score >= 9) return { label: 'Intense', color: 'red', description: 'Highly charged emotional state' };
  if (score >= 7) return { label: 'Strong', color: 'orange', description: 'Significant emotional engagement' };
  if (score >= 5) return { label: 'Moderate', color: 'yellow', description: 'Balanced emotional expression' };
  if (score >= 3) return { label: 'Gentle', color: 'green', description: 'Calm emotional state' };
  return { label: 'Peaceful', color: 'blue', description: 'Very calm and centered' };
}

export async function updateEntryEmotionScore(entryId, score) {
  try {
    const response = await apiRequest('PATCH', `/api/journal/entries/${entryId}/emotion`, {
      emotion_score: score
    });
    return response.json();
  } catch (error) {
    console.error('Error updating entry emotion score:', error);
    return null;
  }
}