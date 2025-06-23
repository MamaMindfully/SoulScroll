import { useState, useEffect } from 'react';
// Remove useUser import to prevent hook violations
import { Flame, Calendar, Trophy, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RitualStreakDisplay() {
  const { user, trackBehavior } = useUser();
  const [streak, setStreak] = useState(null);
  const [milestone, setMilestone] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchStreak = async () => {
      try {
        const response = await fetch(`/api/ritual-streak?userId=${user.id}`);
        const data = await response.json();
        
        if (response.ok) {
          setStreak(data.streak);
          setMilestone(data.milestone);
          
          trackBehavior('view_ritual_streak', {
            streakCount: data.streak?.count || 0,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Failed to fetch ritual streak:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, [user?.id, trackBehavior]);

  const updateStreak = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/ritual-streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const data = await response.json();
      
      if (response.ok) {
        setStreak(data.streak);
        setMilestone(data.milestone);
        
        trackBehavior('complete_ritual', {
          newStreakCount: data.streak.count,
          milestone: data.milestone,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to update ritual streak:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-xl p-4 animate-pulse">
        <div className="h-6 bg-white/10 rounded mb-2"></div>
        <div className="h-4 bg-white/10 rounded"></div>
      </div>
    );
  }

  const streakCount = streak?.count || 0;
  const canCompleteToday = !streak || !isToday(streak.lastDay);

  return (
    <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-xl p-6 border border-orange-500/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Flame className={`w-6 h-6 ${streakCount > 0 ? 'text-orange-400' : 'text-gray-500'}`} />
            {streakCount > 0 && (
              <motion.div
                className="absolute -inset-1 bg-orange-400/20 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">Daily Ritual Streak</h3>
            <p className="text-orange-300 text-sm">{getStreakMessage(streakCount)}</p>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-400">{streakCount}</div>
          <div className="text-xs text-orange-300">days</div>
        </div>
      </div>

      {milestone && (
        <motion.div
          className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-4 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-semibold text-sm">Milestone Reached!</span>
          </div>
          <p className="text-white text-sm italic">{milestone}</p>
        </motion.div>
      )}

      {canCompleteToday && (
        <button
          onClick={updateStreak}
          className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg transition-colors"
        >
          <Target className="w-4 h-4" />
          Complete Today's Ritual
        </button>
      )}

      {!canCompleteToday && streak && (
        <div className="flex items-center justify-center gap-2 text-green-400 py-3">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">Ritual completed today</span>
        </div>
      )}

      <div className="mt-4 text-center">
        <p className="text-white/60 text-xs">
          {getNextMilestone(streakCount)} more days to next milestone
        </p>
      </div>
    </div>
  );
}

function getStreakMessage(count) {
  if (count === 0) return "Ready to begin your journey";
  if (count === 1) return "Every journey begins with a single step";
  if (count < 7) return "Building your sacred practice";
  if (count < 30) return "Your ritual is taking root";
  if (count < 100) return "Consistency is your strength";
  return "You are a master of ritual";
}

function getNextMilestone(count) {
  const milestones = [7, 30, 100, 365, 1000];
  for (const milestone of milestones) {
    if (count < milestone) {
      return milestone - count;
    }
  }
  return 'Many';
}

function isToday(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}