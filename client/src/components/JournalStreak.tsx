import React from 'react';
import { Flame, Target, Trophy } from 'lucide-react';

interface JournalStreakProps {
  count: number;
  className?: string;
}

export default function JournalStreak({ count, className = '' }: JournalStreakProps) {
  if (!count || count < 2) return null;

  const getStreakIcon = () => {
    if (count >= 30) return <Trophy className="w-4 h-4 text-yellow-400" />;
    if (count >= 7) return <Target className="w-4 h-4 text-purple-400" />;
    return <Flame className="w-4 h-4 text-orange-400" />;
  };

  const getStreakMessage = () => {
    if (count >= 30) return `🏆 Incredible! ${count} days strong. You're a journaling legend.`;
    if (count >= 21) return `🌟 Amazing! ${count} days in a row. You're building something beautiful.`;
    if (count >= 14) return `✨ Fantastic! ${count} days straight. Your commitment is inspiring.`;
    if (count >= 7) return `🔥 One week strong! ${count} days of consistent reflection.`;
    return `🔥 ${count} days in a row. Keep the momentum going!`;
  };

  const getStreakColor = () => {
    if (count >= 30) return 'text-yellow-400';
    if (count >= 14) return 'text-purple-400';
    if (count >= 7) return 'text-indigo-400';
    return 'text-orange-400';
  };

  return (
    <div className={`flex items-center gap-2 p-3 bg-gradient-to-r from-gray-900/50 to-black/50 rounded-lg border border-gray-700 ${className}`}>
      {getStreakIcon()}
      <span className={`text-sm font-medium ${getStreakColor()}`}>
        {getStreakMessage()}
      </span>
    </div>
  );
}