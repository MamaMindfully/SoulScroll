// Inner Compass Engine for daily emotional themes and archetypes
interface CompassTheme {
  keyword: string;
  archetype: string;
  description: string;
  affirmation: string;
  color: string;
  guidance: string[];
}

const COMPASS_THEMES: CompassTheme[] = [
  {
    keyword: "Clarity",
    archetype: "The Seer",
    description: "Today you see through the fog of confusion to the truth beneath",
    affirmation: "I trust my inner vision and see clearly",
    color: "#3B82F6", // blue
    guidance: [
      "Take time for quiet reflection",
      "Trust your first instincts",
      "Ask clarifying questions",
      "Write down your insights"
    ]
  },
  {
    keyword: "Curiosity",
    archetype: "The Explorer",
    description: "Your soul yearns to discover new territories within and without",
    affirmation: "I approach life with wonder and openness",
    color: "#10B981", // emerald
    guidance: [
      "Try something new today",
      "Ask 'what if?' more often",
      "Listen to different perspectives",
      "Follow your fascination"
    ]
  },
  {
    keyword: "Gentleness",
    archetype: "The Healer",
    description: "Soft strength flows through you, offering healing to yourself and others",
    affirmation: "I am gentle with myself and others",
    color: "#F59E0B", // amber
    guidance: [
      "Speak kindly to yourself",
      "Offer compassion to someone struggling",
      "Move slowly and mindfully",
      "Practice forgiveness"
    ]
  },
  {
    keyword: "Courage",
    archetype: "The Warrior",
    description: "You have the strength to face what challenges you",
    affirmation: "I am brave enough to be authentic",
    color: "#EF4444", // red
    guidance: [
      "Take one brave action today",
      "Speak your truth with kindness",
      "Face a fear you've been avoiding",
      "Stand up for what matters to you"
    ]
  },
  {
    keyword: "Creativity",
    archetype: "The Artist",
    description: "Divine inspiration flows through you, seeking expression",
    affirmation: "I am a channel for creative energy",
    color: "#8B5CF6", // violet
    guidance: [
      "Create something with your hands",
      "Express yourself freely",
      "Look for beauty everywhere",
      "Share your unique gifts"
    ]
  },
  {
    keyword: "Wisdom",
    archetype: "The Sage",
    description: "Ancient knowing resides within you, ready to guide your steps",
    affirmation: "I trust the wisdom that lives within me",
    color: "#6366F1", // indigo
    guidance: [
      "Listen to your inner voice",
      "Share your knowledge with others",
      "Reflect on past lessons",
      "Seek understanding over being right"
    ]
  },
  {
    keyword: "Joy",
    archetype: "The Child",
    description: "Pure delight bubbles up from your authentic self",
    affirmation: "I allow myself to experience pure joy",
    color: "#F97316", // orange
    guidance: [
      "Play without purpose",
      "Laugh freely",
      "Celebrate small victories",
      "Find wonder in ordinary moments"
    ]
  },
  {
    keyword: "Flow",
    archetype: "The Dancer",
    description: "You move in harmony with life's rhythm, adapting gracefully",
    affirmation: "I flow with life's changes like water",
    color: "#06B6D4", // cyan
    guidance: [
      "Go with the flow today",
      "Practice flexibility",
      "Trust the process",
      "Move your body mindfully"
    ]
  },
  {
    keyword: "Gratitude",
    archetype: "The Appreciator",
    description: "Your heart overflows with recognition of life's gifts",
    affirmation: "I see blessings everywhere I look",
    color: "#059669", // emerald-600
    guidance: [
      "Count three blessings",
      "Thank someone who helped you",
      "Appreciate what you have",
      "Find grace in challenges"
    ]
  },
  {
    keyword: "Transformation",
    archetype: "The Phoenix",
    description: "You are in a powerful cycle of death and rebirth",
    affirmation: "I embrace change as my path to growth",
    color: "#DC2626", // red-600
    guidance: [
      "Release what no longer serves",
      "Welcome new beginnings",
      "Trust the transformation process",
      "Honor your growth"
    ]
  }
];

export class InnerCompassEngine {
  private static STORAGE_KEY = 'soulscroll-inner-compass';
  
  static getTodaysTheme(): CompassTheme {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(this.STORAGE_KEY);
    
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        return data.theme;
      }
    }
    
    // Generate new theme for today using date as seed for consistency
    const dateSum = today.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const themeIndex = dateSum % COMPASS_THEMES.length;
    const todaysTheme = COMPASS_THEMES[themeIndex];
    
    // Store for today
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      date: today,
      theme: todaysTheme
    }));
    
    return todaysTheme;
  }
  
  static async generateAITheme(): Promise<CompassTheme> {
    try {
      // This would call OpenAI to generate a personalized theme
      // For now, return a random theme with some personalization
      const baseTheme = COMPASS_THEMES[Math.floor(Math.random() * COMPASS_THEMES.length)];
      
      return {
        ...baseTheme,
        description: `Today, your soul calls you toward ${baseTheme.keyword.toLowerCase()}. ${baseTheme.description}`,
        guidance: [
          ...baseTheme.guidance,
          "Listen deeply to what your heart needs today"
        ]
      };
    } catch (error) {
      console.error('Error generating AI theme:', error);
      return this.getTodaysTheme();
    }
  }
  
  static getThemeByMood(mood: string): CompassTheme {
    const moodThemeMap: { [key: string]: string } = {
      'happy': 'Joy',
      'sad': 'Gentleness',
      'anxious': 'Clarity',
      'angry': 'Transformation',
      'grateful': 'Gratitude',
      'confused': 'Wisdom',
      'excited': 'Creativity',
      'peaceful': 'Flow',
      'lonely': 'Courage',
      'hopeful': 'Curiosity'
    };
    
    const themeKeyword = moodThemeMap[mood.toLowerCase()];
    const theme = COMPASS_THEMES.find(t => t.keyword === themeKeyword);
    
    return theme || this.getTodaysTheme();
  }
  
  static markThemeReflected(): void {
    const today = new Date().toDateString();
    const reflectedKey = `${this.STORAGE_KEY}-reflected`;
    const stored = localStorage.getItem(reflectedKey);
    
    let reflected: string[] = [];
    if (stored) {
      reflected = JSON.parse(stored);
    }
    
    if (!reflected.includes(today)) {
      reflected.push(today);
      localStorage.setItem(reflectedKey, JSON.stringify(reflected));
    }
  }
  
  static hasReflectedToday(): boolean {
    const today = new Date().toDateString();
    const reflectedKey = `${this.STORAGE_KEY}-reflected`;
    const stored = localStorage.getItem(reflectedKey);
    
    if (!stored) return false;
    
    const reflected = JSON.parse(stored);
    return reflected.includes(today);
  }
}

export default InnerCompassEngine;