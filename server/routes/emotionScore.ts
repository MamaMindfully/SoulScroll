import { Router, Request, Response } from "express";
import { OpenAI } from "openai";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { z } from "zod";

const router = Router();
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Validation schema
const emotionScoreSchema = z.object({
  journalText: z.string().min(1, "Journal text is required"),
  userId: z.string().optional()
});

// POST /api/emotion-score
router.post('/api/emotion-score', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { journalText } = emotionScoreSchema.parse(req.body);
    const user = req.user;

    logger.info('Processing emotion score analysis', { 
      userId: user.id, 
      textLength: journalText.length 
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: `You are an emotional analysis model. Return a JSON object with an "emotion" (e.g., joy, sadness, anxiety, excitement, calm, frustration) and an "intensity" score from 0 to 100. Be concise and accurate.
          
          Example response: {"emotion": "contentment", "intensity": 65}` 
        },
        { 
          role: 'user', 
          content: `Analyze this journal entry:\n\n${journalText}` 
        }
      ],
      temperature: 0.2,
      max_tokens: 100
    });

    let parsed;
    try {
      const content = response.choices[0].message.content?.trim() || '{}';
      parsed = JSON.parse(content);
    } catch (parseError) {
      // Fallback emotion analysis
      parsed = generateFallbackEmotion(journalText);
      logger.warn('Failed to parse AI emotion response, using fallback', { userId: user.id });
    }

    // Validate parsed response
    if (!parsed.emotion || typeof parsed.intensity !== 'number') {
      parsed = generateFallbackEmotion(journalText);
    }

    // Ensure intensity is within valid range
    parsed.intensity = Math.max(0, Math.min(100, parsed.intensity));

    // Save emotion score to database
    await saveEmotionScoreToDB(user.id, {
      date: new Date().toISOString().split('T')[0],
      emotion: parsed.emotion,
      intensity: parsed.intensity,
      journalText: journalText.substring(0, 500) // Store preview for context
    });

    logger.info('Emotion score analysis completed', { 
      userId: user.id,
      emotion: parsed.emotion,
      intensity: parsed.intensity
    });

    res.json({
      emotion: parsed.emotion,
      intensity: parsed.intensity,
      date: new Date().toISOString().split('T')[0]
    });

  } catch (error: any) {
    logger.error('Emotion score analysis failed:', { 
      error: error.message,
      userId: req.user?.id 
    });
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    
    res.status(500).json({ 
      error: 'Emotion scoring failed',
      fallback: generateFallbackEmotion(req.body.journalText || '')
    });
  }
});

// GET /api/emotion-history - Get user's emotion history for charting
router.get('/api/emotion-history', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { days = '30' } = req.query;
    
    const daysNumber = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNumber);

    logger.info('Fetching emotion history', { 
      userId: user.id, 
      days: daysNumber 
    });

    // Get emotion scores from database
    const emotionHistory = await getEmotionHistoryFromDB(user.id, startDate);

    res.json({
      emotions: emotionHistory,
      summary: {
        totalEntries: emotionHistory.length,
        averageIntensity: emotionHistory.reduce((sum, entry) => sum + entry.intensity, 0) / (emotionHistory.length || 1),
        mostCommonEmotion: getMostCommonEmotion(emotionHistory),
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        }
      }
    });

  } catch (error: any) {
    logger.error('Failed to fetch emotion history:', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to fetch emotion history' });
  }
});

// Helper function to save emotion score to database
async function saveEmotionScoreToDB(userId: string, emotionData: {
  date: string;
  emotion: string;
  intensity: number;
  journalText?: string;
}) {
  try {
    // Create emotional insight record
    await storage.createEmotionalInsight(userId, {
      period: 'daily',
      averageMood: Math.round(emotionData.intensity / 10), // Convert to 1-10 scale
      insights: [`Detected emotion: ${emotionData.emotion} with ${emotionData.intensity}% intensity`],
      emotionalPatterns: [emotionData.emotion],
      recommendations: getEmotionRecommendations(emotionData.emotion, emotionData.intensity)
    });

    logger.info('Emotion score saved to database', { 
      userId, 
      emotion: emotionData.emotion,
      intensity: emotionData.intensity 
    });

  } catch (error: any) {
    logger.error('Failed to save emotion score to DB', { 
      userId, 
      error: error.message 
    });
    throw error;
  }
}

// Helper function to get emotion history from database
async function getEmotionHistoryFromDB(userId: string, startDate: Date) {
  try {
    const insights = await storage.getEmotionalInsights(userId, 'month');
    
    // Transform insights into emotion history format
    return insights
      .filter(insight => insight.createdAt >= startDate)
      .map(insight => {
        // Extract emotion from patterns
        const emotion = insight.emotionalPatterns?.[0] || 'neutral';
        const intensity = insight.averageMood * 10; // Convert back to 0-100 scale
        
        return {
          date: insight.createdAt.toISOString().split('T')[0],
          emotion,
          intensity
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  } catch (error: any) {
    logger.error('Failed to get emotion history from DB', { userId, error: error.message });
    return [];
  }
}

// Generate fallback emotion when AI fails
function generateFallbackEmotion(text: string) {
  const positiveWords = /\b(happy|joy|grateful|love|excited|peaceful|calm|content|satisfied|proud)\b/gi;
  const negativeWords = /\b(sad|angry|frustrated|worried|anxious|stressed|disappointed|hurt|lonely|confused)\b/gi;
  const neutralWords = /\b(okay|fine|normal|routine|regular|typical|usual)\b/gi;
  
  const positiveMatches = text.match(positiveWords) || [];
  const negativeMatches = text.match(negativeWords) || [];
  const neutralMatches = text.match(neutralWords) || [];
  
  if (positiveMatches.length > negativeMatches.length && positiveMatches.length > neutralMatches.length) {
    return { emotion: 'contentment', intensity: 70 };
  } else if (negativeMatches.length > positiveMatches.length && negativeMatches.length > neutralMatches.length) {
    return { emotion: 'concern', intensity: 60 };
  } else {
    return { emotion: 'neutral', intensity: 50 };
  }
}

// Get emotion-based recommendations
function getEmotionRecommendations(emotion: string, intensity: number): string[] {
  const recommendations: Record<string, string[]> = {
    joy: ['Savor this positive moment', 'Consider sharing your joy with others', 'Reflect on what brought this happiness'],
    sadness: ['Be gentle with yourself', 'Consider talking to a friend', 'Remember that this feeling will pass'],
    anxiety: ['Try deep breathing exercises', 'Focus on what you can control', 'Consider a mindfulness practice'],
    anger: ['Take a moment to cool down', 'Identify the root cause', 'Express your feelings constructively'],
    calm: ['Appreciate this peaceful state', 'Notice what contributed to this calmness', 'Use this clarity for reflection'],
    excitement: ['Channel this energy positively', 'Plan your next steps', 'Share your enthusiasm mindfully']
  };

  const baseRecommendations = recommendations[emotion.toLowerCase()] || ['Take time for self-reflection', 'Be present with your feelings', 'Practice self-compassion'];
  
  if (intensity > 80) {
    baseRecommendations.push('Consider the intensity of this emotion and what it might be telling you');
  }
  
  return baseRecommendations;
}

// Get most common emotion from history
function getMostCommonEmotion(emotions: Array<{ emotion: string; intensity: number }>) {
  if (emotions.length === 0) return 'neutral';
  
  const emotionCounts = emotions.reduce((acc, entry) => {
    acc[entry.emotion] = (acc[entry.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';
}

export default router;