interface User {
  name?: string;
  firstName?: string;
  lastName?: string;
}

export const generateMorningRitual = (user?: User): string[] => {
  const name = user?.name || user?.firstName || "friend";
  
  return [
    `🌞 Good morning, ${name}.`,
    "🧘‍♀️ Take 3 deep breaths. Set a gentle intention for the day.",
    "📓 Prompt: What energy do you want to carry today?",
    "🔄 Tap to reflect when you're ready."
  ];
};

export const generateEveningRitual = (user?: User): string[] => {
  const name = user?.name || user?.firstName || "you";
  
  return [
    `🌙 Evening check-in, ${name}.`,
    "🙏 Think of one moment today you're grateful for.",
    "📓 Prompt: What did you learn about yourself today?",
    "🛌 Unwind with stillness before bed."
  ];
};

export const generateCustomRitual = (timeOfDay: 'morning' | 'evening', user?: User): string[] => {
  return timeOfDay === 'morning' ? generateMorningRitual(user) : generateEveningRitual(user);
};

export const getRitualPrompt = (timeOfDay: 'morning' | 'evening'): string => {
  const morningPrompts = [
    "What energy do you want to carry today?",
    "What intention will guide your day?",
    "How do you want to show up for yourself today?",
    "What does your heart need this morning?"
  ];
  
  const eveningPrompts = [
    "What did you learn about yourself today?",
    "What moment from today deserves gratitude?",
    "How did you grow today?",
    "What wisdom did today offer you?"
  ];
  
  const prompts = timeOfDay === 'morning' ? morningPrompts : eveningPrompts;
  return prompts[Math.floor(Math.random() * prompts.length)];
};