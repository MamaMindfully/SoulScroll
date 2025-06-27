import { useEffect } from 'react';
import { logEmotionTrend } from '@/utils/logEmotionTrend';

export function useEmotionTrendSync(userId: string | null, score: number | null, dominantEmotion: string) {
  useEffect(() => {
    if (!userId || score === null || !dominantEmotion) return;

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
  }, [userId, score, dominantEmotion]);
}