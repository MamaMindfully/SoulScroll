import { Router, Request, Response } from "express";
import { OpenAI } from 'openai';
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { captureError } from "../utils/errorHandler";
import { retryOpenAICall } from "../utils/retryUtils";

const router = Router();

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Daily prompt based on recent insights
router.get('/api/daily-prompt', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter required' });
    }

    logger.info('Generating daily prompt', { userId });

    try {
      // Fetch recent journal entries
      const journalEntries = await storage.getJournalEntries(userId as string, 3, 0);
      
      const insights = journalEntries
        .map(entry => entry.aiResponse)
        .filter(Boolean)
        .join('\n');

      if (!insights) {
        // Return a generic prompt if no insights available
        return res.json({ 
          dailyMessage: "What is one thing you're grateful for in this moment?" 
        });
      }
    } catch (dbError) {
      // Database fallback - return thoughtful prompts
      const fallbackPrompts = [
        "What intention would you like to set for today?",
        "How are you feeling in this very moment?",
        "What is one thing you're grateful for right now?",
        "What story is your heart trying to tell you today?",
        "If today had a color, what would it be and why?"
      ];
      
      const randomPrompt = fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)];
      return res.json({ dailyMessage: randomPrompt });
    }

    const prompt = `
You are a daily ritual assistant. From these journal reflections, return either:
- One short affirmation to start the day mindfully
OR
- One reflective question the user should consider today.

Be brief. Do NOT include both. Only return the message itself.
---
${insights}
    `;

    const response = await retryOpenAICall(
      () => openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 100
      }),
      'daily-prompt-generation'
    );

    const message = response.choices[0].message.content?.trim() || 
      "Take a moment to breathe deeply and notice what you're feeling right now.";

    logger.info('Daily prompt generated', { userId, messageLength: message.length });

    res.json({ dailyMessage: message });

  } catch (error: any) {
    captureError(error, {
      userId: req.query.userId as string,
      operation: 'generate_daily_prompt'
    });

    logger.error('Failed to generate daily prompt', {
      error: error.message,
      userId: req.query.userId
    });

    // Return fallback prompt
    res.json({ 
      dailyMessage: "What intention would you like to set for today?" 
    });
  }
});

export default router;