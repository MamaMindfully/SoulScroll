import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { captureError } from "../utils/errorHandler";
import { retryOpenAICall } from "../utils/retryUtils";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Generate monthly constellation
router.post('/api/generate-monthly-constellation', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    logger.info('Generating monthly constellation', { userId });

    // Calculate date threshold (30 days ago)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch recent journal entries
    const allEntries = await storage.getJournalEntries(userId, 100, 0);
    const recentEntries = allEntries.filter(entry => 
      entry.createdAt && new Date(entry.createdAt) >= thirtyDaysAgo
    );

    if (!recentEntries || recentEntries.length < 5) {
      return res.status(400).json({ 
        error: 'Not enough journal entries for constellation generation. Write more entries and try again.' 
      });
    }

    // Prepare insights and emotions for analysis
    const insights = recentEntries
      .filter(entry => entry.aiResponse)
      .map(entry => ({
        insight: entry.aiResponse,
        emotion: entry.themes?.[0] || 'reflection'
      }));

    if (insights.length < 3) {
      return res.status(400).json({ 
        error: 'Not enough insights for constellation generation.' 
      });
    }

    const prompt = `
You're a reflective guide who creates poetic summaries of emotional evolution.

Given these journal insights and emotions from the past 30 days:
${insights.map(e => `- "${e.insight}" [${e.emotion}]`).join('\n')}

Please return a poetic constellation summary in this JSON format:

{
  "title": "The Season of ______",
  "themes": ["grief", "growth", "control"],
  "summary": "This was a month of learning how to release without needing to be ready...",
  "guiding_question": "What part of you still clings to what is already gone?"
}

The title should be evocative and seasonal. The themes should be 2-4 key emotional patterns. The summary should be a poetic reflection on the month's journey. The guiding question should invite deeper contemplation.
    `;

    const response = await retryOpenAICall(
      () => openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 400
      }),
      'monthly-constellation'
    );

    const responseText = response.choices[0].message.content?.trim();
    
    let constellationData;
    try {
      constellationData = JSON.parse(responseText || '{}');
      
      if (!constellationData.title || !constellationData.summary) {
        throw new Error('Incomplete constellation data received');
      }
    } catch (parseError) {
      logger.error('Failed to parse constellation response', { 
        userId, 
        response: responseText,
        error: parseError.message 
      });
      return res.status(500).json({ error: 'Failed to generate constellation' });
    }

    // Save constellation to database
    const savedConstellation = await storage.createMonthlyConstellation(userId, {
      title: constellationData.title,
      themes: constellationData.themes || [],
      summary: constellationData.summary,
      guidingQuestion: constellationData.guiding_question || constellationData.guidingQuestion,
      entryCount: recentEntries.length
    });

    logger.info('Monthly constellation generated and saved', { 
      userId, 
      constellationId: savedConstellation.id,
      title: savedConstellation.title,
      entryCount: recentEntries.length
    });

    res.json({ 
      message: 'Constellation saved successfully',
      constellation: {
        id: savedConstellation.id,
        title: savedConstellation.title,
        themes: savedConstellation.themes,
        summary: savedConstellation.summary,
        guidingQuestion: savedConstellation.guidingQuestion,
        entryCount: savedConstellation.entryCount,
        createdAt: savedConstellation.createdAt
      }
    });

  } catch (error: any) {
    captureError(error, {
      userId: req.body.userId,
      operation: 'generate_monthly_constellation'
    });

    logger.error('Failed to generate monthly constellation', {
      error: error.message,
      userId: req.body.userId
    });

    res.status(500).json({ error: 'Failed to generate constellation' });
  }
});

// Get monthly constellations
router.get('/api/monthly-constellations', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter required' });
    }

    logger.info('Fetching monthly constellations', { userId });

    const constellations = await storage.getMonthlyConstellations(userId as string, 12);

    res.json(constellations.map(constellation => ({
      id: constellation.id,
      title: constellation.title,
      themes: constellation.themes || [],
      summary: constellation.summary,
      guidingQuestion: constellation.guidingQuestion,
      entryCount: constellation.entryCount,
      createdAt: constellation.createdAt
    })));

  } catch (error: any) {
    captureError(error, {
      userId: req.query.userId as string,
      operation: 'fetch_monthly_constellations'
    });

    logger.error('Failed to fetch monthly constellations', {
      error: error.message,
      userId: req.query.userId
    });

    res.status(500).json({ error: 'Failed to fetch constellations' });
  }
});

// Check if user should generate a new constellation
router.get('/api/monthly-constellations/should-generate', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter required' });
    }

    const latestConstellation = await storage.getLatestConstellation(userId as string);
    
    let shouldGenerate = false;
    let reason = '';

    if (!latestConstellation) {
      // No constellations exist, check if user has enough entries
      const entries = await storage.getJournalEntries(userId as string, 50, 0);
      const recentEntries = entries.filter(entry => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return entry.createdAt && new Date(entry.createdAt) >= thirtyDaysAgo;
      });
      
      shouldGenerate = recentEntries.length >= 5;
      reason = shouldGenerate ? 'Ready for first constellation' : 'Need more journal entries';
    } else {
      // Check if it's been at least 25 days since last constellation
      const daysSinceLastConstellation = Math.floor(
        (Date.now() - new Date(latestConstellation.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastConstellation >= 25) {
        const allEntries = await storage.getJournalEntries(userId as string, 50, 0);
        const newEntries = allEntries.filter(entry => 
          new Date(entry.createdAt) > new Date(latestConstellation.createdAt)
        );
        
        shouldGenerate = newEntries.length >= 5;
        reason = shouldGenerate ? 'Ready for new constellation' : 'Need more recent entries';
      } else {
        reason = `Wait ${25 - daysSinceLastConstellation} more days`;
      }
    }

    res.json({ 
      shouldGenerate,
      reason,
      hasConstellations: !!latestConstellation,
      lastConstellationDate: latestConstellation?.createdAt || null
    });

  } catch (error: any) {
    captureError(error, {
      userId: req.query.userId as string,
      operation: 'check_constellation_generation'
    });

    logger.error('Failed to check constellation generation status', {
      error: error.message,
      userId: req.query.userId
    });

    res.status(500).json({ error: 'Failed to check status' });
  }
});

export default router;