import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { logEmotionTrend } from '@/utils/logEmotionTrend';

export function useEmotionTrendSync(score: number | null, dominantEmotion: string) {
  const { userId, isLoggedIn } = useUserStore();

  useEffect(() => {
    if (!isLoggedIn || !userId || score === null || !dominantEmotion) return;

    const syncEmotion = async () => {
      try {
        await logEmotionTrend({ userId, score, dominantEmotion });
      } catch (error) {
        console.error('Failed to sync emotion trend:', error);
      }
    };

    // Debounce emotion logging to avoid too many requests
    const timeoutId = setTimeout(syncEmotion, 1000);
    return () => clearTimeout(timeoutId);
  }, [userId, isLoggedIn, score, dominantEmotion]);
}