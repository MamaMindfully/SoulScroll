import { Router, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { logger } from "../utils/logger";
import { updateRitualStreak, checkStreakMilestone, getStreakInsight } from "../utils/ritualStreakManager";
import { storage } from "../storage";

const router = Router();

// Get user's ritual streak
router.get('/api/ritual-streak', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;

    const streak = await storage.getRitualStreak(userId);
    const insight = streak ? await getStreakInsight(streak.count) : null;

    logger.info('Ritual streak retrieved', { userId, count: streak?.count || 0 });

    res.json({ 
      streak: streak || { userId, count: 0, lastDay: null },
      insight
    });

  } catch (error: any) {
    logger.error('Failed to get ritual streak', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to get ritual streak' });
  }
});

// Update ritual streak (complete today's ritual)
router.post('/api/ritual-streak', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;

    const newStreakCount = await updateRitualStreak(userId);
    const milestone = await checkStreakMilestone(newStreakCount);
    const insight = await getStreakInsight(newStreakCount);

    // Get updated streak data
    const streak = await storage.getRitualStreak(userId);

    // Track ritual completion behavior
    await storage.updateBehaviorMetrics(userId, 'complete_ritual', {
      streakCount: newStreakCount,
      milestone: !!milestone,
      timestamp: new Date().toISOString()
    });

    logger.info('Ritual streak updated', { 
      userId, 
      newCount: newStreakCount, 
      milestone: !!milestone 
    });

    res.json({ 
      streak,
      milestone,
      insight,
      celebrationMessage: milestone || `${newStreakCount} days of sacred practice!`
    });

  } catch (error: any) {
    logger.error('Failed to update ritual streak', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to update ritual streak' });
  }
});

// Get streak leaderboard (anonymous)
router.get('/api/ritual-leaderboard', async (req: Request, res: Response) => {
  try {
    // In a real implementation, this would query the database for top streaks
    // For now, return mock leaderboard data
    const mockLeaderboard = [
      { rank: 1, streakCount: 365, anonymous: true },
      { rank: 2, streakCount: 180, anonymous: true },
      { rank: 3, streakCount: 120, anonymous: true },
      { rank: 4, streakCount: 90, anonymous: true },
      { rank: 5, streakCount: 75, anonymous: true }
    ];

    res.json({ leaderboard: mockLeaderboard });

  } catch (error: any) {
    logger.error('Failed to get ritual leaderboard', { error: error.message });
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Get streak motivation message
router.get('/api/streak-motivation', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;

    const streak = await storage.getRitualStreak(userId);
    const currentCount = streak?.count || 0;

    const motivations = {
      0: "Every master was once a beginner. Your journey starts with a single step.",
      1: "You've begun. The hardest part is behind you.",
      3: "Three days of commitment. You're building something beautiful.",
      7: "A week of practice. Your ritual is taking root.",
      14: "Two weeks strong. You're discovering the power of consistency.",
      21: "They say it takes 21 days to form a habit. You're there.",
      30: "A month of dedication. You've proven your commitment to yourself.",
      60: "Two months of sacred practice. You are transforming.",
      90: "Three months of consistency. This is who you are becoming.",
      180: "Half a year of devotion. You are a living example of commitment.",
      365: "A full year of practice. You have mastered the art of showing up."
    };

    // Find the most appropriate motivation message
    const milestones = Object.keys(motivations).map(Number).sort((a, b) => b - a);
    const milestone = milestones.find(m => currentCount >= m) || 0;
    const motivation = motivations[milestone];

    res.json({ 
      motivation,
      currentStreak: currentCount,
      milestone
    });

  } catch (error: any) {
    logger.error('Failed to get streak motivation', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to get motivation' });
  }
});

export default router;