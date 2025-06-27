// Unlockables and Achievement Engine for SoulScroll
// Manages badges, rewards, and milestone tracking

import { getJournalStats } from './journalHistoryUtils';

/**
 * Achievement Categories:
 * - Writing Consistency (streaks, frequency)
 * - Content Depth (word counts, thoughtfulness)
 * - Emotional Growth (mood tracking, self-awareness)
 * - Feature Exploration (using different modes)
 * - Milestones (time-based, quantity-based)
 */

const ACHIEVEMENTS = [
  // Writing Consistency
  {
    id: 'first_entry',
    title: 'First Steps',
    description: 'Written your very first journal entry',
    icon: '✨',
    category: 'consistency',
    condition: (stats) => stats.totalEntries >= 1,
    xpReward: 10,
    rarity: 'common'
  },
  {
    id: 'three_day_streak',
    title: 'Building Momentum',
    description: 'Maintained a 3-day writing streak',
    icon: '🔥',
    category: 'consistency',
    condition: (stats) => stats.currentStreak >= 3,
    xpReward: 25,
    rarity: 'common'
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Achieved a 7-day writing streak',
    icon: '⚡',
    category: 'consistency',
    condition: (stats) => stats.currentStreak >= 7,
    xpReward: 50,
    rarity: 'uncommon'
  },
  {
    id: 'monthly_master',
    title: 'Monthly Master',
    description: 'Maintained a 30-day writing streak',
    icon: '👑',
    category: 'consistency',
    condition: (stats) => stats.currentStreak >= 30,
    xpReward: 200,
    rarity: 'legendary'
  },
  {
    id: 'streak_phoenix',
    title: 'Phoenix Rising',
    description: 'Rebuilt your streak after a break',
    icon: '🔥',
    category: 'consistency',
    condition: (stats) => stats.longestStreak > stats.currentStreak && stats.currentStreak >= 3,
    xpReward: 30,
    rarity: 'uncommon'
  },

  // Content Depth
  {
    id: 'wordsmith_100',
    title: 'Wordsmith',
    description: 'Written an entry with 100+ words',
    icon: '📝',
    category: 'depth',
    condition: (stats) => stats.averageWords >= 100,
    xpReward: 15,
    rarity: 'common'
  },
  {
    id: 'storyteller_500',
    title: 'Storyteller',
    description: 'Written an entry with 500+ words',
    icon: '📚',
    category: 'depth',
    condition: (stats) => getMaxWordsFromEntries() >= 500,
    xpReward: 40,
    rarity: 'uncommon'
  },
  {
    id: 'novelist_1000',
    title: 'Budding Novelist',
    description: 'Written an entry with 1000+ words',
    icon: '✍️',
    category: 'depth',
    condition: (stats) => getMaxWordsFromEntries() >= 1000,
    xpReward: 75,
    rarity: 'rare'
  },
  {
    id: 'prolific_writer',
    title: 'Prolific Writer',
    description: 'Written over 10,000 total words',
    icon: '🏆',
    category: 'depth',
    condition: (stats) => stats.totalWords >= 10000,
    xpReward: 100,
    rarity: 'rare'
  },

  // Milestones
  {
    id: 'ten_entries',
    title: 'Consistent Writer',
    description: 'Completed 10 journal entries',
    icon: '📖',
    category: 'milestones',
    condition: (stats) => stats.totalEntries >= 10,
    xpReward: 30,
    rarity: 'common'
  },
  {
    id: 'fifty_entries',
    title: 'Dedicated Journaler',
    description: 'Completed 50 journal entries',
    icon: '🌟',
    category: 'milestones',
    condition: (stats) => stats.totalEntries >= 50,
    xpReward: 100,
    rarity: 'uncommon'
  },
  {
    id: 'hundred_entries',
    title: 'Journal Master',
    description: 'Completed 100 journal entries',
    icon: '💎',
    category: 'milestones',
    condition: (stats) => stats.totalEntries >= 100,
    xpReward: 250,
    rarity: 'epic'
  },
  {
    id: 'year_anniversary',
    title: 'One Year Strong',
    description: 'Been journaling for a full year',
    icon: '🎂',
    category: 'milestones',
    condition: (stats) => getJournalingDuration() >= 365,
    xpReward: 365,
    rarity: 'legendary'
  },

  // Emotional Growth
  {
    id: 'mood_tracker',
    title: 'Emotional Awareness',
    description: 'Tracked your mood in 5 entries',
    icon: '💖',
    category: 'growth',
    condition: (stats) => getMoodEntryCount() >= 5,
    xpReward: 25,
    rarity: 'common'
  },
  {
    id: 'positive_vibes',
    title: 'Radiating Positivity',
    description: 'Maintained an average mood of 4.0+',
    icon: '🌞',
    category: 'growth',
    condition: (stats) => stats.averageMood >= 4.0,
    xpReward: 50,
    rarity: 'uncommon'
  },
  {
    id: 'resilience_badge',
    title: 'Resilient Spirit',
    description: 'Journaled through challenging times',
    icon: '🌈',
    category: 'growth',
    condition: (stats) => hasLowMoodRecovery(),
    xpReward: 75,
    rarity: 'rare'
  },

  // Feature Exploration
  {
    id: 'mama_mindfully_user',
    title: 'Nurtured Soul',
    description: 'Used Mama Mindfully for guidance',
    icon: '🌼',
    category: 'exploration',
    condition: () => hasMamaMindfullyEntry(),
    xpReward: 20,
    rarity: 'common'
  },
  {
    id: 'dream_interpreter',
    title: 'Dream Explorer',
    description: 'Interpreted a dream with AI',
    icon: '🌙',
    category: 'exploration',
    condition: () => hasDreamEntry(),
    xpReward: 30,
    rarity: 'uncommon'
  },
  {
    id: 'mantra_creator',
    title: 'Spiritual Seeker',
    description: 'Created your first personal mantra',
    icon: '🌸',
    category: 'exploration',
    condition: () => hasMantraCreated(),
    xpReward: 25,
    rarity: 'common'
  },
  {
    id: 'feature_explorer',
    title: 'Feature Explorer',
    description: 'Used all premium spiritual tools',
    icon: '🔮',
    category: 'exploration',
    condition: () => hasMamaMindfullyEntry() && hasDreamEntry() && hasMantraCreated(),
    xpReward: 100,
    rarity: 'epic'
  },

  // Special Achievements
  {
    id: 'midnight_writer',
    title: 'Midnight Writer',
    description: 'Wrote an entry between 11 PM and 1 AM',
    icon: '🌜',
    category: 'special',
    condition: () => hasMidnightEntry(),
    xpReward: 15,
    rarity: 'uncommon'
  },
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Wrote an entry before 6 AM',
    icon: '🌅',
    category: 'special',
    condition: () => hasEarlyMorningEntry(),
    xpReward: 20,
    rarity: 'uncommon'
  },
  {
    id: 'thanksgiving_gratitude',
    title: 'Grateful Heart',
    description: 'Expressed gratitude in multiple entries',
    icon: '🙏',
    category: 'special',
    condition: () => hasGratitudeEntries(),
    xpReward: 35,
    rarity: 'rare'
  }
];

// Helper functions to check specific conditions
function getMaxWordsFromEntries() {
  try {
    const entries = JSON.parse(localStorage.getItem('soulscroll-journal-history') || '[]');
    return entries.reduce((max, entry) => Math.max(max, entry.wordCount || 0), 0);
  } catch {
    return 0;
  }
}

function getJournalingDuration() {
  try {
    const entries = JSON.parse(localStorage.getItem('soulscroll-journal-history') || '[]');
    if (entries.length === 0) return 0;
    
    const oldest = new Date(entries[entries.length - 1].timestamp);
    const now = new Date();
    return Math.floor((now - oldest) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

function getMoodEntryCount() {
  try {
    const entries = JSON.parse(localStorage.getItem('soulscroll-journal-history') || '[]');
    return entries.filter(entry => entry.mood && entry.mood > 0).length;
  } catch {
    return 0;
  }
}

function hasLowMoodRecovery() {
  try {
    const entries = JSON.parse(localStorage.getItem('soulscroll-journal-history') || '[]');
    if (entries.length < 3) return false;
    
    // Look for pattern: low mood followed by higher mood
    for (let i = 0; i < entries.length - 2; i++) {
      const current = entries[i];
      const next = entries[i + 1];
      const afterNext = entries[i + 2];
      
      if (current.mood && next.mood && afterNext.mood) {
        if (current.mood <= 2 && next.mood <= 2 && afterNext.mood >= 4) {
          return true;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

function hasMamaMindfullyEntry() {
  try {
    const entries = JSON.parse(localStorage.getItem('soulscroll-journal-history') || '[]');
    return entries.some(entry => entry.aiPersona === 'mama-mindfully');
  } catch {
    return false;
  }
}

function hasDreamEntry() {
  try {
    const dreams = JSON.parse(localStorage.getItem('soulscroll-dreams') || '[]');
    return dreams.length > 0;
  } catch {
    return false;
  }
}

function hasMantraCreated() {
  try {
    const mantras = JSON.parse(localStorage.getItem('soulscroll-mantras') || '[]');
    return mantras.length > 0;
  } catch {
    return false;
  }
}

function hasMidnightEntry() {
  try {
    const entries = JSON.parse(localStorage.getItem('soulscroll-journal-history') || '[]');
    return entries.some(entry => {
      const hour = new Date(entry.timestamp).getHours();
      return hour >= 23 || hour <= 1;
    });
  } catch {
    return false;
  }
}

function hasEarlyMorningEntry() {
  try {
    const entries = JSON.parse(localStorage.getItem('soulscroll-journal-history') || '[]');
    return entries.some(entry => {
      const hour = new Date(entry.timestamp).getHours();
      return hour <= 6;
    });
  } catch {
    return false;
  }
}

function hasGratitudeEntries() {
  try {
    const entries = JSON.parse(localStorage.getItem('soulscroll-journal-history') || '[]');
    const gratitudeWords = ['grateful', 'thankful', 'blessed', 'appreciate', 'gratitude', 'thank you'];
    const gratitudeEntries = entries.filter(entry => {
      const content = (entry.content || '').toLowerCase();
      return gratitudeWords.some(word => content.includes(word));
    });
    return gratitudeEntries.length >= 3;
  } catch {
    return false;
  }
}

// Main function to get all unlockables with current status
export function getUnlockables() {
  try {
    const stats = getJournalStats();
    
    return ACHIEVEMENTS.map(achievement => {
      const isUnlocked = achievement.condition(stats);
      
      return {
        ...achievement,
        isUnlocked,
        unlockedAt: isUnlocked ? getAchievementUnlockDate(achievement.id) : null,
        progress: getAchievementProgress(achievement, stats)
      };
    });
  } catch (error) {
    console.error('Error getting unlockables:', error);
    return [];
  }
}

// Get specific category of achievements
export function getAchievementsByCategory(category) {
  return getUnlockables().filter(achievement => achievement.category === category);
}

// Get unlocked achievements only
export function getUnlockedAchievements() {
  return getUnlockables().filter(achievement => achievement.isUnlocked);
}

// Get achievement progress for specific achievement
function getAchievementProgress(achievement, stats) {
  switch (achievement.id) {
    case 'three_day_streak':
      return Math.min((stats.currentStreak / 3) * 100, 100);
    case 'week_warrior':
      return Math.min((stats.currentStreak / 7) * 100, 100);
    case 'monthly_master':
      return Math.min((stats.currentStreak / 30) * 100, 100);
    case 'ten_entries':
      return Math.min((stats.totalEntries / 10) * 100, 100);
    case 'fifty_entries':
      return Math.min((stats.totalEntries / 50) * 100, 100);
    case 'hundred_entries':
      return Math.min((stats.totalEntries / 100) * 100, 100);
    case 'prolific_writer':
      return Math.min((stats.totalWords / 10000) * 100, 100);
    default:
      return achievement.condition(stats) ? 100 : 0;
  }
}

// Track when achievement was unlocked
function getAchievementUnlockDate(achievementId) {
  try {
    const unlocked = JSON.parse(localStorage.getItem('soulscroll-achievements') || '{}');
    return unlocked[achievementId] || null;
  } catch {
    return null;
  }
}

// Mark achievement as unlocked
export function unlockAchievement(achievementId) {
  try {
    const unlocked = JSON.parse(localStorage.getItem('soulscroll-achievements') || '{}');
    if (!unlocked[achievementId]) {
      unlocked[achievementId] = new Date().toISOString();
      localStorage.setItem('soulscroll-achievements', JSON.stringify(unlocked));
      return true; // Newly unlocked
    }
    return false; // Already unlocked
  } catch {
    return false;
  }
}

// Get total XP from achievements
export function getTotalAchievementXP() {
  const unlockedAchievements = getUnlockedAchievements();
  return unlockedAchievements.reduce((total, achievement) => total + achievement.xpReward, 0);
}

// Get rarity distribution
export function getAchievementStats() {
  const all = getUnlockables();
  const unlocked = getUnlockedAchievements();
  
  return {
    total: all.length,
    unlocked: unlocked.length,
    completionPercentage: Math.round((unlocked.length / all.length) * 100),
    totalXP: getTotalAchievementXP(),
    byRarity: {
      common: unlocked.filter(a => a.rarity === 'common').length,
      uncommon: unlocked.filter(a => a.rarity === 'uncommon').length,
      rare: unlocked.filter(a => a.rarity === 'rare').length,
      epic: unlocked.filter(a => a.rarity === 'epic').length,
      legendary: unlocked.filter(a => a.rarity === 'legendary').length
    }
  };
}

// Check for newly unlocked achievements
export function checkForNewAchievements() {
  const achievements = getUnlockables();
  const newlyUnlocked = [];
  
  achievements.forEach(achievement => {
    if (achievement.isUnlocked && unlockAchievement(achievement.id)) {
      newlyUnlocked.push(achievement);
    }
  });
  
  return newlyUnlocked;
}