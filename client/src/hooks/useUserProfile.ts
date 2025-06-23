import { useState, useEffect } from 'react';
import { useHasMounted } from './useHasMounted';

interface UserProfile {
  intent?: string;
  ritualTime?: string;
  [key: string]: any;
}

export const useUserProfile = () => {
  const hasMounted = useHasMounted();
  const [profile, setProfile] = useState<UserProfile>({});

  useEffect(() => {
    if (!hasMounted) return;
    
    try {
      const stored = localStorage.getItem('soulscroll-profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfile(parsed);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setProfile({});
    }
  }, [hasMounted]);

  const savePreferences = (prefs: Partial<UserProfile>) => {
    if (!hasMounted) return;
    
    try {
      const updated = { ...profile, ...prefs };
      localStorage.setItem('soulscroll-profile', JSON.stringify(updated));
      setProfile(updated);
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  };

  return { profile, savePreferences };
};