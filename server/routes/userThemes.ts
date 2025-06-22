import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { captureError } from "../utils/errorHandler";

const router = Router();

// Get user themes
router.get('/api/user/themes', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter required' });
    }

    logger.info('Fetching user themes', { userId });

    const themes = await storage.getTopUserThemes(userId as string, 10);

    res.json({ 
      themes: themes.map(theme => ({
        tag: theme.tag,
        strength: theme.strength,
        lastSeen: theme.lastSeen
      }))
    });

  } catch (error: any) {
    captureError(error, {
      userId: req.query.userId as string,
      operation: 'fetch_user_themes'
    });

    logger.error('Failed to fetch user themes', {
      error: error.message,
      userId: req.query.userId
    });

    res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

export default router;