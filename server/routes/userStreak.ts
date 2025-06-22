import { Router, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { logger } from "../utils/logger";
import { storage } from "../storage";

const router = Router();

// Get user streak data
router.get('/api/user/streak', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;

    // Get recent journal entries for streak calculation
    const entries = await storage.getJournalEntries(userId, 100); // Get enough entries for accurate streak

    const streakData = calculateStreakFromEntries(entries);

    logger.info('Streak data calculated', { 
      userId, 
      streakCount: streakData.streakCount,
      totalEntries: entries.length
    });

    res.json(streakData);

  } catch (error: any) {
    logger.error('Failed to get streak data', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to get streak data' });
  }
});

function calculateStreakFromEntries(entries: any[]) {
  if (!entries || entries.length === 0) {
    return {
      streakCount: 0,
      longestStreak: 0,
      totalDays: 0,
      lastEntryDate: null
    };
  }

  // Sort entries by date (most recent first)
  const sortedEntries = entries
    .map(entry => new Date(entry.createdAt))
    .sort((a, b) => b.getTime() - a.getTime());

  // Get unique days
  const uniqueDays = new Set(
    sortedEntries.map(date => date.toDateString())
  );

  const totalDays = uniqueDays.size;
  const lastEntryDate = sortedEntries[0]?.toISOString() || null;

  // Calculate current streak
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day

  const uniqueDaysArray = Array.from(uniqueDays)
    .map(day => new Date(day))
    .sort((a, b) => b.getTime() - a.getTime());

  // Check if today or yesterday has an entry for current streak
  const mostRecentEntry = uniqueDaysArray[0];
  const daysSinceMostRecent = Math.floor(
    (today.getTime() - mostRecentEntry.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceMostRecent <= 1) {
    // Start counting current streak from most recent entry
    let streakDate = new Date(mostRecentEntry);
    streakDate.setHours(0, 0, 0, 0);
    
    for (const entryDate of uniqueDaysArray) {
      const checkDate = new Date(entryDate);
      checkDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(streakDate);
      expectedDate.setDate(expectedDate.getDate() - currentStreak);
      
      if (checkDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak in history
  tempStreak = 1;
  for (let i = 1; i < uniqueDaysArray.length; i++) {
    const currentDate = uniqueDaysArray[i];
    const previousDate = uniqueDaysArray[i - 1];
    
    const dayDiff = Math.floor(
      (previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  // Ensure longest streak is at least current streak
  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    streakCount: currentStreak,
    longestStreak,
    totalDays,
    lastEntryDate
  };
}

export default router;