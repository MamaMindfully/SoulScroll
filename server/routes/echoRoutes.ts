import { Router, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { captureError } from "../utils/errorHandler";

const router = Router();

// Get latest echo for user (following your pattern)
router.get('/api/echo', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter required' });
    }

    logger.info('Fetching latest echo', { userId });

    try {
      const echo = await storage.getLatestEcho(userId as string);

      if (!echo) {
        // Return a fallback echo for demo purposes
        const fallbackEchoes = [
          "Your words ripple through the quiet spaces of understanding.",
          "Each reflection builds upon the last, weaving patterns of growth.",
          "In the silence between thoughts, wisdom takes root.",
          "Your journey reveals itself one insight at a time.",
          "The echoes of your reflections whisper truths yet to be discovered."
        ];
        
        const randomEcho = fallbackEchoes[Math.floor(Math.random() * fallbackEchoes.length)];
        return res.json({ echo: randomEcho });
      }

      // Return just the echo text like your pattern
      res.json({ echo: echo.echo });
    } catch (dbError) {
      // Database fallback - return a poetic echo for demo
      const fallbackEchoes = [
        "Your thoughts create gentle waves in the ocean of consciousness.",
        "Memory holds your insights like seeds waiting to bloom.",
        "The patterns of your heart speak louder than words.",
        "In the garden of reflection, wisdom quietly grows.",
        "Your inner voice echoes through chambers of possibility."
      ];
      
      const randomEcho = fallbackEchoes[Math.floor(Math.random() * fallbackEchoes.length)];
      res.json({ echo: randomEcho });
    }

  } catch (error: any) {
    captureError(error, {
      userId: req.query.userId as string,
      operation: 'fetch_echo'
    });

    logger.error('Failed to fetch echo', {
      error: error.message,
      userId: req.query.userId
    });

    res.status(500).json({ error: 'Failed to fetch echo' });
  }
});

// Get echo history for authenticated user
router.get('/api/echo/history', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const limit = parseInt(req.query.limit as string) || 10;

    logger.info('Fetching echo history', { userId: user.id, limit });

    const echoHistory = await storage.getEchoHistory(user.id, limit);

    res.json({
      echoes: echoHistory.map(echo => ({
        id: echo.id,
        echo: echo.echo,
        createdAt: echo.createdAt,
        sourceInsights: echo.sourceInsights || []
      }))
    });

  } catch (error: any) {
    captureError(error, {
      userId: req.user?.id,
      operation: 'fetch_echo_history'
    });

    logger.error('Failed to fetch echo history', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to fetch echo history',
      details: error.message
    });
  }
});

export default router;