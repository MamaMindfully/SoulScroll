interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'entries' | 'streak' | 'words' | 'features';
}

export const achievements: Achievement[] = [
  {
    id: 'first_entry',
    name: 'First Steps',
    description: 'Written your first journal entry',
    icon: '✨',
    requirement: 1,
    type: 'entries'
  },
  {
    id: 'getting_started',
    name: 'Getting Started',
    description: 'Written 3 journal entries',
    icon: '🌱',
    requirement: 3,
    type: 'entries'
  },
  {
    id: 'first_mantra',
    name: 'Mantra Master',
    description: 'Created your first personal mantra',
    icon: '🕉️',
    requirement: 5,
    type: 'entries'
  },
  {
    id: 'cosmic_theme',
    name: 'Cosmic Explorer',
    description: 'Unlocked the cosmic theme',
    icon: '🌌',
    requirement: 10,
    type: 'entries'
  },
  {
    id: 'dream_mode',
    name: 'Dream Walker',
    description: 'Gained access to Dream Mode',
    icon: '🌙',
    requirement: 20,
    type: 'entries'
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintained a 7-day writing streak',
    icon: '🔥',
    requirement: 7,
    type: 'streak'
  },
  {
    id: 'month_master',
    name: 'Month Master',
    description: 'Sustained a 30-day practice',
    icon: '🏆',
    requirement: 30,
    type: 'streak'
  },
  {
    id: 'wordsmith',
    name: 'Wordsmith',
    description: 'Written over 10,000 words total',
    icon: '📝',
    requirement: 10000,
    type: 'words'
  },
  {
    id: 'voice_pioneer',
    name: 'Voice Pioneer',
    description: 'Used voice journaling feature',
    icon: '🎤',
    requirement: 1,
    type: 'features'
  },
  {
    id: 'community_connector',
    name: 'Community Connector',
    description: 'Shared mood with community',
    icon: '🤝',
    requirement: 1,
    type: 'features'
  }
];

export const checkUnlockables = (stats: {
  totalEntries: number;
  currentStreak: number;
  totalWords?: number;
  featuresUsed?: string[];
}): Achievement[] => {
  const unlocked: Achievement[] = [];
  
  achievements.forEach(achievement => {
    let isUnlocked = false;
    
    switch (achievement.type) {
      case 'entries':
        isUnlocked = stats.totalEntries >= achievement.requirement;
        break;
      case 'streak':
        isUnlocked = stats.currentStreak >= achievement.requirement;
        break;
      case 'words':
        isUnlocked = (stats.totalWords || 0) >= achievement.requirement;
        break;
      case 'features':
        isUnlocked = stats.featuresUsed?.includes(achievement.id) || false;
        break;
    }
    
    if (isUnlocked) {
      unlocked.push(achievement);
    }
  });
  
  return unlocked;
};

export const getNewUnlocks = (
  previousStats: { totalEntries: number; currentStreak: number; totalWords?: number },
  currentStats: { totalEntries: number; currentStreak: number; totalWords?: number }
): Achievement[] => {
  const previousUnlocked = checkUnlockables(previousStats);
  const currentUnlocked = checkUnlockables(currentStats);
  
  return currentUnlocked.filter(achievement => 
    !previousUnlocked.some(prev => prev.id === achievement.id)
  );
};

export const notifyUnlocks = (unlocks: Achievement[]): string => {
  if (unlocks.length === 0) return '';
  
  if (unlocks.length === 1) {
    const unlock = unlocks[0];
    return `🎉 Achievement Unlocked: ${unlock.icon} ${unlock.name}! ${unlock.description}`;
  }
  
  return unlocks
    .map(unlock => `🎉 ${unlock.icon} ${unlock.name}`)
    .join('\n');
};

export const getAchievementProgress = (
  stats: { totalEntries: number; currentStreak: number; totalWords?: number },
  achievementId: string
): { current: number; required: number; percentage: number } => {
  const achievement = achievements.find(a => a.id === achievementId);
  if (!achievement) {
    return { current: 0, required: 1, percentage: 0 };
  }
  
  let current = 0;
  switch (achievement.type) {
    case 'entries':
      current = stats.totalEntries;
      break;
    case 'streak':
      current = stats.currentStreak;
      break;
    case 'words':
      current = stats.totalWords || 0;
      break;
  }
  
  const percentage = Math.min(100, (current / achievement.requirement) * 100);
  
  return {
    current,
    required: achievement.requirement,
    percentage
  };
};