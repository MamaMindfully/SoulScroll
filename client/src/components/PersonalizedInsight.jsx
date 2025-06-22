import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { Sparkles, Brain, Heart } from 'lucide-react';

export default function PersonalizedInsight() {
  const { user, trackBehavior } = useUser();
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchTodayInsight = async () => {
      try {
        // Check cache first
        const cachedInsight = localStorage.getItem('insight_today');
        
        if (cachedInsight) {
          const cached = JSON.parse(cachedInsight);
          const cacheAge = Date.now() - cached.timestamp;
          const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours
          
          if (cacheAge < CACHE_DURATION) {
            setInsight(cached.data);
            setLoading(false);
            return;
          }
        }

        // Fetch fresh insight
        const response = await fetch(`/api/today-insight?userId=${user.id}`);
        const data = await response.json();
        
        if (response.ok) {
          setInsight(data);
          
          // Cache the insight
          localStorage.setItem('insight_today', JSON.stringify({
            data,
            timestamp: Date.now()
          }));
          
          // Track that user received personalized insight
          trackBehavior('received_insight', {
            type: data.type,
            personalized: data.personalized
          });
        }
      } catch (error) {
        console.error('Failed to fetch insight:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayInsight();
  }, [user?.id, trackBehavior]);

  const handleInteraction = (action) => {
    trackBehavior('insight_interaction', {
      action,
      insightType: insight?.type,
      timestamp: new Date().toISOString()
    });
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded mb-4"></div>
        <div className="h-4 bg-white/10 rounded"></div>
      </div>
    );
  }

  if (!insight) return null;

  const getIcon = () => {
    switch (insight.type) {
      case 'affirmation':
        return <Heart className="w-5 h-5 text-pink-400" />;
      case 'reflection':
        return <Brain className="w-5 h-5 text-blue-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-400" />;
    }
  };

  const getGradient = () => {
    switch (insight.type) {
      case 'affirmation':
        return 'from-pink-900/30 to-rose-900/30 border-pink-500/30';
      case 'reflection':
        return 'from-blue-900/30 to-indigo-900/30 border-blue-500/30';
      default:
        return 'from-purple-900/30 to-indigo-900/30 border-purple-500/30';
    }
  };

  return (
    <div className={`bg-gradient-to-br ${getGradient()} rounded-xl p-6 border text-white relative overflow-hidden`}>
      {insight.personalized && (
        <div className="absolute top-2 right-2">
          <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
        </div>
      )}
      
      <div className="flex items-start gap-3 mb-4">
        {getIcon()}
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">
            {insight.type === 'affirmation' ? 'Today\'s Affirmation' : 'Today\'s Reflection'}
          </h3>
          {insight.personalized && (
            <p className="text-xs text-white/60">Personalized for your journey</p>
          )}
        </div>
      </div>

      <p className="text-lg leading-relaxed mb-4 font-medium">
        {insight.insight}
      </p>

      {insight.basedOn && (
        <div className="text-xs text-white/50 mb-4">
          <p>Based on: {insight.basedOn.themes?.join(', ') || 'Your recent patterns'}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => handleInteraction('reflect')}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
        >
          Reflect on this
        </button>
        <button
          onClick={() => handleInteraction('save')}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
        >
          Save for later
        </button>
      </div>
    </div>
  );
}