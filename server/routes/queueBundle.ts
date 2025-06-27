import { Router, Request, Response } from "express";
import { logger } from "../utils/logger";
import { z } from "zod";
import { journalQueue, emotionQueue, insightQueue } from "../queue/journalQueue";
import { captureError } from "../utils/errorHandler";
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10,
  message: 'Too many requests. Please slow down.'
});

// Validation schema for journal bundle
const journalBundleSchema = z.object({
  entryText: z.string().min(1, "Entry text is required")
});

// Simplified journal bundle processing endpoint (following your pattern)
router.post('/api/journal', limiter, isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { entryText } = journalBundleSchema.parse(req.body);
    const user = req.user;
    
    // Enhanced user validation
    if (!user?.id || typeof user.id !== 'string') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    logger.info('Processing journal bundle', {
      userId: user.id,
      textLength: entryText.length
    });

    // Add unified bundle job (like your example)
    const job = await journalQueue.add('journalBundle', {
      userId: user.id,
      entryText
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    logger.info('Journal bundle job created', {
      jobId: job.id,
      userId: user.id
    });

    res.status(200).json({ 
      status: 'processing',
      jobId: job.id,
      message: 'Journal entry submitted for processing'
    });

  } catch (error: any) {
    captureError(error, {
      userId: req.user?.id,
      operation: 'journal_bundle_queue'
    });

    logger.error('Journal bundle processing failed', {
      error: error.message,
      userId: req.user?.id
    });

    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    res.status(500).json({
      error: 'Failed to process journal bundle',
      details: error.message
    });
  }
});

// Legacy bundle endpoint for compatibility
router.post('/api/queue/journal-bundle', isAuthenticated, async (req: Request, res: Response) => {
  // Redirect to the new endpoint
  req.url = '/api/journal';
  return router.handle(req, res);
});

// Get bundle status endpoint
router.get('/api/queue/bundle/:bundleId/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { bundleId } = req.params;
    const user = req.user;

    logger.info('Fetching bundle status', { bundleId, userId: user.id });

    // Get all jobs for this bundle
    const [analyzeJobs, emotionJobs, insightJobs] = await Promise.all([
      journalQueue.getJobs(['waiting', 'active', 'completed', 'failed']),
      emotionQueue.getJobs(['waiting', 'active', 'completed', 'failed']),
      insightQueue.getJobs(['waiting', 'active', 'completed', 'failed'])
    ]);

    // Filter jobs by bundle ID
    const bundleJobs = [
      ...analyzeJobs.filter(job => job.data.bundleId === bundleId),
      ...emotionJobs.filter(job => job.data.bundleId === bundleId),
      ...insightJobs.filter(job => job.data.bundleId === bundleId)
    ];

    if (bundleJobs.length === 0) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    // Check if user owns this bundle
    const userOwnsBundle = bundleJobs.every(job => job.data.userId === user.id);
    if (!userOwnsBundle) {
      return res.status(403).json({ error: 'Unauthorized access to bundle' });
    }

    // Calculate overall progress
    const jobStatuses = await Promise.all(
      bundleJobs.map(async (job) => {
        const state = await job.getState();
        return {
          id: job.id,
          name: job.name,
          status: state,
          progress: job.progress || 0,
          result: state === 'completed' ? job.returnvalue : null,
          error: state === 'failed' ? job.failedReason : null
        };
      })
    );

    const completedJobs = jobStatuses.filter(job => job.status === 'completed').length;
    const failedJobs = jobStatuses.filter(job => job.status === 'failed').length;
    const totalJobs = jobStatuses.length;
    const overallProgress = Math.round((completedJobs / totalJobs) * 100);

    const bundleStatus = {
      bundleId,
      overallProgress,
      status: failedJobs > 0 ? 'partial_failure' : 
              completedJobs === totalJobs ? 'completed' : 'processing',
      jobs: jobStatuses,
      summary: {
        total: totalJobs,
        completed: completedJobs,
        failed: failedJobs,
        processing: totalJobs - completedJobs - failedJobs
      }
    };

    res.json(bundleStatus);

  } catch (error: any) {
    logger.error('Failed to get bundle status', {
      error: error.message,
      bundleId: req.params.bundleId
    });
    res.status(500).json({ error: 'Failed to get bundle status' });
  }
});

export default router;