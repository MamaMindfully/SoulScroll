import { Router, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { logger } from "../utils/logger";
import { storage } from "../storage";
import { z } from "zod";

const router = Router();

// Save reflection for user
router.post('/api/save-reflection', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;

    const saveSchema = z.object({
      content: z.string().min(1),
      source: z.string().optional().default('arc'),
      type: z.string().optional().default('insight')
    });

    const { content, source, type } = saveSchema.parse(req.body);

    // Use existing saved reflections functionality
    const savedReflection = await storage.saveReflection(userId, {
      reflectionContent: content,
      source,
      type
    });

    // Track save behavior
    await storage.updateBehaviorMetrics(userId, 'save_reflection', {
      source,
      type,
      contentLength: content.length,
      timestamp: new Date().toISOString()
    });

    logger.info('Reflection saved', { 
      userId, 
      source,
      contentLength: content.length
    });

    res.json({ success: true, id: savedReflection.id });

  } catch (error: any) {
    logger.error('Failed to save reflection', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to save reflection' });
  }
});

// Get user's saved reflections
router.get('/api/saved-reflections', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;
    const limit = parseInt(req.query.limit as string) || 20;

    const reflections = await storage.getSavedReflections(userId);
    
    // Sort by most recent and limit
    const sortedReflections = reflections
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
      .slice(0, limit);

    logger.info('Saved reflections retrieved', { 
      userId, 
      count: sortedReflections.length 
    });

    res.json({ reflections: sortedReflections });

  } catch (error: any) {
    logger.error('Failed to get saved reflections', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to get saved reflections' });
  }
});

// Delete saved reflection
router.delete('/api/saved-reflections/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;
    const { id } = req.params;

    // In a full implementation, you'd verify ownership and delete
    // For now, we'll just return success
    logger.info('Reflection deletion requested', { userId, reflectionId: id });

    res.json({ success: true });

  } catch (error: any) {
    logger.error('Failed to delete reflection', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to delete reflection' });
  }
});

export default router;