// Daily Ritual Engine for morning and evening practices
interface Ritual {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  type: 'affirmation' | 'breathwork' | 'self-care' | 'meditation';
  timeOfDay: 'morning' | 'evening' | 'anytime';
  content: string[];
}

const MORNING_RITUALS: Ritual[] = [
  {
    id: 'morning-gratitude',
    title: 'Gratitude Awakening',
    description: 'Start your day with appreciation',
    duration: 3,
    type: 'affirmation',
    timeOfDay: 'morning',
    content: [
      'I am grateful for this new day and its possibilities',
      'My mind is clear and my heart is open',
      'I choose to see beauty in ordinary moments today',
      'I trust in my ability to handle whatever comes my way',
      'I am worthy of love, success, and happiness'
    ]
  },
  {
    id: 'morning-breathwork',
    title: 'Energizing Breath',
    description: 'Awaken your body with conscious breathing',
    duration: 5,
    type: 'breathwork',
    timeOfDay: 'morning',
    content: [
      'Sit comfortably with your spine straight',
      'Inhale slowly for 4 counts through your nose',
      'Hold your breath for 4 counts',
      'Exhale for 6 counts through your mouth',
      'Repeat this pattern 8-10 times',
      'Notice the energy flowing through your body'
    ]
  },
  {
    id: 'morning-intention',
    title: 'Daily Intention Setting',
    description: 'Define your purpose for the day',
    duration: 2,
    type: 'self-care',
    timeOfDay: 'morning',
    content: [
      'What do I want to feel today?',
      'How do I want to show up in the world?',
      'What would make today meaningful?',
      'What is one small act of kindness I can do?',
      'How can I honor my authentic self today?'
    ]
  }
];

const EVENING_RITUALS: Ritual[] = [
  {
    id: 'evening-reflection',
    title: 'Day Reflection',
    description: 'Honor your journey through the day',
    duration: 5,
    type: 'self-care',
    timeOfDay: 'evening',
    content: [
      'What am I most grateful for today?',
      'What challenged me and how did I grow?',
      'What moment brought me joy?',
      'How did I show up for myself and others?',
      'What would I like to release before sleep?'
    ]
  },
  {
    id: 'evening-breathwork',
    title: 'Calming Breath',
    description: 'Release the day with gentle breathing',
    duration: 5,
    type: 'breathwork',
    timeOfDay: 'evening',
    content: [
      'Lie down or sit comfortably',
      'Place one hand on your chest, one on your belly',
      'Breathe naturally and notice which hand moves more',
      'Gradually deepen your breath to move the lower hand',
      'Inhale for 4 counts, exhale for 6 counts',
      'Let each exhale release any tension from the day'
    ]
  },
  {
    id: 'evening-gratitude',
    title: 'Evening Gratitude',
    description: 'End your day with appreciation',
    duration: 3,
    type: 'affirmation',
    timeOfDay: 'evening',
    content: [
      'I am grateful for the lessons today brought me',
      'I trust that I am exactly where I need to be',
      'I release what no longer serves me',
      'I embrace rest as a sacred practice',
      'Tomorrow brings new opportunities for growth'
    ]
  }
];

export class DailyRitualEngine {
  private static STORAGE_KEY = 'soulscroll-daily-rituals';
  
  static getTodaysRituals(): { morning: Ritual; evening: Ritual } {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(this.STORAGE_KEY);
    
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        return data.rituals;
      }
    }
    
    // Generate new rituals for today
    const morningRitual = MORNING_RITUALS[Math.floor(Math.random() * MORNING_RITUALS.length)];
    const eveningRitual = EVENING_RITUALS[Math.floor(Math.random() * EVENING_RITUALS.length)];
    
    const todaysRituals = { morning: morningRitual, evening: eveningRitual };
    
    // Store for today
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      date: today,
      rituals: todaysRituals
    }));
    
    return todaysRituals;
  }
  
  static getRitualByTime(): Ritual {
    const hour = new Date().getHours();
    const rituals = this.getTodaysRituals();
    
    // Morning: 4 AM - 11 AM
    if (hour >= 4 && hour < 11) {
      return rituals.morning;
    }
    // Evening: 6 PM - 11 PM
    else if (hour >= 18 && hour < 23) {
      return rituals.evening;
    }
    // Default to morning ritual during other times
    else {
      return rituals.morning;
    }
  }
  
  static markRitualCompleted(ritualId: string): void {
    const today = new Date().toDateString();
    const completedKey = `${this.STORAGE_KEY}-completed`;
    const stored = localStorage.getItem(completedKey);
    
    let completed: { [key: string]: string[] } = {};
    if (stored) {
      completed = JSON.parse(stored);
    }
    
    if (!completed[today]) {
      completed[today] = [];
    }
    
    if (!completed[today].includes(ritualId)) {
      completed[today].push(ritualId);
      localStorage.setItem(completedKey, JSON.stringify(completed));
    }
  }
  
  static isRitualCompleted(ritualId: string): boolean {
    const today = new Date().toDateString();
    const completedKey = `${this.STORAGE_KEY}-completed`;
    const stored = localStorage.getItem(completedKey);
    
    if (!stored) return false;
    
    const completed = JSON.parse(stored);
    return completed[today]?.includes(ritualId) || false;
  }
  
  static getCompletionStreak(): number {
    const completedKey = `${this.STORAGE_KEY}-completed`;
    const stored = localStorage.getItem(completedKey);
    
    if (!stored) return 0;
    
    const completed = JSON.parse(stored);
    const today = new Date();
    let streak = 0;
    
    // Check backwards from today
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toDateString();
      
      if (completed[dateStr] && completed[dateStr].length > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }
}

export default DailyRitualEngine;