import { Router, Request, Response } from "express";
import { logger } from "../utils/logger";
import { storage } from "../storage";

const router = Router();

// Admin middleware - check if user is admin
const isAdmin = async (req: Request, res: Response, next: any) => {
  try {
    const user = req.user as any;
    const userId = user?.id;

    // Simple admin check - you can enhance this with proper admin role checking
    const adminUserIds = [
      'admin', 
      process.env.ADMIN_USER_ID,
      // Add specific admin user IDs here
    ].filter(Boolean);

    if (!adminUserIds.includes(userId)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    res.status(403).json({ error: 'Admin verification failed' });
  }
};

// Get usage statistics
router.get('/api/admin/usage-stats', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    // Get user count
    const users = await storage.getUserCount();

    // Get reflection count
    const reflections = await storage.getSavedReflectionCount();

    // Get journal entries count
    const journalEntries = await storage.getJournalEntryCount();

    // Get insight logs count
    const insights = await storage.getInsightLogCount();

    // Get premium users count
    const premiumUsers = await storage.getPremiumUserCount();

    // Get emotion trends count
    const totalEmotionTrends = await storage.getEmotionTrendCount();

    const usageStats = {
      users,
      reflections,
      insights,
      journalEntries,
      premiumUsers,
      totalEmotionTrends
    };

    logger.info('Admin usage stats requested', { stats: usageStats });

    res.json(usageStats);

  } catch (error: any) {
    logger.error('Failed to get usage stats', { error: error.message });
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
});

// Get emotion analytics
router.get('/api/admin/emotion-analytics', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const emotionAnalytics = await storage.getEmotionAnalytics();

    res.json(emotionAnalytics);

  } catch (error: any) {
    logger.error('Failed to get emotion analytics', { error: error.message });
    res.status(500).json({ error: 'Failed to get emotion analytics' });
  }
});

// Get recent activity
router.get('/api/admin/recent-activity', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const recentActivity = await storage.getRecentActivity();

    res.json(recentActivity);

  } catch (error: any) {
    logger.error('Failed to get recent activity', { error: error.message });
    res.status(500).json({ error: 'Failed to get recent activity' });
  }
});

// Log insight delivery
export async function logInsight(userId: string, insightType: string = 'general') {
  try {
    await storage.createInsightLog({
      userId,
      insightType,
      timestamp: new Date()
    });

    logger.info('Insight logged', { userId, insightType });
  } catch (error: any) {
    logger.error('Failed to log insight', { 
      error: error.message, 
      userId, 
      insightType 
    });
  }
}

export default router;