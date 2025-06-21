// Inner compass engine for daily guidance and themes
interface CompassTheme {
  theme: string;
  prompt: string;
  color: string;
  icon: string;
}

const compassThemes: CompassTheme[] = [
  { 
    theme: 'Clarity', 
    prompt: 'What are you ready to understand more clearly today?',
    color: 'blue',
    icon: '🔍'
  },
  { 
    theme: 'Compassion', 
    prompt: 'How can you extend kindness inward today?',
    color: 'pink',
    icon: '💝'
  },
  { 
    theme: 'Presence', 
    prompt: 'What does being here and now feel like for you?',
    color: 'green',
    icon: '🌿'
  },
  { 
    theme: 'Growth', 
    prompt: 'What\'s trying to grow through you right now?',
    color: 'purple',
    icon: '🌱'
  },
  { 
    theme: 'Stillness', 
    prompt: 'Where can you create more quiet today?',
    color: 'indigo',
    icon: '🧘'
  },
  { 
    theme: 'Courage', 
    prompt: 'What would you do if you knew you were brave enough?',
    color: 'orange',
    icon: '🦁'
  },
  { 
    theme: 'Trust', 
    prompt: 'What is your intuition trying to tell you right now?',
    color: 'teal',
    icon: '🔮'
  },
  { 
    theme: 'Release', 
    prompt: 'What are you ready to let go of today?',
    color: 'gray',
    icon: '🕊️'
  },
  { 
    theme: 'Wonder', 
    prompt: 'What fills you with curiosity and amazement today?',
    color: 'yellow',
    icon: '✨'
  },
  { 
    theme: 'Connection', 
    prompt: 'How do you want to show up in your relationships today?',
    color: 'rose',
    icon: '🤝'
  }
];

export function getDailyCompass(): CompassTheme {
  const daySeed = new Date().toISOString().split('T')[0];
  const index = daySeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % compassThemes.length;
  return compassThemes[index];
}

export function getWeeklyCompass(): CompassTheme[] {
  const today = new Date();
  const weeklyThemes: CompassTheme[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const daySeed = date.toISOString().split('T')[0];
    const index = daySeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % compassThemes.length;
    weeklyThemes.push(compassThemes[index]);
  }
  
  return weeklyThemes;
}

export function getCompassByTheme(themeName: string): CompassTheme | undefined {
  return compassThemes.find(theme => theme.theme.toLowerCase() === themeName.toLowerCase());
}