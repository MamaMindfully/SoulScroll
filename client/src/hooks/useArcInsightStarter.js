import { useState } from 'react';
import { useUser } from './useUser';
import { getCachedData, setCachedData, getTodaysCachedPrompt, setTodaysCachedPrompt } from '@/utils/cacheManager';

export default function useArcInsightStarter() {
  const { user, userTraits, trackBehavior } = useUser();
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function startArcInsight(customPrompt = null) {
    if (!user?.id || loading) return null;

    setLoading(true);
    setError(null);

    try {
      // Generate prompt based on user traits if no custom prompt provided
      let prompt = customPrompt;
      
      if (!prompt) {
        // Check cache for today's prompt first
        const cachedPrompt = getTodaysCachedPrompt();
        if (cachedPrompt) {
          prompt = cachedPrompt;
        } else {
          prompt = userTraits?.likesAffirmations
            ? "Give me a poetic affirmation to soften my guard and open my heart."
            : "Ask me a direct question to guide my inner search and deepen my self-understanding.";
          
          // Cache the generated prompt
          setTodaysCachedPrompt(prompt);
        }
      }

      // Track the Arc insight request
      trackBehavior('arc_insight_request', {
        promptType: customPrompt ? 'custom' : 'auto',
        userPreference: userTraits?.likesAffirmations ? 'affirmations' : 'questions',
        timestamp: new Date().toISOString()
      });

      const response = await fetch('/api/arc-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error('Failed to get Arc insight');
      }

      const data = await response.json();
      setInsight(data.content);
      
      return data.content;

    } catch (err) {
      console.error('Arc insight error:', err);
      setError(err.message);
      
      // Fallback insights based on user preferences
      const fallbackInsights = userTraits?.likesAffirmations ? [
        "You are exactly where you need to be in this moment of questioning.",
        "Your heart knows things your mind is still learning to trust.",
        "This pause in your journey is not emptiness—it's preparation."
      ] : [
        "What is your soul trying to tell you that you're not quite ready to hear?",
        "Which part of this experience deserves more of your attention?",
        "How might this uncertainty be preparing you for what's coming?"
      ];

      const fallbackInsight = fallbackInsights[Math.floor(Math.random() * fallbackInsights.length)];
      setInsight(fallbackInsight);
      
      return fallbackInsight;

    } finally {
      setLoading(false);
    }
  }

  function clearInsight() {
    setInsight(null);
    setError(null);
  }

  return { 
    insight, 
    loading, 
    error, 
    startArcInsight, 
    clearInsight 
  };
}