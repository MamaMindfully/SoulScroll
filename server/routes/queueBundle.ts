import { Router, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { logger } from "../utils/logger";
import { z } from "zod";
import { journalQueue, emotionQueue, insightQueue } from "../queue/journalQueue";
import { captureError } from "../utils/errorHandler";

const router = Router();

// Validation schema for journal bundle
const journalBundleSchema = z.object({
  entryText: z.string().min(1, "Entry text is required"),
  entryId: z.string(),
  userId: z.string()
});

// Unified journal bundle processing endpoint
router.post('/api/queue/journal-bundle', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { entryText, entryId, userId } = journalBundleSchema.parse(req.body);
    const user = req.user;

    logger.info('Processing journal bundle', {
      userId: user.id,
      entryId,
      textLength: entryText.length
    });

    // Create a bundle of related jobs with dependencies
    const bundleId = `bundle_${entryId}_${Date.now()}`;
    
    // Job 1: Analyze journal entry (highest priority)
    const analyzeJob = await journalQueue.add('analyze', {
      userId: user.id,
      journalText: entryText,
      entryId,
      bundleId
    }, {
      priority: 10,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    // Job 2: Score emotion (can run in parallel)
    const emotionJob = await emotionQueue.add('score', {
      userId: user.id,
      journalText: entryText,
      entryId,
      bundleId
    }, {
      priority: 8,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    });

    // Job 3: Update progress graph (depends on emotion scoring)
    const progressJob = await insightQueue.add('updateProgress', {
      userId: user.id,
      entryId,
      bundleId,
      dependsOn: [emotionJob.id]
    }, {
      priority: 5,
      delay: 5000, // Wait 5 seconds to allow emotion scoring
      attempts: 2
    });

    // Job 4: Check scroll rewards (lowest priority)
    const rewardJob = await insightQueue.add('checkRewards', {
      userId: user.id,
      entryId,
      bundleId,
      dependsOn: [analyzeJob.id, emotionJob.id]
    }, {
      priority: 3,
      delay: 10000, // Wait 10 seconds
      attempts: 1
    });

    // Job 5: Update memory loop (for pattern recognition)
    const memoryJob = await insightQueue.add('updateMemoryLoop', {
      userId: user.id,
      entryText,
      entryId,
      bundleId,
      dependsOn: [analyzeJob.id, emotionJob.id]
    }, {
      priority: 4,
      delay: 8000, // Wait 8 seconds
      attempts: 2
    });

    logger.info('Journal bundle jobs created', {
      bundleId,
      jobs: {
        analyze: analyzeJob.id,
        emotion: emotionJob.id,
        progress: progressJob.id,
        rewards: rewardJob.id,
        memory: memoryJob.id
      }
    });

    res.status(202).json({
      message: 'Journal bundle processing started',
      bundleId,
      jobs: {
        analyze: analyzeJob.id,
        emotion: emotionJob.id,
        progress: progressJob.id,
        rewards: rewardJob.id,
        memory: memoryJob.id
      },
      estimated: 'Processing will complete within 30-60 seconds'
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