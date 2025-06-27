import { Router, Request, Response } from "express";
import { logger } from "../utils/logger";
import { storage } from "../storage";
import OpenAI from "openai";
import { retryOpenAICall } from "../utils/retryUtils";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Get today's personalized insight with caching
router.get('/api/today-insight', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;

    logger.info('Generating personalized insight for today', { userId });

    // Get user traits for personalization
    const traits = await storage.getUserTraits(userId);
    const recentEntries = await storage.getJournalEntries(userId, 3, 0);
    const recentThemes = await storage.getTopUserThemes(userId, 3);

    // Build personalized context
    const personalizedContext = {
      writingStyle: traits?.writingStyle || 'balanced',
      moodBaseline: traits?.moodBaseline || 50,
      likesAffirmations: traits?.likesAffirmations || false,
      likesQuestions: traits?.likesQuestions || true,
      recentThemes: recentThemes.map(t => t.tag),
      recentMoodTrend: recentEntries.length > 0 ? 
        recentEntries.reduce((sum, entry) => sum + (entry.emotionalTone || 0), 0) / recentEntries.length : 0
    };

    const promptType = traits?.likesAffirmations ? 'affirmation' : 'reflection';
    
    // Generate personalized insight based on user preferences
    const systemPrompt = `You are a wise, personalized AI companion. Generate a ${promptType} for today based on the user's profile:

Writing Style: ${personalizedContext.writingStyle}
Mood Baseline: ${personalizedContext.moodBaseline}/100
Prefers: ${personalizedContext.likesAffirmations ? 'Affirmations' : 'Reflective Questions'}
Recent Themes: ${personalizedContext.recentThemes.join(', ') || 'New journey'}
Recent Mood: ${personalizedContext.recentMoodTrend > 0 ? 'Positive' : personalizedContext.recentMoodTrend < -0.3 ? 'Challenging' : 'Neutral'}

${promptType === 'affirmation' ? 
  'Create a supportive affirmation that resonates with their recent themes and current mood.' :
  'Create a thoughtful question that invites deeper reflection on their recent patterns.'
}

Keep it under 30 words and match their preferred writing style.`;

    const response = await retryOpenAICall(
      () => openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate today\'s personalized insight.' }
        ],
        temperature: 0.8,
        max_tokens: 100
      }),
      'personalized-insight'
    );

    const insight = response.choices[0].message.content?.trim() || 
      (promptType === 'affirmation' ? 
        'You are exactly where you need to be in your journey.' :
        'What part of yourself is asking for your attention today?'
      );

    const result = {
      insight,
      type: promptType,
      personalized: true,
      basedOn: {
        themes: personalizedContext.recentThemes,
        style: personalizedContext.writingStyle,
        mood: personalizedContext.recentMoodTrend
      },
      timestamp: new Date().toISOString()
    };

    logger.info('Personalized insight generated', { 
      userId, 
      type: promptType, 
      themesCount: personalizedContext.recentThemes.length 
    });

    res.json(result);

  } catch (error: any) {
    logger.error('Personalized insight generation failed', { 
      error: error.message, 
      userId: req.user?.id 
    });

    // Fallback insight based on user traits
    const traits = await storage.getUserTraits(req.user?.id || '').catch(() => null);
    const fallbackType = traits?.likesAffirmations ? 'affirmation' : 'reflection';
    
    const fallbackInsights = {
      affirmation: [
        'Your journey is unfolding perfectly in its own time.',
        'You carry within you everything you need to thrive.',
        'This moment holds infinite possibilities for growth.'
      ],
      reflection: [
        'What is your heart trying to tell you today?',
        'Which part of your story deserves more attention?',
        'How can you honor both your growth and your rest today?'
      ]
    };

    const randomInsight = fallbackInsights[fallbackType][
      Math.floor(Math.random() * fallbackInsights[fallbackType].length)
    ];

    res.json({
      insight: randomInsight,
      type: fallbackType,
      personalized: false,
      fallback: true,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;