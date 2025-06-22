import { storage } from '../storage';
import { logger } from './logger';

export async function logEmotionTrend({ 
  userId, 
  score, 
  dominantEmotion 
}: {
  userId: string;
  score: number;
  dominantEmotion: string;
}) {
  try {
    const today = new Date().toISOString().split('T')[0];

    await storage.upsertEmotionTrend(userId, {
      date: today,
      score,
      dominantEmotion
    });

    logger.info('Emotion trend logged', { userId, score, dominantEmotion, date: today });

  } catch (error: any) {
    logger.error('Failed to log emotion trend', { 
      error: error.message, 
      userId, 
      score, 
      dominantEmotion 
    });
  }
}

export async function getEmotionTrends(userId: string, days: number = 30) {
  try {
    const trends = await storage.getEmotionTrends(userId, days);
    
    // Calculate statistics
    const scores = trends.map(t => t.score);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;

    // Count emotion frequencies
    const emotionCounts = trends.reduce((acc, trend) => {
      acc[trend.dominantEmotion] = (acc[trend.dominantEmotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

    return {
      trends,
      stats: {
        avgScore: Math.round(avgScore * 100) / 100,
        minScore,
        maxScore,
        dominantEmotion,
        totalDays: trends.length,
        emotionBreakdown: emotionCounts
      }
    };

  } catch (error: any) {
    logger.error('Failed to get emotion trends', { 
      error: error.message, 
      userId 
    });
    
    return {
      trends: [],
      stats: {
        avgScore: 0,
        minScore: 0,
        maxScore: 0,
        dominantEmotion: 'neutral',
        totalDays: 0,
        emotionBreakdown: {}
      }
    };
  }
}