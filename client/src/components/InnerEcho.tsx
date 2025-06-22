import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';

const InnerEcho: React.FC = () => {
  const [echo, setEcho] = useState<string | null>(null);
  const { userId, isLoggedIn } = useAppStore();

  useEffect(() => {
    const fetchEcho = async () => {
      // Use localStorage as fallback if user not logged in
      const userIdToUse = userId || localStorage.getItem('userId');
      
      if (!userIdToUse) return;

      try {
        const response = await fetch(`/api/echo?userId=${userIdToUse}`);
        const data = await response.json();
        setEcho(data.echo);
      } catch (error) {
        console.error('Failed to fetch echo:', error);
      }
    };

    fetchEcho();
  }, [userId, isLoggedIn]);

  if (!echo) return null;

  return (
    <div className="max-w-xl px-6 py-4 rounded-2xl shadow-xl bg-black/70 text-white text-center text-lg italic fade-in-slow border border-white/10">
      "{echo}"
    </div>
  );
};

export default InnerEcho;