import { apiRequest } from '../lib/queryClient';

export async function updateRitualProgress(userId) {
  try {
    const weekId = getCurrentWeekId();
    
    // Check if user has existing progress for this week
    const response = await apiRequest('GET', `/api/ritual-progress/${weekId}`);
    const portal = await response.json();

    if (portal.exists) {
      // Update existing progress
      await apiRequest('PATCH', `/api/ritual-progress/${weekId}`, {
        completed_days: portal.completed_days + 1
      });
    } else {
      // Create new progress entry
      await apiRequest('POST', '/api/ritual-progress', {
        week_id: weekId,
        completed_days: 1,
        reward_claimed: false
      });
    }

    return { success: true, weekId, completed_days: (portal.completed_days || 0) + 1 };
  } catch (error) {
    console.error('Error updating ritual progress:', error);
    return { success: false, error: error.message };
  }
}

export async function checkRewardUnlock(userId) {
  try {
    const weekId = getCurrentWeekId();
    const response = await apiRequest('GET', `/api/ritual-progress/${weekId}`);
    const portal = await response.json();

    if (portal.completed_days >= 5 && !portal.reward_claimed) {
      // Claim the reward
      await apiRequest('PATCH', `/api/ritual-progress/${weekId}`, {
        reward_claimed: true
      });

      const rewards = [
        "🌟 Unlock: Advanced AI Insight Mode",
        "🎨 Unlock: Premium Journal Themes", 
        "🔮 Unlock: Future Self Letter",
        "💎 Unlock: Wisdom Archive Access",
        "🌙 Unlock: Dream Interpretation Mode"
      ];

      const randomReward = rewards[Math.floor(Math.random() * rewards.length)];

      return { 
        unlocked: true, 
        message: "You've unlocked this week's Mystery Reward!",
        reward: randomReward,
        streakBonus: portal.completed_days >= 7 ? "Perfect Week Bonus: +50 XP" : null
      };
    }

    const daysRemaining = Math.max(0, 5 - (portal.completed_days || 0));
    return { 
      unlocked: false, 
      daysRemaining,
      progress: portal.completed_days || 0,
      message: daysRemaining > 0 ? `${daysRemaining} more days to unlock this week's reward` : "Reward available to claim!"
    };
  } catch (error) {
    console.error('Error checking reward unlock:', error);
    return { unlocked: false, error: error.message };
  }
}

export async function getWeeklyPortalStatus(userId) {
  try {
    const weekId = getCurrentWeekId();
    const response = await apiRequest('GET', `/api/ritual-progress/${weekId}`);
    const portal = await response.json();

    const startOfWeek = getStartOfWeek();
    const daysSinceStart = Math.floor((new Date() - startOfWeek) / (1000 * 60 * 60 * 24));
    const weekProgress = Math.min(daysSinceStart / 6, 1); // 7 days in a week

    return {
      weekId,
      completed_days: portal.completed_days || 0,
      week_progress: weekProgress,
      reward_claimed: portal.reward_claimed || false,
      is_week_complete: (portal.completed_days || 0) >= 7,
      days_remaining_in_week: Math.max(0, 7 - daysSinceStart),
      streak_status: calculateStreakStatus(portal.completed_days || 0, daysSinceStart)
    };
  } catch (error) {
    console.error('Error getting weekly portal status:', error);
    return {
      weekId: getCurrentWeekId(),
      completed_days: 0,
      week_progress: 0,
      reward_claimed: false,
      is_week_complete: false,
      error: error.message
    };
  }
}

function getCurrentWeekId() {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
  const week = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  return `${year}-W${week}`;
}

function getStartOfWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day; // Sunday as start of week
  return new Date(now.setDate(diff));
}

function calculateStreakStatus(completedDays, daysSinceStart) {
  if (completedDays === 0) {
    return { status: 'not_started', message: 'Start your weekly ritual journey' };
  }
  
  if (completedDays === daysSinceStart + 1) {
    return { status: 'perfect', message: 'Perfect streak! Keep it up!' };
  }
  
  if (completedDays >= 5) {
    return { status: 'strong', message: 'Strong progress this week' };
  }
  
  if (completedDays >= 3) {
    return { status: 'building', message: 'Building momentum' };
  }
  
  return { status: 'starting', message: 'Every journey begins with a single step' };
}

export async function generateWeeklyTheme() {
  try {
    const response = await apiRequest('POST', '/api/generate-weekly-theme', {
      weekId: getCurrentWeekId()
    });
    const data = await response.json();
    return data.theme;
  } catch (error) {
    console.error('Error generating weekly theme:', error);
    
    // Fallback themes
    const themes = [
      { 
        title: "Inner Compass", 
        description: "Navigate by your deepest values this week",
        color: "purple",
        affirmation: "I trust my inner wisdom to guide me"
      },
      { 
        title: "Gentle Growth", 
        description: "Allow yourself to bloom at your own pace",
        color: "green",
        affirmation: "I embrace growth with patience and self-compassion"
      },
      { 
        title: "Sacred Presence", 
        description: "Find the extraordinary in ordinary moments",
        color: "blue",
        affirmation: "I am fully present to the magic of now"
      },
      { 
        title: "Creative Flow", 
        description: "Let your creativity express your soul's truth",
        color: "orange",
        affirmation: "My creativity flows freely and authentically"
      },
      { 
        title: "Heart Wisdom", 
        description: "Listen to what your heart is trying to tell you",
        color: "pink",
        affirmation: "My heart holds infinite wisdom and love"
      }
    ];

    return themes[Math.floor(Math.random() * themes.length)];
  }
}

export async function trackRitualCompletion(ritualType, userId) {
  try {
    await apiRequest('POST', '/api/ritual-completion', {
      ritual_type: ritualType,
      completed_at: new Date().toISOString(),
      week_id: getCurrentWeekId()
    });

    // Update weekly progress
    const progressResult = await updateRitualProgress(userId);
    
    // Check for rewards
    const rewardResult = await checkRewardUnlock(userId);

    return {
      success: true,
      progress: progressResult,
      reward: rewardResult
    };
  } catch (error) {
    console.error('Error tracking ritual completion:', error);
    return { success: false, error: error.message };
  }
}