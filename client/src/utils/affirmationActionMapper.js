import { apiRequest } from '../lib/queryClient';

export async function getActionFromAffirmation(affirmation) {
  try {
    const response = await apiRequest('POST', '/api/affirmation-to-action', {
      affirmation: affirmation
    });

    const data = await response.json();
    return data.action || generateFallbackAction(affirmation);
  } catch (error) {
    console.error('Error getting action from affirmation:', error);
    return generateFallbackAction(affirmation);
  }
}

function generateFallbackAction(affirmation) {
  // Map common affirmation themes to practical actions
  const actionMappings = {
    'grounded': [
      "Take 5 minutes to walk barefoot on grass or earth",
      "Spend 10 minutes organizing a small space around you",
      "Practice deep breathing while feeling your feet on the ground"
    ],
    'focused': [
      "Choose one important task and work on it for 25 minutes uninterrupted",
      "Write down your top 3 priorities for today",
      "Clear your workspace and remove all distractions"
    ],
    'confident': [
      "Stand in a power pose for 2 minutes before your next meeting",
      "Speak up with one idea or opinion you've been holding back",
      "Compliment yourself out loud for something you did well recently"
    ],
    'peaceful': [
      "Find a quiet spot and listen to ambient sounds for 10 minutes",
      "Practice gentle stretching or yoga poses",
      "Write down three things that brought you peace this week"
    ],
    'creative': [
      "Spend 15 minutes sketching, writing, or creating something without judgment",
      "Look at your surroundings with fresh eyes and notice something beautiful",
      "Try a new approach to solve an old problem"
    ],
    'grateful': [
      "Write a thank-you note (mental or physical) to someone who helped you",
      "Take a photo of something that makes you smile",
      "Share one thing you're grateful for with someone close to you"
    ],
    'strong': [
      "Take on a physical challenge that pushes you slightly out of your comfort zone",
      "Say 'no' to something that doesn't align with your values",
      "Ask for help with something you've been struggling with alone"
    ],
    'love': [
      "Do a small act of kindness for someone without expecting anything back",
      "Practice loving-kindness meditation for 5 minutes",
      "Forgive yourself for one mistake you've been holding onto"
    ],
    'abundance': [
      "Give away something you no longer need to someone who could use it",
      "Notice and appreciate the abundance already present in your life",
      "Plant seeds (literal or metaphorical) for future growth"
    ],
    'energy': [
      "Do 10 jumping jacks or dance to one song",
      "Take a short walk outside and breathe deeply",
      "Tidy up one area of your space to create fresh energy"
    ]
  };

  // Find the best matching theme
  const affirmationLower = affirmation.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  Object.keys(actionMappings).forEach(theme => {
    if (affirmationLower.includes(theme)) {
      const score = theme.length; // Longer matches are more specific
      if (score > bestScore) {
        bestMatch = theme;
        bestScore = score;
      }
    }
  });

  // If no direct match, check for related words
  if (!bestMatch) {
    const relatedMappings = {
      'calm': 'peaceful',
      'centered': 'grounded',
      'clear': 'focused',
      'powerful': 'strong',
      'worthy': 'confident',
      'blessed': 'grateful',
      'inspired': 'creative',
      'flowing': 'energy',
      'open': 'love',
      'rich': 'abundance'
    };

    Object.keys(relatedMappings).forEach(word => {
      if (affirmationLower.includes(word)) {
        bestMatch = relatedMappings[word];
      }
    });
  }

  // Return a random action from the matched theme, or a general one
  if (bestMatch && actionMappings[bestMatch]) {
    const actions = actionMappings[bestMatch];
    const selectedAction = actions[Math.floor(Math.random() * actions.length)];
    return `Today's soul-task: ${selectedAction}`;
  }

  // Fallback general actions
  const generalActions = [
    "Take three deep breaths and set an intention for your day",
    "Do one small thing that your future self will thank you for",
    "Connect with someone you care about, even just with a quick message",
    "Spend 5 minutes in nature or looking out a window",
    "Write down one thing you learned about yourself recently"
  ];

  const selectedGeneral = generalActions[Math.floor(Math.random() * generalActions.length)];
  return `Today's soul-task: ${selectedGeneral}`;
}

export async function generateDailyAffirmationAction() {
  try {
    // Get user's recent affirmations or generate a new one
    const response = await apiRequest('GET', '/api/daily-affirmation');
    const data = await response.json();
    
    const affirmation = data.affirmation || generateRandomAffirmation();
    const action = await getActionFromAffirmation(affirmation);

    return {
      affirmation,
      action,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating daily affirmation action:', error);
    
    // Fallback
    const affirmation = generateRandomAffirmation();
    const action = generateFallbackAction(affirmation);
    
    return {
      affirmation,
      action,
      timestamp: new Date().toISOString(),
      source: 'fallback'
    };
  }
}

function generateRandomAffirmation() {
  const affirmations = [
    "I am grounded and focused",
    "I trust my inner wisdom",
    "I am worthy of love and respect",
    "I embrace growth and change",
    "I am grateful for this moment",
    "I radiate positive energy",
    "I am creative and resourceful",
    "I choose peace over worry",
    "I am strong and resilient",
    "I attract abundance in all forms",
    "I am present and mindful",
    "I honor my authentic self",
    "I release what no longer serves me",
    "I am open to new possibilities",
    "I create my own happiness"
  ];

  return affirmations[Math.floor(Math.random() * affirmations.length)];
}

export async function trackActionCompletion(action, completed = true) {
  try {
    await apiRequest('POST', '/api/action-completion', {
      action: action,
      completed: completed,
      completed_at: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error tracking action completion:', error);
    return { success: false, error: error.message };
  }
}

export async function getWeeklyActionProgress() {
  try {
    const response = await apiRequest('GET', '/api/weekly-action-progress');
    const data = await response.json();

    return {
      completed_this_week: data.completed_count || 0,
      total_actions: data.total_count || 0,
      completion_rate: data.completion_rate || 0,
      streak_days: data.streak_days || 0,
      favorite_action_type: data.favorite_type || 'mindfulness'
    };
  } catch (error) {
    console.error('Error getting weekly action progress:', error);
    return {
      completed_this_week: 0,
      total_actions: 0,
      completion_rate: 0,
      streak_days: 0,
      favorite_action_type: 'mindfulness'
    };
  }
}

export async function generatePersonalizedAction(userProfile, recentJournalEntries) {
  try {
    const response = await apiRequest('POST', '/api/personalized-action', {
      profile: userProfile,
      recent_entries: recentJournalEntries
    });

    const data = await response.json();
    return data.action;
  } catch (error) {
    console.error('Error generating personalized action:', error);
    
    // Analyze recent entries for themes
    if (recentJournalEntries && recentJournalEntries.length > 0) {
      const combinedText = recentJournalEntries.map(entry => entry.content).join(' ');
      return generateFallbackAction(combinedText);
    }

    return generateFallbackAction("I am ready for growth and positive change");
  }
}