import { apiRequest } from '../lib/queryClient';

export async function maybeUnlockSecretScroll(userId) {
  try {
    // Get user's journal entry count
    const response = await apiRequest('GET', '/api/journal/entries?limit=1000');
    const entries = await response.json();
    
    const entryCount = entries.length;

    // Check if user has reached a milestone (every 10 entries)
    if (entryCount % 10 === 0 && entryCount > 0) {
      const scroll = await generateSecretScroll(userId, entryCount);
      return { unlocked: true, scroll, milestone: entryCount };
    }

    return { unlocked: false, nextMilestone: Math.ceil(entryCount / 10) * 10 };
  } catch (error) {
    console.error('Error checking secret scroll unlock:', error);
    return { unlocked: false, error: error.message };
  }
}

async function generateSecretScroll(userId, milestone) {
  try {
    const response = await apiRequest('POST', '/api/generate-secret-scroll', {
      milestone: milestone,
      userId: userId
    });

    const data = await response.json();
    
    // Save the scroll to backend
    await apiRequest('POST', '/api/secret-scrolls', {
      scroll_text: data.scroll,
      milestone: milestone
    });

    return data.scroll;
  } catch (error) {
    console.error('Error generating secret scroll:', error);
    return generateFallbackScroll(milestone);
  }
}

function generateFallbackScroll(milestone) {
  const scrollTemplates = [
    {
      quote: "The depth of your journey is measured not in miles, but in moments of truth.",
      advice: "Continue to honor your inner voice - it knows the way forward."
    },
    {
      quote: "Each word you write is a seed planted in the garden of your soul.",
      advice: "Trust the process of growth, even when you cannot see the roots forming."
    },
    {
      quote: "In the silence between thoughts, wisdom whispers its ancient secrets.",
      advice: "Make space for stillness in your daily practice - clarity emerges from calm."
    },
    {
      quote: "Your story is both the map and the territory of your becoming.",
      advice: "Embrace the chapters that feel unfinished - they hold tomorrow's breakthroughs."
    },
    {
      quote: "The heart remembers what the mind forgets, and the soul never lies.",
      advice: "When words feel stuck, write anyway - sometimes breakthrough looks like mess first."
    }
  ];

  const template = scrollTemplates[Math.floor(Math.random() * scrollTemplates.length)];
  
  return {
    title: `Milestone ${milestone}: The Sacred Scroll`,
    quote: template.quote,
    advice: template.advice,
    unlocked_on: new Date().toISOString(),
    milestone: milestone
  };
}

export async function getUserSecretScrolls(userId) {
  try {
    const response = await apiRequest('GET', '/api/secret-scrolls');
    const scrolls = await response.json();
    return scrolls;
  } catch (error) {
    console.error('Error fetching secret scrolls:', error);
    return [];
  }
}

export async function checkMilestoneProgress(currentEntryCount) {
  const nextMilestone = Math.ceil(currentEntryCount / 10) * 10;
  const progress = currentEntryCount % 10;
  const remainingEntries = nextMilestone - currentEntryCount;

  return {
    current_count: currentEntryCount,
    next_milestone: nextMilestone,
    progress: progress,
    remaining_entries: remainingEntries,
    progress_percentage: (progress / 10) * 100,
    is_at_milestone: remainingEntries === 0
  };
}

export async function displaySecretScroll(scroll) {
  // This would be used by the UI component to show the scroll
  return {
    type: 'secret_scroll',
    title: scroll.title || 'Sacred Wisdom Unlocked',
    content: {
      quote: scroll.quote,
      advice: scroll.advice,
      milestone: scroll.milestone
    },
    animation: 'fade-in-scale',
    duration: 5000, // Show for 5 seconds
    dismissible: true
  };
}

export async function getScrollByMilestone(milestone) {
  try {
    const response = await apiRequest('GET', `/api/secret-scrolls/milestone/${milestone}`);
    const scroll = await response.json();
    return scroll;
  } catch (error) {
    console.error('Error fetching scroll by milestone:', error);
    return null;
  }
}

export async function getRecentScrolls(limit = 5) {
  try {
    const response = await apiRequest('GET', `/api/secret-scrolls?limit=${limit}`);
    const scrolls = await response.json();
    return scrolls;
  } catch (error) {
    console.error('Error fetching recent scrolls:', error);
    return [];
  }
}

// Check if user should unlock scroll after journal entry
export async function checkScrollUnlockAfterEntry(userId) {
  try {
    const result = await maybeUnlockSecretScroll(userId);
    
    if (result.unlocked) {
      // Trigger UI notification or modal
      return {
        shouldShow: true,
        scroll: result.scroll,
        milestone: result.milestone,
        message: `Congratulations! You've reached ${result.milestone} journal entries and unlocked a Sacred Scroll!`
      };
    }

    return {
      shouldShow: false,
      ...result
    };
  } catch (error) {
    console.error('Error checking scroll unlock after entry:', error);
    return { shouldShow: false, error: error.message };
  }
}