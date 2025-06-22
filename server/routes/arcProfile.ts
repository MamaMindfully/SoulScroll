import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { captureError } from "../utils/errorHandler";

const router = Router();

// Get Arc profile settings
router.get('/api/arc-profile', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter required' });
    }

    logger.info('Fetching Arc profile', { userId });

    const profile = await storage.getArcProfile(userId as string);

    if (!profile) {
      // Return default profile if user not found
      return res.json({
        arc_tone: 'poetic',
        arc_prompt_style: 'reflection',
        arc_depth: 'introspective'
      });
    }

    res.json({
      arc_tone: profile.arcTone,
      arc_prompt_style: profile.arcPromptStyle,
      arc_depth: profile.arcDepth
    });

  } catch (error: any) {
    captureError(error, {
      userId: req.query.userId as string,
      operation: 'fetch_arc_profile'
    });

    logger.error('Failed to fetch Arc profile', {
      error: error.message,
      userId: req.query.userId
    });

    res.status(500).json({ error: 'Failed to fetch Arc profile' });
  }
});

// Update Arc profile settings
router.post('/api/arc-profile', async (req: Request, res: Response) => {
  try {
    const { userId, arc_tone, arc_prompt_style, arc_depth } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Validate the values
    const validTones = ['poetic', 'grounded', 'scientific', 'mystical'];
    const validStyles = ['affirmation', 'reflection'];
    const validDepths = ['light', 'introspective', 'transformative'];

    if (arc_tone && !validTones.includes(arc_tone)) {
      return res.status(400).json({ error: 'Invalid arc_tone value' });
    }

    if (arc_prompt_style && !validStyles.includes(arc_prompt_style)) {
      return res.status(400).json({ error: 'Invalid arc_prompt_style value' });
    }

    if (arc_depth && !validDepths.includes(arc_depth)) {
      return res.status(400).json({ error: 'Invalid arc_depth value' });
    }

    logger.info('Updating Arc profile', { 
      userId, 
      arc_tone, 
      arc_prompt_style, 
      arc_depth 
    });

    await storage.updateArcProfile(userId, {
      arcTone: arc_tone,
      arcPromptStyle: arc_prompt_style,
      arcDepth: arc_depth
    });

    res.json({ success: true });

  } catch (error: any) {
    captureError(error, {
      userId: req.body.userId,
      operation: 'update_arc_profile'
    });

    logger.error('Failed to update Arc profile', {
      error: error.message,
      userId: req.body.userId
    });

    res.status(500).json({ error: 'Failed to update Arc profile' });
  }
});

export default router;