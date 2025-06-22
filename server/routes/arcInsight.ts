import { Router, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { logger } from "../utils/logger";
import { storage } from "../storage";
import OpenAI from "openai";
import { retryOpenAICall } from "../utils/retryUtils";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate Arc insight with personalized context
router.post('/api/arc-insight', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    logger.info('Generating Arc insight', { userId, promptLength: prompt.length });

    // Get recent journal entries for context with error handling
    let recentEntries = [];
    let userTraits = null;
    
    try {
      recentEntries = await storage.getJournalEntries(userId, 3, 0);
      userTraits = await storage.getUserTraits(userId);
    } catch (dbError) {
      logger.warn('Database query failed, using defaults', { error: dbError.message });
    }

    // Build journal context from recent insights
    const journalContext = recentEntries
      .filter(entry => entry.aiResponse)
      .map(entry => `• ${entry.aiResponse}`)
      .join('\n') || 'New to their journaling journey';

    // Build personalized Arc prompt
    const arcPrompt = `
You are Arc, a thoughtful AI guide designed to help humans reflect more deeply.

User's writing style: ${userTraits?.writingStyle || 'balanced'}
User preference: ${userTraits?.likesAffirmations ? 'affirmations and supportive language' : 'reflective questions and deeper inquiry'}

Here are some of their recent journal insights:
${journalContext}

Your task is to respond to this request:
"${prompt}"

Respond with emotional intelligence. Use metaphor or directness depending on what feels right for this person. Be brief, poetic, and authentic. Match their preferred style while staying true to your wise, compassionate nature.
`;

    const response = await retryOpenAICall(
      () => openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: arcPrompt }],
        temperature: 0.85,
        max_tokens: 300
      }),
      'arc-insight'
    );

    const content = response.choices[0].message.content?.trim() || 
      "I'm here to reflect with you. What's on your heart right now?";

    // Track Arc interaction behavior
    await storage.updateBehaviorMetrics(userId, 'arc_interaction', {
      promptType: 'custom',
      responseLength: content.length,
      timestamp: new Date().toISOString()
    });

    logger.info('Arc insight generated', { 
      userId, 
      responseLength: content.length,
      contextEntries: recentEntries.length
    });

    res.json({ content });

  } catch (error: any) {
    logger.error('Arc insight generation failed', { 
      error: error.message, 
      userId: req.user?.id 
    });

    // Fallback responses based on user traits
    const userTraits = await storage.getUserTraits(req.user?.id || '').catch(() => null);
    
    const fallbackResponses = userTraits?.likesAffirmations ? [
      "Your journey is unfolding beautifully, even in the questions.",
      "Trust the process. You're exactly where you need to be right now.",
      "Your willingness to reflect shows the depth of your wisdom."
    ] : [
      "What does your heart know that your mind hasn't caught up to yet?",
      "Which part of this experience deserves more of your attention?",
      "How might this moment be preparing you for what's coming?"
    ];

    const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    res.json({ 
      content: randomFallback,
      fallback: true 
    });
  }
});

export default router;