import { Router, Request, Response } from "express";
import { logger } from "../utils/logger";
import { logEmotionTrend, getEmotionTrends } from "../utils/emotionTrendLogger";
import { rateLimit } from "../utils/rateLimit";

const router = Router();

// Log emotion trend
router.post('/api/emotion-trend', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;
    const { score, dominantEmotion } = req.body;

    // Rate limiting
    if (!rateLimit(userId, 10, 60000)) { // 10 requests per minute
      return res.status(429).json({ 
        error: 'Too many emotion updates. Please wait before logging another trend.' 
      });
    }

    // Validate input
    if (typeof score !== 'number' || score < -100 || score > 100) {
      return res.status(400).json({ 
        error: 'Score must be a number between -100 and 100' 
      });
    }

    if (!dominantEmotion || typeof dominantEmotion !== 'string') {
      return res.status(400).json({ 
        error: 'Dominant emotion is required' 
      });
    }

    await logEmotionTrend({ userId, score, dominantEmotion });

    logger.info('Emotion trend logged successfully', { 
      userId, 
      score, 
      dominantEmotion 
    });

    res.json({ 
      success: true, 
      message: 'Emotion trend logged successfully' 
    });

  } catch (error: any) {
    logger.error('Failed to log emotion trend', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to log emotion trend' });
  }
});

// Get emotion trends
router.get('/api/emotion-trends', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;
    const days = parseInt(req.query.days as string) || 30;

    const trendsData = await getEmotionTrends(userId, days);

    res.json(trendsData);

  } catch (error: any) {
    logger.error('Failed to get emotion trends', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to get emotion trends' });
  }
});

export default router;