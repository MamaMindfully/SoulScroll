import { Router, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { logger } from "../utils/logger";
import { runMemoryLoop } from "../utils/memoryLoopWorker";

const router = Router();

// Memory loop insights endpoint
router.get('/api/memory-loop', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;

    logger.info('Processing memory loop request', { userId });

    // Check if we have existing memory loops for this user
    const existingLoops = await storage.getMemoryLoops(userId, 1);
    
    if (existingLoops.length > 0) {
      const latestLoop = existingLoops[0];
      // Return latest loop if it's from today
      const today = new Date().toDateString();
      const loopDate = new Date(latestLoop.createdAt).toDateString();
      
      if (today === loopDate) {
        return res.json({
          insight: latestLoop.insight,
          type: 'memory_loop',
          message: 'Looking back 30 days ago...'
        });
      }
    }

    const reflection = await runMemoryLoop(userId);
    
    if (reflection) {
      res.json({ 
        insight: reflection,
        type: 'memory_loop',
        message: 'Looking back 30 days ago...'
      });
    } else {
      res.json({ 
        insight: null,
        message: 'No entries from 30 days ago found for reflection'
      });
    }

  } catch (error: any) {
    logger.error('Memory loop processing failed', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(500).json({ 
      error: 'Failed to process memory loop',
      insight: null
    });
  }
});

// Trigger memory loop processing for a user (can be called by cron job)
router.post('/api/memory-loop/process', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;

    const reflection = await runMemoryLoop(userId);
    
    res.json({ 
      success: true,
      reflection,
      message: 'Memory loop processing completed'
    });

  } catch (error: any) {
    logger.error('Memory loop processing failed', { 
      error: error.message, 
      userId: req.user?.id 
    });

    res.status(500).json({ 
      success: false,
      error: 'Failed to process memory loop'
    });
  }
});

export default router;