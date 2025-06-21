export type MoodType = 'anxious' | 'tired' | 'hopeful' | 'angry' | 'peaceful' | 'excited' | 'sad' | 'grateful' | 'overwhelmed' | 'confident';

export interface Mantra {
  text: string;
  category: string;
  affirmation: string;
}

const mantraLibrary: Record<MoodType, Mantra[]> = {
  anxious: [
    {
      text: "I am grounded. My breath is my anchor.",
      category: "Grounding",
      affirmation: "I choose peace over worry."
    },
    {
      text: "This feeling will pass. I am safe in this moment.",
      category: "Safety",
      affirmation: "I trust in my ability to handle what comes."
    },
    {
      text: "I breathe in calm, I breathe out tension.",
      category: "Breathing",
      affirmation: "My breath brings me back to center."
    }
  ],
  tired: [
    {
      text: "Rest is strength. I honor my rhythm.",
      category: "Self-Care",
      affirmation: "I give myself permission to rest."
    },
    {
      text: "My energy returns as I nurture myself.",
      category: "Renewal",
      affirmation: "Rest is productive and necessary."
    },
    {
      text: "I listen to my body's wisdom.",
      category: "Body Wisdom",
      affirmation: "My needs matter and deserve attention."
    }
  ],
  hopeful: [
    {
      text: "I welcome growth with open arms.",
      category: "Growth",
      affirmation: "Every experience teaches me something valuable."
    },
    {
      text: "My dreams are seeds of future reality.",
      category: "Dreams",
      affirmation: "I trust in the unfolding of my path."
    },
    {
      text: "Hope is my compass, guiding me forward.",
      category: "Direction",
      affirmation: "I move toward my highest good."
    }
  ],
  angry: [
    {
      text: "I release what I cannot control. I return to peace.",
      category: "Release",
      affirmation: "My peace is more powerful than my anger."
    },
    {
      text: "This anger carries a message. I listen with wisdom.",
      category: "Understanding",
      affirmation: "I honor my feelings while choosing my response."
    },
    {
      text: "I transform this fire into fuel for positive change.",
      category: "Transformation",
      affirmation: "My emotions guide me toward what matters."
    }
  ],
  peaceful: [
    {
      text: "I am at home in this moment of stillness.",
      category: "Presence",
      affirmation: "Peace is my natural state."
    },
    {
      text: "Tranquility flows through every breath.",
      category: "Flow",
      affirmation: "I carry peace wherever I go."
    }
  ],
  excited: [
    {
      text: "I channel this energy into positive action.",
      category: "Energy",
      affirmation: "My enthusiasm creates beautiful possibilities."
    },
    {
      text: "Joy is my fuel for creating magic.",
      category: "Joy",
      affirmation: "I embrace this excitement with gratitude."
    }
  ],
  sad: [
    {
      text: "I honor this sadness as part of my human experience.",
      category: "Acceptance",
      affirmation: "My feelings are valid and temporary."
    },
    {
      text: "Tears water the seeds of my growth.",
      category: "Growth",
      affirmation: "I allow myself to feel fully and heal completely."
    }
  ],
  grateful: [
    {
      text: "Gratitude multiplies the good in my life.",
      category: "Abundance",
      affirmation: "I see blessings everywhere I look."
    },
    {
      text: "My heart overflows with appreciation.",
      category: "Heart",
      affirmation: "Thankfulness is my superpower."
    }
  ],
  overwhelmed: [
    {
      text: "One breath, one step, one moment at a time.",
      category: "Simplicity",
      affirmation: "I can handle whatever comes my way."
    },
    {
      text: "I am stronger than any challenge before me.",
      category: "Strength",
      affirmation: "I break big problems into small, manageable pieces."
    }
  ],
  confident: [
    {
      text: "I trust in my abilities and inner wisdom.",
      category: "Trust",
      affirmation: "I am capable of achieving my goals."
    },
    {
      text: "My confidence grows with every step I take.",
      category: "Growth",
      affirmation: "I believe in myself completely."
    }
  ]
};

export const createMantra = (userMood: MoodType | string): Mantra => {
  const mood = userMood as MoodType;
  const mantras = mantraLibrary[mood];
  
  if (!mantras || mantras.length === 0) {
    return {
      text: "I am becoming more myself each day.",
      category: "Self-Discovery",
      affirmation: "I embrace my unique journey with love."
    };
  }
  
  // Return a random mantra from the mood category
  const randomIndex = Math.floor(Math.random() * mantras.length);
  return mantras[randomIndex];
};

export const getMantraByCategory = (category: string): Mantra[] => {
  const allMantras = Object.values(mantraLibrary).flat();
  return allMantras.filter(mantra => 
    mantra.category.toLowerCase().includes(category.toLowerCase())
  );
};

export const createCustomMantra = (
  intention: string, 
  emotionalState: string
): Mantra => {
  const templates = [
    `I am ${intention} and ${emotionalState}.`,
    `${intention} flows through me with ${emotionalState}.`,
    `I embrace ${intention} while feeling ${emotionalState}.`,
    `My ${intention} grows stronger as I honor my ${emotionalState}.`
  ];
  
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  
  return {
    text: randomTemplate,
    category: "Custom",
    affirmation: `I honor my intention to ${intention}.`
  };
};

export const getDailyMantra = (dayOfWeek: number): Mantra => {
  const weeklyMantras = [
    { text: "Sunday: I rest and restore my spirit.", category: "Rest", affirmation: "Rest prepares me for the week ahead." },
    { text: "Monday: I begin with intention and grace.", category: "Beginnings", affirmation: "New weeks bring new possibilities." },
    { text: "Tuesday: I move forward with steady purpose.", category: "Progress", affirmation: "I maintain my momentum with ease." },
    { text: "Wednesday: I find balance in the middle of my journey.", category: "Balance", affirmation: "I am centered and focused." },
    { text: "Thursday: I appreciate how far I've come.", category: "Gratitude", affirmation: "My progress deserves recognition." },
    { text: "Friday: I celebrate my accomplishments.", category: "Celebration", affirmation: "I acknowledge my hard work." },
    { text: "Saturday: I embrace joy and freedom.", category: "Joy", affirmation: "I deserve happiness and play." }
  ];
  
  return weeklyMantras[dayOfWeek] || weeklyMantras[0];
};