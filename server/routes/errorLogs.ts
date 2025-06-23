import { Router, Request, Response } from "express";
import { logger } from "../utils/logger";
import { storage } from "../storage";
import { z } from "zod";

const router = Router();

// Log error endpoint
router.post('/api/error-logs', async (req: Request, res: Response) => {
  try {
    const errorSchema = z.object({
      type: z.string(),
      message: z.string().optional(),
      stack: z.string().optional(),
      userId: z.string().optional().nullable(),
      path: z.string().optional().nullable(),
      userAgent: z.string().optional(),
      timestamp: z.string().optional(),
      context: z.string().optional()
    });

    const errorData = errorSchema.parse(req.body);

    // Log to backend storage with proper error handling
    try {
      if (storage.createErrorLog) {
        await storage.createErrorLog({
          type: errorData.type,
          message: errorData.message || 'Unknown error',
          stack: errorData.stack || '',
          userId: errorData.userId || null,
          path: errorData.path || null
        });
      }
    } catch (storageError) {
      // If database fails, still log to console
      logger.error('Storage error logging failed', { storageError: storageError.message });
    }

    // Also log to backend logger for immediate visibility
    logger.error('Client error logged', {
      type: errorData.type,
      message: errorData.message,
      userId: errorData.userId,
      path: errorData.path,
      userAgent: errorData.userAgent
    });

    res.json({ success: true });

  } catch (error: any) {
    logger.error('Failed to log client error', { 
      error: error.message,
      requestBody: req.body 
    });
    res.status(500).json({ error: 'Failed to log error' });
  }
});

// Get error logs (admin endpoint)
router.get('/api/error-logs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const type = req.query.type as string;

    const errors = await storage.getErrorLogs(limit, type);

    res.json({ errors });

  } catch (error: any) {
    logger.error('Failed to retrieve error logs', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve error logs' });
  }
});

// Get error summary
router.get('/api/error-summary', async (req: Request, res: Response) => {
  try {
    const errors = await storage.getErrorLogs(1000);
    
    const summary = {
      total: errors.length,
      byType: errors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recent: errors.slice(0, 10).map(error => ({
        type: error.type,
        message: error.message?.substring(0, 100),
        createdAt: error.createdAt
      }))
    };

    res.json(summary);

  } catch (error: any) {
    logger.error('Failed to generate error summary', { error: error.message });
    res.status(500).json({ error: 'Failed to generate error summary' });
  }
});

export default router;