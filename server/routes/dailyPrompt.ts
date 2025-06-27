import { Router, Request, Response } from "express";
import { OpenAI } from 'openai';
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { captureError } from "../utils/errorHandler";
import { retryOpenAICall } from "../utils/retryUtils";
import { determinePreferredPromptStyle, getPromptSystemMessage } from "../utils/promptTuner";
import { getThemeBasedPromptContext } from "../engines/themeExtractor";
import { z } from "zod";

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
          type: "reflection",
          message: "What is one thing you're grateful for in this moment?" 
        });
      }

      // Get user stats for personalization
      const user = await storage.getUser(userId as string);
      const userStats = {
        affirmation_ratio: user?.affirmationRatio || 0.5,
        reflection_ratio: user?.reflectionRatio || 0.5
      };

      const tone = determinePreferredPromptStyle(userStats);
      const themeContext = await getThemeBasedPromptContext(userId as string);
      
      const baseSystemMessage = `You are a mindful ritual assistant. ${themeContext ? themeContext + '.' : ''} Respond based on this tone: "${tone}".`;
      
      const prompt = `${baseSystemMessage}

Using these insights and themes, craft a ${tone === 'affirming' ? 'affirmation' : tone === 'probing' ? 'reflective question' : 'balanced message'}.

Return JSON: { "type": "affirmation" | "reflection", "message": "..." }

Recent insights:
${insights}`;

      const response = await retryOpenAICall(
        () => openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 100
        }),
        'daily-prompt-generation'
      );

      const responseText = response.choices[0].message.content?.trim();
      
      try {
        const { type, message } = JSON.parse(responseText || '{}');
        
        // Store prompt feedback entry
        const today = new Date().toISOString().split('T')[0];
        await storage.createPromptFeedback(userId as string, {
          date: today,
          type: type || 'reflection',
          feedback: null // Will be updated when user gives feedback
        });

        logger.info('Daily prompt generated', { userId, type, messageLength: message?.length });

        res.json({ type, message });
      } catch (parseError) {
        // Fallback if JSON parsing fails
        const fallbackType = tone === 'affirming' ? 'affirmation' : 'reflection';
        const fallbackMessage = responseText || "What intention would you like to set for today?";
        
        res.json({ 
          type: fallbackType, 
          message: fallbackMessage 
        });
      }

    } catch (dbError) {
      // Database fallback - return thoughtful prompts with type
      const fallbackPrompts = [
        { type: "reflection", message: "What intention would you like to set for today?" },
        { type: "affirmation", message: "You have everything within you to create a meaningful day." },
        { type: "reflection", message: "How are you feeling in this very moment?" },
        { type: "affirmation", message: "Today is an opportunity to grow and learn." },
        { type: "reflection", message: "What story is your heart trying to tell you today?" }
      ];
      
      const randomPrompt = fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)];
      return res.json(randomPrompt);
    }

  } catch (error: any) {
    captureError(error, {
      userId: req.query.userId as string,
      operation: 'generate_daily_prompt'
    });

    logger.error('Failed to generate daily prompt', {
      error: error.message,
      userId: req.query.userId
    });

    // Return fallback prompt with type
    res.json({ 
      type: "reflection",
      message: "What intention would you like to set for today?" 
    });
  }
});

// Prompt feedback endpoint
router.post('/api/daily-prompt/feedback', async (req: Request, res: Response) => {
  try {
    const { userId, feedback } = req.body;
    
    if (!userId || !feedback) {
      return res.status(400).json({ error: 'userId and feedback are required' });
    }

    if (!['liked', 'skipped'].includes(feedback)) {
      return res.status(400).json({ error: 'feedback must be "liked" or "skipped"' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Update the most recent prompt feedback for today
    const recentFeedback = await storage.getPromptFeedback(userId, 1);
    
    if (recentFeedback.length > 0 && recentFeedback[0].date === today) {
      // Update existing feedback (would need to implement updatePromptFeedback method)
      logger.info('Prompt feedback received', { userId, feedback, type: recentFeedback[0].type });
      
      // Update user ratios based on feedback
      await storage.updateUserPromptRatios(userId);
      
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'No recent prompt found for today' });
    }

  } catch (error: any) {
    captureError(error, {
      userId: req.body.userId,
      operation: 'prompt_feedback'
    });

    logger.error('Failed to process prompt feedback', {
      error: error.message,
      userId: req.body.userId
    });

    res.status(500).json({ error: 'Failed to process feedback' });
  }
});

export default router;