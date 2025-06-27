import { useEffect, useState } from 'react';
import { getStreak } from '@/utils/getStreak';

interface StreakData {
  streakCount: number;
  longestStreak: number;
  totalDays: number;
  lastEntryDate: string | null;
}

export function useJournalStreak(userId: string | null) {
  const [streakData, setStreakData] = useState<StreakData>({
    streakCount: 0,
    longestStreak: 0,
    totalDays: 0,
    lastEntryDate: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchStreak = async () => {
      setLoading(true);
      try {
        const data = await getStreak(userId);
        setStreakData(data);
      } catch (error) {
        console.error('Failed to fetch streak data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, [userId]);

  const refreshStreak = async () => {
    if (!userId) return;
    
    try {
      const data = await getStreak(userId);
      setStreakData(data);
    } catch (error) {
      console.error('Failed to refresh streak data:', error);
    }
  };

  return {
    ...streakData,
    loading,
    refreshStreak
  };
}