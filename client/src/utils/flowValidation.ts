import { z } from 'zod';

// Validation schemas for flow components
export const morningEntrySchema = z.object({
  gratitude: z.string().min(5, 'Please write at least 5 characters').max(500, 'Keep it under 500 characters'),
  intention: z.string().min(5, 'Please write at least 5 characters').max(200, 'Keep it under 200 characters'),
  mood: z.string().min(1, 'Please select a mood')
});

export const eveningEntrySchema = z.object({
  highPoint: z.string().min(5, 'Please write at least 5 characters').max(500, 'Keep it under 500 characters'),
  lesson: z.string().min(5, 'Please write at least 5 characters').max(500, 'Keep it under 500 characters'),
  emotion: z.string().min(1, 'Please select an emotion')
});

export const onboardingSchema = z.object({
  intent: z.string().min(1, 'Please select your intention'),
  ritualTime: z.string().min(1, 'Please choose your preferred time')
});

// Storage utilities with error handling
export const safeLocalStorageSet = (key: string, value: any): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage (${key}):`, error);
    return false;
  }
};

export const safeLocalStorageGet = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Failed to read from localStorage (${key}):`, error);
    return defaultValue;
  }
};

// Flow completion tracking
export const markFlowCompleted = (flowType: 'morning' | 'evening' | 'onboarding'): boolean => {
  const today = new Date().toDateString();
  const key = `last-${flowType}-${flowType === 'onboarding' ? 'completed' : 'ritual'}`;
  
  if (flowType === 'onboarding') {
    return safeLocalStorageSet('soulscroll-onboarding-completed', 'true');
  }
  
  // Mark daily ritual completion
  const success1 = safeLocalStorageSet(key, today);
  
  // Update ritual stats
  const completedRituals = safeLocalStorageGet('soulscroll-completed-rituals', []);
  if (!completedRituals.includes(today)) {
    completedRituals.push(today);
    const success2 = safeLocalStorageSet('soulscroll-completed-rituals', completedRituals);
    return success1 && success2;
  }
  
  return success1;
};

// Check if flow was completed today
export const isFlowCompletedToday = (flowType: 'morning' | 'evening'): boolean => {
  const today = new Date().toDateString();
  const lastCompletion = safeLocalStorageGet(`last-${flowType}-ritual`, '');
  return lastCompletion === today;
};