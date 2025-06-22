import React from 'react';
import { Flame, Award, Calendar, TrendingUp } from 'lucide-react';
import JournalStreak from './JournalStreak';

interface StreakDisplayProps {
  streakCount: number;
  longestStreak: number;
  totalDays: number;
  loading?: boolean;
  className?: string;
}

export default function StreakDisplay({ 
  streakCount, 
  longestStreak, 
  totalDays, 
  loading = false,
  className = '' 
}: StreakDisplayProps) {
  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-800 h-20 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Streak */}
      <JournalStreak count={streakCount} />

      {/* Streak Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 p-4 rounded-xl border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">Current Streak</span>
          </div>
          <p className="text-2xl font-bold text-white">{streakCount}</p>
          <p className="text-xs text-gray-400">days in a row</p>
        </div>

        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 p-4 rounded-xl border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">Best Streak</span>
          </div>
          <p className="text-2xl font-bold text-white">{longestStreak}</p>
          <p className="text-xs text-gray-400">personal record</p>
        </div>

        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 p-4 rounded-xl border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">Total Days</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalDays}</p>
          <p className="text-xs text-gray-400">journaling days</p>
        </div>
      </div>

      {/* Encouragement Message */}
      {streakCount === 0 && totalDays > 0 && (
        <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 p-4 rounded-lg border border-indigo-500/20">
          <div className="flex items-center gap-2 text-indigo-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Ready for a new streak?</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Your longest streak was {longestStreak} days. You can do it again!
          </p>
        </div>
      )}
    </div>
  );
}