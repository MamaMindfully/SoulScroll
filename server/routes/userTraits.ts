import { Router, Request, Response } from "express";
import { logger } from "../utils/logger";
import { storage } from "../storage";
import { z } from "zod";

const router = Router();

// Get user traits
router.get('/api/user-traits', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;

    const traits = await storage.getUserTraits(userId);
    
    if (!traits) {
      // Create default traits for new user
      const defaultTraits = await storage.upsertUserTraits(userId, {
        writingStyle: 'balanced',
        moodBaseline: 50.0,
        likesAffirmations: false,
        likesQuestions: true,
        peakHours: ['09:00', '21:00']
      });
      
      return res.json(defaultTraits);
    }

    res.json(traits);

  } catch (error: any) {
    logger.error('Failed to get user traits', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to get user traits' });
  }
});

// Update user traits
router.post('/api/user-traits', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;
    
    const updateSchema = z.object({
      writingStyle: z.string().optional(),
      moodBaseline: z.number().optional(),
      likesAffirmations: z.boolean().optional(),
      likesQuestions: z.boolean().optional(),
      peakHours: z.array(z.string()).optional()
    });

    const updates = updateSchema.parse(req.body);
    
    const updatedTraits = await storage.upsertUserTraits(userId, updates);
    
    logger.info('User traits updated', { userId, updates });
    
    res.json(updatedTraits);

  } catch (error: any) {
    logger.error('Failed to update user traits', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to update user traits' });
  }
});

// Track user behavior
router.post('/api/track-behavior', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;
    
    const { event, data } = req.body;
    
    await storage.updateBehaviorMetrics(userId, event, data);
    
    logger.info('Behavior tracked', { userId, event, data });
    
    res.json({ success: true });

  } catch (error: any) {
    logger.error('Failed to track behavior', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to track behavior' });
  }
});

// Validate session endpoint
router.post('/api/auth/validate-session', async (req: Request, res: Response) => {
  try {
    const { session } = req.body;
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    // In a real app, you'd validate the session token with your auth provider
    // For now, we'll just check if the user exists in our database
    const user = await storage.getUser(session.user.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const traits = await storage.getUserTraits(user.id);
    
    res.json({ user, traits });

  } catch (error: any) {
    logger.error('Session validation failed', { error: error.message });
    res.status(401).json({ error: 'Session validation failed' });
  }
});

export default router;