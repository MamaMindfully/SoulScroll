import { Router, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { captureError } from "../utils/errorHandler";

const router = Router();

// Simplified user status (following your pattern)
router.get('/api/user/status', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter required' });
    }

    logger.info('Fetching user status', { userId });

    // Fetch essential user data (simplified pattern)
    const userStatus = await getUserStatus(userId);

    if (!userStatus) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userStatus);

  } catch (error: any) {
    captureError(error, {
      userId: req.query.userId as string,
      operation: 'fetch_user_status'
    });

    logger.error('Failed to fetch user status', {
      error: error.message,
      userId: req.query.userId
    });

    res.status(500).json({
      error: 'Failed to fetch user status',
      details: error.message
    });
  }
});

// Authenticated comprehensive status endpoint
router.get('/api/user/status/detailed', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    logger.info('Fetching detailed user status', { userId: user.id });

    // Fetch all user data in parallel
    const [
      userRecord,
      subscription,
      userStats,
      recentEntries,
      emotionalInsights,
      memoryPatterns
    ] = await Promise.all([
      storage.getUser(user.id),
      storage.getUserSubscription(user.id).catch(() => null),
      storage.getUserStats(user.id).catch(() => ({ totalEntries: 0, currentStreak: 0, longestStreak: 0, averageMood: 5 })),
      storage.getJournalEntries(user.id, 5, 0).catch(() => []),
      storage.getEmotionalInsights(user.id, 'week').catch(() => []),
      getMemoryPatterns(user.id).catch(() => ({ totalPatterns: 0, emergentThemes: [], lastUpdate: null }))
    ]);

    // Calculate subscription info
    const subscriptionInfo = {
      tier: subscription?.planType === 'premium' ? 'premium' : 
            subscription?.planType === 'premium_plus' ? 'premium_plus' : 'free',
      status: subscription?.status === 'active' ? 'active' : 
              subscription?.status === 'trialing' ? 'trialing' : 'inactive',
      expiresAt: subscription?.currentPeriodEnd?.toISOString()
    };

    // Calculate scroll rewards
    const scrollsInfo = await calculateScrollRewards(user.id, userStats);

    // Calculate unread insights
    const insightsInfo = await calculateInsightsInfo(user.id, emotionalInsights);

    // Get last journal entry timestamp
    const lastEntry = recentEntries[0];
    const lastEntryTimestamp = lastEntry?.createdAt?.toISOString();

    const userStatus = {
      subscription: subscriptionInfo,
      scrolls: scrollsInfo,
      journal: {
        lastEntryTimestamp,
        totalEntries: userStats.totalEntries,
        currentStreak: userStats.currentStreak
      },
      insights: insightsInfo,
      memory: {
        totalPatterns: memoryPatterns.totalPatterns,
        emergentThemes: memoryPatterns.emergentThemes,
        lastUpdate: memoryPatterns.lastUpdate
      }
    };

    logger.info('Detailed user status calculated', {
      userId: user.id,
      subscriptionTier: subscriptionInfo.tier,
      currentStreak: userStats.currentStreak,
      unreadInsights: insightsInfo.unread
    });

    res.json(userStatus);

  } catch (error: any) {
    captureError(error, {
      userId: req.user?.id,
      operation: 'fetch_detailed_user_status'
    });

    logger.error('Failed to fetch detailed user status', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      error: 'Failed to fetch detailed user status',
      details: error.message
    });
  }
});

// Helper function to calculate scroll rewards based on milestones
async function calculateScrollRewards(userId: string, userStats: any) {
  try {
    // Get existing scrolls (this would be implemented in storage)
    const scrolls = await storage.getSecretScrolls(userId);
    
    // Calculate potential new scrolls based on milestones
    const milestones = [
      { threshold: 1, title: 'First Steps' },
      { threshold: 7, title: 'Week Warrior' },
      { threshold: 14, title: 'Fortnight Sage' },
      { threshold: 30, title: 'Moon Cycle Master' },
      { threshold: 100, title: 'Century Scholar' }
    ];

    const unlockedScrolls = milestones.filter(m => userStats.totalEntries >= m.threshold);
    const latestScroll = unlockedScrolls[unlockedScrolls.length - 1];

    return {
      unlocked: unlockedScrolls.length,
      total: milestones.length,
      latest: latestScroll ? {
        id: `scroll_${latestScroll.threshold}`,
        title: latestScroll.title,
        unread: userStats.totalEntries === latestScroll.threshold // New if just reached
      } : undefined
    };
  } catch (error) {
    logger.error('Failed to calculate scroll rewards', { userId, error: error.message });
    return { unlocked: 0, total: 5, latest: undefined };
  }
}

// Helper function to calculate insights information
async function calculateInsightsInfo(userId: string, insights: any[]) {
  try {
    // Count insights from last 7 days as "unread"
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentInsights = insights.filter(insight => 
      insight.createdAt > oneWeekAgo
    );

    const latest = insights[0] ? {
      id: insights[0].id.toString(),
      type: 'emotional_pattern',
      createdAt: insights[0].createdAt.toISOString()
    } : undefined;

    return {
      unread: recentInsights.length,
      pending: 0, // Could track processing jobs here
      latest
    };
  } catch (error) {
    return { unread: 0, pending: 0, latest: undefined };
  }
}

// Helper function to get memory patterns (would integrate with vector DB)
async function getMemoryPatterns(userId: string) {
  try {
    // This would integrate with a vector database or semantic search
    // For now, return mock patterns based on recent insights
    const insights = await storage.getEmotionalInsights(userId, 'month');
    
    // Extract themes from insights
    const allPatterns = insights.flatMap(insight => insight.emotionalPatterns || []);
    const uniqueThemes = [...new Set(allPatterns)].slice(0, 5); // Top 5 themes

    return {
      totalPatterns: allPatterns.length,
      emergentThemes: uniqueThemes,
      lastUpdate: insights.length > 0 ? insights[0].createdAt.toISOString() : null
    };
  } catch (error) {
    logger.error('Failed to get memory patterns', { userId, error: error.message });
    return {
      totalPatterns: 0,
      emergentThemes: [],
      lastUpdate: null
    };
  }
}

// Simplified getUserStatus function (following your pattern)
async function getUserStatus(userId: string) {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return null;
    }

    const [subscription, userStats, recentEntries] = await Promise.all([
      storage.getUserSubscription(userId).catch(() => null),
      storage.getUserStats(userId).catch(() => ({ totalEntries: 0, currentStreak: 0, longestStreak: 0, averageMood: 5 })),
      storage.getJournalEntries(userId, 1, 0).catch(() => [])
    ]);

    const lastEntry = recentEntries[0];

    return {
      subscription_status: subscription?.status || 'inactive',
      subscription_tier: subscription?.planType || 'free',
      last_journal_entry: lastEntry?.createdAt?.toISOString() || null,
      journal_count: userStats.totalEntries,
      current_streak: userStats.currentStreak,
      average_mood: userStats.averageMood,
      premium_status: subscription?.status === 'active' && subscription?.planType !== 'free'
    };
  } catch (error) {
    logger.error('Failed to get user status', { userId, error: error.message });
    throw error;
  }
}

export default router;