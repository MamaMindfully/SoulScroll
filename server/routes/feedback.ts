import { Router, Request, Response } from "express";
import { logger } from "../utils/logger";
import { storage } from "../storage";

const router = Router();

// Submit feedback
router.post('/api/feedback', async (req: Request, res: Response) => {
  try {
    const { feedback, email, timestamp } = req.body;
    const user = req.user as any;
    const userId = user?.id || null;

    // Validate feedback
    if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
      return res.status(400).json({ error: 'Feedback content is required' });
    }

    if (feedback.length > 5000) {
      return res.status(400).json({ error: 'Feedback is too long (max 5000 characters)' });
    }

    // Validate email if provided
    if (email && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Log feedback to error logs table (using it as general logging)
    await storage.createErrorLog({
      type: 'user_feedback',
      message: `Feedback: ${feedback.trim()}`,
      stack: email ? `Contact: ${email}` : null,
      userId: userId,
      path: '/feedback'
    });

    logger.info('User feedback received', {
      userId,
      hasEmail: !!email,
      feedbackLength: feedback.length,
      timestamp
    });

    res.json({ 
      success: true, 
      message: 'Thank you for your feedback!' 
    });

  } catch (error: any) {
    logger.error('Failed to submit feedback', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

export default router;