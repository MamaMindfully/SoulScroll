// Daily Ritual Engine for SoulScroll
// Provides personalized morning and evening prompts for reflection

export const getRitual = (type = 'morning', options = {}) => {
  const { 
    category = 'general',
    mood = 'neutral',
    season = getCurrentSeason(),
    userPreferences = {}
  } = options;

  const rituals = {
    morning: {
      general: [
        "🌞 Breathe deeply. What's one thing you're grateful for right now?",
        "📝 Set today's intention in a single sentence.",
        "💧 Drink a glass of water and write one thing your body needs today.",
        "🌱 What will you nurture in yourself today?",
        "🎯 Visualize one success you want to feel tonight.",
        "☀️ What energy do you want to cultivate as you step into this day?",
        "💫 If today could gift you one beautiful moment, what would it be?",
        "🌿 How can you honor your authentic self today?",
        "✨ What small act of kindness can you offer yourself this morning?",
        "🎨 What creative spark wants to emerge in you today?"
      ],
      
      wellness: [
        "🧘 Take three conscious breaths. How does your body feel right now?",
        "💪 What movement would bring your body joy today?",
        "🥗 What nourishing choice can you make for yourself today?",
        "💤 How did you sleep? What does your rest tell you about your needs?",
        "🌈 What emotions are present as you begin this day?",
        "🚿 As you prepare for the day, what intention flows through you?",
        "🌱 What self-care practice is calling to you today?"
      ],
      
      growth: [
        "📚 What would you love to learn about yourself today?",
        "🌟 What strength within you is ready to shine today?",
        "🔮 If your future self sent you guidance, what would they say?",
        "🦋 What transformation is quietly happening in your life?",
        "🎯 What challenge could become your greatest teacher today?",
        "💎 What hidden potential wants to emerge in you today?"
      ],
      
      spiritual: [
        "🙏 What are you most grateful for in this moment?",
        "🌌 How do you feel connected to something greater today?",
        "💫 What divine guidance is available to you this morning?",
        "🕊️ What would love have you focus on today?",
        "🌸 How can you be a blessing to yourself and others today?",
        "⭐ What sacred purpose flows through your day?"
      ]
    },

    evening: {
      general: [
        "🌙 Reflect: What moment are you most proud of today?",
        "🧘 What helped you feel calm or grounded today?",
        "💭 Did you honor your intention? Why or why not?",
        "🌌 What are you ready to let go of tonight?",
        "📿 One lesson from today you want to carry into tomorrow?",
        "⭐ What unexpected gift did today offer you?",
        "🌊 How did you grow or stretch beyond your comfort zone today?",
        "💝 What act of kindness touched your heart today?",
        "🔥 What passion or joy lit you up today?",
        "🌹 How did you show love to yourself or others today?"
      ],
      
      wellness: [
        "💤 How is your body feeling as you prepare for rest?",
        "🌸 What self-care did you practice today?",
        "🍃 What brought you peace or relaxation today?",
        "💧 How well did you nourish yourself today?",
        "🌛 What emotions are you ready to release before sleep?",
        "🛁 What ritual would help you transition into restful sleep?",
        "❤️ How can you send love to your body for carrying you through today?"
      ],
      
      growth: [
        "📖 What did today teach you about yourself?",
        "🌟 How did you surprise yourself today?",
        "💪 What challenge did you face with courage today?",
        "🎨 What creativity or inspiration flowed through you?",
        "🔑 What insight wants to guide you into tomorrow?",
        "🌱 How did you plant seeds for your future self today?"
      ],
      
      spiritual: [
        "🙏 What are you most grateful for from today?",
        "✨ How did you feel divinely supported today?",
        "🕯️ What sacred moments did you experience?",
        "💫 How did your soul express itself today?",
        "🌙 What wisdom is the darkness offering you tonight?",
        "🌌 How are you connected to the larger tapestry of life?"
      ]
    }
  };

  // Get base rituals for the time of day
  const timeRituals = rituals[type] || rituals.morning;
  const categoryRituals = timeRituals[category] || timeRituals.general;

  // Filter by mood if specified
  let availableRituals = [...categoryRituals];
  
  if (mood === 'energetic') {
    availableRituals = availableRituals.filter(ritual => 
      ritual.includes('🎯') || ritual.includes('💪') || ritual.includes('🌟') || ritual.includes('🔥')
    );
  } else if (mood === 'contemplative') {
    availableRituals = availableRituals.filter(ritual => 
      ritual.includes('🧘') || ritual.includes('💭') || ritual.includes('🌙') || ritual.includes('📿')
    );
  } else if (mood === 'grateful') {
    availableRituals = availableRituals.filter(ritual => 
      ritual.includes('🙏') || ritual.includes('💝') || ritual.includes('🌞')
    );
  }

  // Fallback to full list if filtered list is empty
  if (availableRituals.length === 0) {
    availableRituals = categoryRituals;
  }

  // Select random ritual
  const randomIndex = Math.floor(Math.random() * availableRituals.length);
  return availableRituals[randomIndex];
};

// Get season-appropriate rituals
export const getSeasonalRitual = (type = 'morning') => {
  const season = getCurrentSeason();
  const seasonalPrompts = {
    spring: {
      morning: "🌱 What new growth is emerging in your life this spring morning?",
      evening: "🌸 What blossomed in you today as nature awakens around you?"
    },
    summer: {
      morning: "☀️ How can you embrace the abundant energy of summer in your day?",
      evening: "🌻 What warmth and joy did you cultivate in your summer day?"
    },
    autumn: {
      morning: "🍂 What are you ready to release to make space for new growth?",
      evening: "🌰 What wisdom did you harvest from your autumn day?"
    },
    winter: {
      morning: "❄️ How can you find warmth and light within yourself this winter morning?",
      evening: "🔥 What inner fire sustained you through this winter day?"
    }
  };

  return seasonalPrompts[season]?.[type] || getRitual(type);
};

// Get time-aware ritual
export const getTimeAwareRitual = () => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return getRitual('morning');
  } else if (hour >= 18 && hour <= 23) {
    return getRitual('evening');
  } else {
    // Midday reflection
    const middayPrompts = [
      "🌞 How are you honoring your energy in this moment?",
      "⏰ What intention wants to guide the rest of your day?",
      "💫 How can you realign with your authentic self right now?",
      "🌿 What does your soul need in this present moment?"
    ];
    const randomIndex = Math.floor(Math.random() * middayPrompts.length);
    return middayPrompts[randomIndex];
  }
};

// Get personalized ritual based on user data
export const getPersonalizedRitual = (userProfile = {}) => {
  const { 
    mood = 'neutral',
    preferences = {},
    recentEntries = [],
    currentStreak = 0
  } = userProfile;

  // Adapt based on streak
  if (currentStreak >= 30) {
    return "🏆 You've maintained incredible consistency. What deeper wisdom is your practice revealing?";
  } else if (currentStreak >= 7) {
    return "🔥 Your commitment is inspiring. How has this journey changed you?";
  } else if (currentStreak === 0) {
    return "🌱 Every journey begins with a single step. What calls to your heart today?";
  }

  // Adapt based on recent themes
  if (recentEntries.length > 0) {
    const themes = extractThemesFromEntries(recentEntries);
    if (themes.includes('stress')) {
      return getRitual('morning', { category: 'wellness', mood: 'contemplative' });
    } else if (themes.includes('growth')) {
      return getRitual('morning', { category: 'growth' });
    } else if (themes.includes('gratitude')) {
      return getRitual('morning', { category: 'spiritual', mood: 'grateful' });
    }
  }

  return getTimeAwareRitual();
};

// Helper functions
function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function extractThemesFromEntries(entries) {
  const themes = [];
  const recentContent = entries.slice(0, 3).map(entry => entry.content || '').join(' ').toLowerCase();
  
  if (recentContent.includes('stress') || recentContent.includes('overwhelm') || recentContent.includes('anxious')) {
    themes.push('stress');
  }
  if (recentContent.includes('learn') || recentContent.includes('grow') || recentContent.includes('challenge')) {
    themes.push('growth');
  }
  if (recentContent.includes('grateful') || recentContent.includes('thank') || recentContent.includes('bless')) {
    themes.push('gratitude');
  }
  
  return themes;
}

// Get ritual with tracking
export const getRitualWithTracking = (type = 'morning') => {
  const ritual = getRitual(type);
  
  // Track ritual usage
  try {
    const today = new Date().toDateString();
    const ritualHistory = JSON.parse(localStorage.getItem('soulscroll-ritual-history') || '{}');
    
    if (!ritualHistory[today]) {
      ritualHistory[today] = [];
    }
    
    ritualHistory[today].push({
      type,
      ritual,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    Object.keys(ritualHistory).forEach(date => {
      if (new Date(date) < thirtyDaysAgo) {
        delete ritualHistory[date];
      }
    });
    
    localStorage.setItem('soulscroll-ritual-history', JSON.stringify(ritualHistory));
  } catch (error) {
    console.error('Error tracking ritual:', error);
  }
  
  return ritual;
};

// Get ritual statistics
export const getRitualStats = () => {
  try {
    const ritualHistory = JSON.parse(localStorage.getItem('soulscroll-ritual-history') || '{}');
    const days = Object.keys(ritualHistory);
    
    return {
      totalDays: days.length,
      morningRituals: days.reduce((count, day) => 
        count + ritualHistory[day].filter(r => r.type === 'morning').length, 0
      ),
      eveningRituals: days.reduce((count, day) => 
        count + ritualHistory[day].filter(r => r.type === 'evening').length, 0
      ),
      currentStreak: calculateRitualStreak(ritualHistory),
      recentRituals: getRecentRituals(ritualHistory, 5)
    };
  } catch (error) {
    console.error('Error getting ritual stats:', error);
    return {
      totalDays: 0,
      morningRituals: 0,
      eveningRituals: 0,
      currentStreak: 0,
      recentRituals: []
    };
  }
};

function calculateRitualStreak(ritualHistory) {
  const dates = Object.keys(ritualHistory).sort().reverse();
  let streak = 0;
  const today = new Date().toDateString();
  
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const dayDate = new Date(date);
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - i);
    
    if (date === expectedDate.toDateString()) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

function getRecentRituals(ritualHistory, limit) {
  const allRituals = [];
  
  Object.keys(ritualHistory).forEach(date => {
    ritualHistory[date].forEach(ritual => {
      allRituals.push({ ...ritual, date });
    });
  });
  
  return allRituals
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}