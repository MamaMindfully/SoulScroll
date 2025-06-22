import { Router, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { logger } from "../utils/logger";
import { storage } from "../storage";
import { z } from "zod";

const router = Router();

// Submit insight feedback
router.post('/api/insight-feedback', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;

    const feedbackSchema = z.object({
      insightId: z.string(),
      rating: z.enum(['helpful', 'not_helpful']),
      insightType: z.string().optional()
    });

    const { insightId, rating, insightType } = feedbackSchema.parse(req.body);

    const feedback = await storage.createInsightFeedback(userId, {
      insightId,
      rating
    });

    // Update user behavior metrics based on feedback
    await storage.updateBehaviorMetrics(userId, 'insight_feedback', {
      rating,
      insightType,
      timestamp: new Date().toISOString()
    });

    logger.info('Insight feedback submitted', { userId, insightId, rating, insightType });

    res.json({ success: true, feedback });

  } catch (error: any) {
    logger.error('Failed to submit insight feedback', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get feedback statistics for insights
router.get('/api/insight-feedback/stats', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;
    const { insightId } = req.query;

    if (!insightId) {
      return res.status(400).json({ error: 'insightId is required' });
    }

    const feedbacks = await storage.getInsightFeedback(insightId as string);
    
    const stats = {
      total: feedbacks.length,
      helpful: feedbacks.filter(f => f.rating === 'helpful').length,
      notHelpful: feedbacks.filter(f => f.rating === 'not_helpful').length,
      userFeedback: feedbacks.find(f => f.userId === userId)?.rating || null
    };

    res.json(stats);

  } catch (error: any) {
    logger.error('Failed to get insight feedback stats', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to get feedback statistics' });
  }
});

// Get user's feedback history
router.get('/api/user-feedback-history', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;

    // This would require a different query in a real implementation
    // For now, return a summary based on behavior metrics
    const userTraits = await storage.getUserTraits(userId);
    
    const mockHistory = {
      totalFeedbacks: 0,
      helpfulRatio: 0,
      recentFeedbacks: [],
      preferredInsightTypes: userTraits?.likesAffirmations ? ['affirmation'] : ['reflection']
    };

    res.json(mockHistory);

  } catch (error: any) {
    logger.error('Failed to get user feedback history', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to get feedback history' });
  }
});

export default router;