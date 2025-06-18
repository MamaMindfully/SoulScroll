import { useState } from 'react';

interface UserProfile {
  intent?: string;
  ritualTime?: string;
  [key: string]: any;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const stored = localStorage.getItem('soulscroll-profile');
    return stored ? JSON.parse(stored) : {};
  });

  const savePreferences = (prefs: Partial<UserProfile>) => {
    const updated = { ...profile, ...prefs };
    localStorage.setItem('soulscroll-profile', JSON.stringify(updated));
    setProfile(updated);
  };

  return { profile, savePreferences };
};