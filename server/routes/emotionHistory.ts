import { Router, Request, Response } from "express";
import { logger } from "../utils/logger";
import { storage } from "../storage";

const router = Router();

// Get emotion history for timeline visualization
router.get('/api/emotion-history', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;
    const limit = parseInt(req.query.limit as string) || 30;

    logger.info('Fetching emotion history', { userId, limit });

    // Get recent journal entries with emotion scores
    const entries = await storage.getJournalEntries(userId, limit, 0);
    
    if (!entries || entries.length === 0) {
      return res.json([]);
    }
    
    const emotionHistory = entries
      .filter(entry => entry.emotionalTone !== null || entry.wordCount > 0)
      .map(entry => ({
        id: entry.id,
        date: entry.createdAt,
        emotionScore: entry.emotionalTone ? 
          Math.round((entry.emotionalTone + 1) * 50) : // Convert -1 to 1 scale to 0-100
          Math.min(Math.max(entry.wordCount * 2, 20), 80), // Fallback based on word count
        content: entry.content?.substring(0, 100),
        createdAt: entry.createdAt
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    logger.info('Emotion history retrieved', { userId, count: emotionHistory.length });

    res.json(emotionHistory);

  } catch (error: any) {
    logger.error('Failed to fetch emotion history', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(500).json({ 
      error: 'Failed to fetch emotion history',
      fallback: []
    });
  }
});

export default router;