import { storage } from '../storage';
import { logger } from './logger';

export async function updateRitualStreak(userId: string): Promise<number> {
  try {
    logger.info('Updating ritual streak', { userId });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get current streak
    const currentStreak = await storage.getRitualStreak(userId);
    
    if (!currentStreak) {
      // First time - create new streak
      const newStreak = await storage.upsertRitualStreak(userId, {
        userId,
        count: 1,
        lastDay: today
      });
      
      logger.info('Created new ritual streak', { userId, count: 1 });
      return 1;
    }

    const lastDay = new Date(currentStreak.lastDay);
    lastDay.setHours(0, 0, 0, 0);

    if (lastDay.getTime() === today.getTime()) {
      // Already completed today
      logger.info('Ritual already completed today', { userId, count: currentStreak.count });
      return currentStreak.count;
    }
    
    if (lastDay.getTime() === yesterday.getTime()) {
      // Continuing streak
      const newCount = currentStreak.count + 1;
      await storage.upsertRitualStreak(userId, {
        userId,
        count: newCount,
        lastDay: today
      });
      
      logger.info('Ritual streak continued', { userId, count: newCount });
      return newCount;
    } else {
      // Streak broken - restart
      await storage.upsertRitualStreak(userId, {
        userId,
        count: 1,
        lastDay: today
      });
      
      logger.info('Ritual streak restarted', { userId, count: 1 });
      return 1;
    }

  } catch (error: any) {
    logger.error('Failed to update ritual streak', { 
      error: error.message, 
      userId 
    });
    return 0;
  }
}

export async function checkStreakMilestone(streakCount: number): Promise<string | null> {
  const milestones = {
    7: "Seven days of sacred practice - your ritual is taking root.",
    30: "Thirty days of dedication - you are building something beautiful.",
    100: "One hundred days of commitment - you have found your rhythm.",
    365: "A full year of practice - you have transformed through consistency.",
    1000: "One thousand days of devotion - you are a master of your ritual."
  };

  return milestones[streakCount] || null;
}

export async function getStreakInsight(streakCount: number): Promise<string> {
  if (streakCount === 1) {
    return "Every journey begins with a single step. You have chosen to begin again.";
  }
  
  if (streakCount < 7) {
    return `${streakCount} days of practice. Each day you return, you strengthen your commitment to yourself.`;
  }
  
  if (streakCount < 30) {
    return `${streakCount} days strong. Your ritual is becoming part of who you are.`;
  }
  
  if (streakCount < 100) {
    return `${streakCount} days of consistency. You are building something lasting within yourself.`;
  }
  
  return `${streakCount} days of sacred practice. You have transformed through the power of daily return.`;
}