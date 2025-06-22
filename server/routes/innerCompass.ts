import { Router, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { logger } from "../utils/logger";
import OpenAI from "openai";
import { storage } from "../storage";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Inner Compass daily prompt generation
router.get('/api/inner-compass', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;

    logger.info('Generating inner compass prompt', { userId });

    // Get recent journal insights for context
    const recentInsights = await storage.getEmotionalInsights(userId, 'week');
    const recentThemes = await storage.getTopUserThemes(userId, 3);

    // Build context from user's recent themes
    const themeContext = recentThemes.length > 0 
      ? `Recent themes in the user's journey: ${recentThemes.map(t => t.tag).join(', ')}`
      : 'New journaler exploring their inner landscape';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a wise inner compass guide. Create personalized prompts that help users connect with their intuition and emotions. 
          Generate two levels: 
          1. A base prompt that's accessible and inviting
          2. A deeper prompt that encourages profound self-reflection
          
          Focus on emotional awareness, intuitive wisdom, and gentle self-inquiry.
          Keep the base prompt under 25 words, deeper prompt under 35 words.`
        },
        {
          role: 'user',
          content: `Create an inner compass prompt for today. Context: ${themeContext}`
        }
      ],
      temperature: 0.8,
      max_tokens: 150
    });

    const content = response.choices[0].message.content || '';
    
    // Parse the response to extract base and deeper prompts
    const lines = content.split('\n').filter(line => line.trim());
    
    let prompt = {
      base: "What is your heart telling you right now that your mind might be overlooking?",
      deeper: "Sometimes our deepest wisdom comes not from thinking, but from feeling. What emotion is asking for your attention today?"
    };

    // Try to parse structured response
    if (lines.length >= 2) {
      prompt = {
        base: lines[0].replace(/^\d+\.\s*/, '').replace(/^(Base|Surface):\s*/i, '').trim(),
        deeper: lines[1].replace(/^\d+\.\s*/, '').replace(/^(Deeper|Deep):\s*/i, '').trim()
      };
    } else if (lines.length === 1) {
      prompt.base = lines[0].trim();
    }

    // Check if user already has a prompt for today
    const existingPrompt = await storage.getTodaysPrompt(userId);
    
    if (existingPrompt) {
      logger.info('Returning existing prompt for today', { userId });
      return res.json({ prompt: existingPrompt });
    }

    // Save the new prompt to database
    const savedPrompt = await storage.createInnerCompassPrompt(userId, prompt);
    
    logger.info('Inner compass prompt generated and saved', { userId, promptId: savedPrompt.id });

    res.json({ prompt: savedPrompt });

  } catch (error: any) {
    logger.error('Inner compass generation failed', { 
      error: error.message, 
      userId: req.user?.id 
    });

    // Fallback prompts
    const fallbackPrompts = [
      {
        base: "What is your soul whispering to you today?",
        deeper: "Beyond the noise of daily life, what truth is emerging from your depths?"
      },
      {
        base: "What emotion wants to be witnessed right now?",
        deeper: "Each feeling carries wisdom. What is this moment's emotion trying to teach you?"
      },
      {
        base: "How is your heart different today than yesterday?",
        deeper: "Growth often happens in subtle shifts. What internal landscape has changed within you?"
      }
    ];

    const randomPrompt = fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)];
    
    res.json({ prompt: randomPrompt });
  }
});

export default router;