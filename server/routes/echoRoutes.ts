import { Router, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { captureError } from "../utils/errorHandler";

const router = Router();

// Get latest echo for user (following your pattern)
router.get('/api/echo', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter required' });
    }

    logger.info('Fetching latest echo', { userId });

    const echo = await storage.getLatestEcho(userId);

    if (!echo) {
      return res.json({ echo: null });
    }

    res.json({ 
      echo: echo.echo,
      createdAt: echo.createdAt,
      id: echo.id
    });

  } catch (error: any) {
    captureError(error, {
      userId: req.query.userId as string,
      operation: 'fetch_echo'
    });

    logger.error('Failed to fetch echo', {
      error: error.message,
      userId: req.query.userId
    });

    res.status(500).json({
      error: 'Failed to fetch echo',
      details: error.message
    });
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