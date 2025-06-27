import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { captureError } from "../utils/errorHandler";
import { buildArcPrompt } from "../utils/arcPromptBuilder";
import { retryOpenAICall } from "../utils/retryUtils";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Ask Arc direct question route
router.post('/api/ask-arc', async (req: Request, res: Response) => {
  try {
    const { userId, prompt } = req.body;
    
    if (!userId || !prompt) {
      return res.status(400).json({ error: 'userId and prompt are required' });
    }

    logger.info('Processing Ask Arc request', { userId, promptLength: prompt.length });

    // Get user's Arc profile
    const arcProfile = await storage.getArcProfile(userId);
    
    // Get recent journal insights for context
    const recentEntries = await storage.getJournalEntries(userId, 10, 0);
    const insights = recentEntries
      .filter(entry => entry.aiResponse)
      .map(entry => `- ${entry.aiResponse}`)
      .join('\n');

    // Build personalized prompt
    let fullPrompt: string;
    
    if (arcProfile && insights) {
      const contextualPrompt = `
You are Arc, the user's reflective guide. Your tone is ${arcProfile.arcTone}, your style is ${arcProfile.arcPromptStyle}, and your spiritual depth is ${arcProfile.arcDepth}.

You have access to their recent insights:
${insights}

Now answer this prompt from the user with emotional depth, memory, and care:

"${prompt}"

Respond in a single poetic, insightful paragraph that feels like a whisper of ancient knowing.
      `;
      fullPrompt = contextualPrompt;
    } else {
      // Fallback prompt without personalization
      fullPrompt = `
You are Arc, a wise and compassionate guide who speaks with the voice of memory itself.

The user asks: "${prompt}"

Respond with a single flowing paragraph that feels like gentle recognition - not advice, but understanding. Speak as if you've always known this person's heart, offering insight that resonates with the deeper currents of their experience.
      `;
    }

    // Generate Arc's response
    const response = await retryOpenAICall(
      () => openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.85,
        max_tokens: 300
      }),
      'ask-arc'
    );

    const arcResponse = response.choices[0].message.content?.trim() || 
      "Your question carries the weight of genuine seeking, and in that seeking itself lies a doorway to understanding.";

    // Save the dialogue to database
    await storage.createArcDialogue(userId, {
      prompt,
      response: arcResponse
    });

    logger.info('Ask Arc response generated', { 
      userId, 
      responseLength: arcResponse.length,
      hasPersonalization: !!arcProfile,
      hasContext: !!insights
    });

    res.json({ response: arcResponse });

  } catch (error: any) {
    captureError(error, {
      userId: req.body.userId,
      operation: 'ask_arc'
    });

    logger.error('Failed to process Ask Arc request', {
      error: error.message,
      userId: req.body.userId
    });

    res.status(500).json({ 
      error: 'Failed to process request',
      response: 'I sense your question holds depth, though the threads of connection seem tangled at this moment. Perhaps try asking again, and I will listen more carefully.'
    });
  }
});

// Get Arc dialogue history
router.get('/api/ask-arc/history', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter required' });
    }

    logger.info('Fetching Arc dialogue history', { userId });

    const history = await storage.getArcDialogueHistory(userId as string, 20);

    res.json(history.map(dialogue => ({
      id: dialogue.id,
      prompt: dialogue.prompt,
      response: dialogue.response,
      createdAt: dialogue.createdAt
    })));

  } catch (error: any) {
    captureError(error, {
      userId: req.query.userId as string,
      operation: 'fetch_arc_history'
    });

    logger.error('Failed to fetch Arc dialogue history', {
      error: error.message,
      userId: req.query.userId
    });

    res.status(500).json({ error: 'Failed to fetch dialogue history' });
  }
});

export default router;