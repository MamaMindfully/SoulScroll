// Deeper Prompt Engine for Progressive AI Reflection
// Provides increasingly profound questions and insights

export async function getDeeperPrompt(userEntry, originalPrompt, level = 0, previousInsights = []) {
  try {
    const response = await fetch('/api/deeper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        entry: userEntry, 
        basePrompt: originalPrompt,
        level: level,
        previousInsights: previousInsights
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.deeperReflection || "Your thoughts hold deeper wisdom. What else wants to emerge?";
  } catch (error) {
    console.error('Error getting deeper prompt:', error);
    
    // Fallback deeper prompts based on level
    const fallbackPrompts = [
      "What emotions are you not fully expressing about this?",
      "If this situation had a deeper message for you, what would it be?",
      "What part of yourself is asking for attention through this experience?",
      "How does this connect to your deeper values and life purpose?",
      "What would your wisest self say about this situation?"
    ];
    
    return fallbackPrompts[level] || "Trust what your heart is telling you in this moment.";
  }
}

// Get progressive questions based on depth level
export function getQuestionsByLevel(level) {
  const questionSets = {
    0: [
      "What emotions are you not fully expressing?",
      "What's the story beneath the story?",
      "What would you tell your closest friend about this?"
    ],
    1: [
      "What part of yourself needs healing here?",
      "What pattern keeps showing up in your life?",
      "What are you learning about yourself through this?"
    ],
    2: [
      "What would love do in this situation?",
      "How is this serving your highest growth?",
      "What wants to be released or transformed?"
    ],
    3: [
      "What is your soul trying to remember?",
      "How does this connect to your life's deeper purpose?",
      "What ancient wisdom lives within this experience?"
    ],
    4: [
      "What truth are you ready to fully embrace?",
      "How is this experience a gift in disguise?",
      "What would unconditional self-love look like here?"
    ]
  };
  
  return questionSets[level] || questionSets[4];
}

// Analyze entry for themes to guide deeper exploration
export function extractThemes(entry) {
  const themes = {
    relationships: ['love', 'family', 'friend', 'partner', 'relationship', 'connection'],
    growth: ['learn', 'grow', 'change', 'develop', 'improve', 'better'],
    challenges: ['difficult', 'hard', 'struggle', 'problem', 'challenge', 'tough'],
    emotions: ['feel', 'emotion', 'happy', 'sad', 'angry', 'fear', 'joy', 'love'],
    purpose: ['purpose', 'meaning', 'why', 'direction', 'path', 'calling'],
    healing: ['heal', 'pain', 'hurt', 'recover', 'forgive', 'release']
  };
  
  const entryLower = entry.toLowerCase();
  const foundThemes = [];
  
  for (const [theme, keywords] of Object.entries(themes)) {
    if (keywords.some(keyword => entryLower.includes(keyword))) {
      foundThemes.push(theme);
    }
  }
  
  return foundThemes;
}

// Generate theme-specific deeper questions
export function getThemeBasedQuestions(themes, level) {
  const themeQuestions = {
    relationships: {
      0: "What do your relationships reveal about how you see yourself?",
      1: "What patterns of connection or disconnection do you notice?",
      2: "How can you love more freely in your relationships?",
      3: "What is your soul learning through your connections with others?",
      4: "How are your relationships mirrors of your inner world?"
    },
    growth: {
      0: "What growth edge are you avoiding?",
      1: "What old version of yourself is ready to be released?",
      2: "How is resistance serving or limiting your expansion?",
      3: "What is your highest potential trying to emerge?",
      4: "How can you trust the process of your becoming?"
    },
    challenges: {
      0: "What strength is this challenge calling forth from you?",
      1: "How might this difficulty be redirecting you toward something better?",
      2: "What would it look like to embrace this challenge as a teacher?",
      3: "What gift is hidden within this apparent obstacle?",
      4: "How is this challenge an invitation to embody your highest self?"
    },
    emotions: {
      0: "What emotion are you avoiding or trying to fix?",
      1: "What is this feeling trying to tell you about your needs?",
      2: "How can you honor all parts of your emotional experience?",
      3: "What wisdom lives within even your most difficult emotions?",
      4: "How can you hold all of your feelings with compassion?"
    },
    purpose: {
      0: "What activities make you lose track of time?",
      1: "What legacy do you want to leave through your life?",
      2: "How does this moment connect to your larger purpose?",
      3: "What is your soul's unique contribution to the world?",
      4: "How can you align more fully with your deepest calling?"
    },
    healing: {
      0: "What part of you most needs tender care right now?",
      1: "What story about this pain are you ready to rewrite?",
      2: "How can you be both wounded and whole simultaneously?",
      3: "What medicine is your pain offering you and others?",
      4: "How is your healing a gift to the collective human experience?"
    }
  };
  
  // Return question based on most prominent theme
  const primaryTheme = themes[0] || 'growth';
  const questions = themeQuestions[primaryTheme];
  
  return questions ? questions[level] || questions[4] : null;
}

// Create context for the deeper prompt API call
export function buildDeeperContext(entry, originalPrompt, level, previousInsights) {
  const themes = extractThemes(entry);
  const themeQuestion = getThemeBasedQuestions(themes, level);
  const levelQuestions = getQuestionsByLevel(level);
  
  return {
    userEntry: entry,
    originalPrompt: originalPrompt,
    currentLevel: level,
    themes: themes,
    suggestedQuestion: themeQuestion,
    alternativeQuestions: levelQuestions,
    previousInsights: previousInsights,
    maxLevel: 5
  };
}