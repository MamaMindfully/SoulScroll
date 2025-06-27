import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';

export const useDailyReminder = () => {
  const [message, setMessage] = useState<string | null>(null);
  const { userId, isLoggedIn } = useAppStore();

  useEffect(() => {
    const checkReminder = async () => {
      const today = new Date().toISOString().split('T')[0];
      const shownToday = localStorage.getItem('dailyPromptDate') === today;
      
      if (shownToday) return;

      // Use userId from store or fallback to localStorage
      const userIdToUse = userId || localStorage.getItem('userId');
      
      if (!userIdToUse) return;

      try {
        const response = await fetch(`/api/daily-prompt?userId=${userIdToUse}`);
        const data = await response.json();
        
        if (data.message || data.dailyMessage) {
          setMessage(data.message || data.dailyMessage);
          localStorage.setItem('dailyPromptDate', today);
        }
      } catch (error) {
        console.error('Failed to fetch daily reminder:', error);
      }
    };

    checkReminder();
  }, [userId, isLoggedIn]);

  const dismissReminder = () => {
    setMessage(null);
  };

  return { message, dismissReminder };
};