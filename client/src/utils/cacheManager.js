// Cache manager for optimizing API calls and improving performance

const CACHE_DURATIONS = {
  arc_prompt: 24 * 60 * 60 * 1000, // 24 hours
  insight_today: 4 * 60 * 60 * 1000, // 4 hours
  user_traits: 30 * 60 * 1000, // 30 minutes
  emotion_history: 15 * 60 * 1000, // 15 minutes
  ritual_streak: 5 * 60 * 1000, // 5 minutes
};

export function getCachedData(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp, expiresAt } = JSON.parse(cached);
    
    if (expiresAt && Date.now() > expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Cache read error:', error);
    localStorage.removeItem(key);
    return null;
  }
}

export function setCachedData(key, data, customDuration = null) {
  try {
    const duration = customDuration || CACHE_DURATIONS[key] || 60000; // 1 minute default
    const cacheObject = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration
    };

    localStorage.setItem(key, JSON.stringify(cacheObject));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

export function clearCache(key = null) {
  if (key) {
    localStorage.removeItem(key);
  } else {
    // Clear all cache keys
    Object.keys(CACHE_DURATIONS).forEach(cacheKey => {
      localStorage.removeItem(cacheKey);
    });
  }
}

export function getTodaysCachedPrompt() {
  const today = new Date().toISOString().split('T')[0];
  const cached = getCachedData('arc_prompt_today');
  
  if (cached?.date === today) {
    return cached.prompt;
  }
  
  return null;
}

export function setTodaysCachedPrompt(prompt) {
  const today = new Date().toISOString().split('T')[0];
  setCachedData('arc_prompt_today', { prompt, date: today });
}

export function getEmotionScoreFromResponse(response) {
  const scoreMatch = response.match(/Score: (\d+\.?\d*)/);
  return scoreMatch ? parseFloat(scoreMatch[1]) : 0;
}

export function filterNodesByTimeframe(nodes, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return nodes.filter(node => {
    const nodeDate = new Date(node.timestamp || node.createdAt);
    return nodeDate > cutoffDate;
  });
}

export function isCacheExpired(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return true;

    const { expiresAt } = JSON.parse(cached);
    return Date.now() > expiresAt;
  } catch {
    return true;
  }
}