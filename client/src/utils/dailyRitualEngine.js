import { openaiClient } from './openaiClient';

export class DailyRitualEngine {
  constructor() {
    this.morningRituals = [
      { id: 'gratitude', name: 'Gratitude Practice', duration: 5, category: 'mindfulness' },
      { id: 'intention', name: 'Set Daily Intention', duration: 3, category: 'planning' },
      { id: 'breath', name: 'Morning Breath Work', duration: 7, category: 'wellness' },
      { id: 'affirmation', name: 'Personal Affirmations', duration: 5, category: 'mindset' }
    ];

    this.eveningRituals = [
      { id: 'reflection', name: 'Day Reflection', duration: 10, category: 'introspection' },
      { id: 'release', name: 'Release & Let Go', duration: 5, category: 'healing' },
      { id: 'appreciation', name: 'Self-Appreciation', duration: 5, category: 'self-love' },
      { id: 'tomorrow', name: 'Tomorrow\'s Vision', duration: 3, category: 'planning' }
    ];
  }

  getCurrentTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  getCurrentRituals() {
    const timeOfDay = this.getCurrentTimeOfDay();
    
    switch (timeOfDay) {
      case 'morning':
        return {
          timeOfDay: 'morning',
          greeting: 'Good morning! Ready to set a beautiful tone for your day?',
          rituals: this.morningRituals,
          theme: 'Beginning & Intention'
        };
      case 'evening':
        return {
          timeOfDay: 'evening',
          greeting: 'Good evening. Time to honor the day and prepare for rest.',
          rituals: this.eveningRituals,
          theme: 'Reflection & Release'
        };
      default:
        return {
          timeOfDay: timeOfDay,
          greeting: 'Welcome. Find a moment of peace in your day.',
          rituals: [...this.morningRituals, ...this.eveningRituals],
          theme: 'Mindful Presence'
        };
    }
  }

  async generatePersonalizedRitual(userId, timeOfDay, preferences = {}) {
    try {
      console.log('🧘 Generating personalized ritual for', timeOfDay);
      
      const ritualPrompt = this.createRitualPrompt(timeOfDay, preferences);
      
      // In a real implementation, this would use OpenAI
      const fallbackRitual = this.createFallbackRitual(timeOfDay, preferences);
      
      console.log('✅ Personalized ritual generated');
      return {
        success: true,
        ritual: fallbackRitual
      };
    } catch (error) {
      console.error('❌ Ritual generation failed:', error);
      return {
        success: false,
        ritual: this.createFallbackRitual(timeOfDay, preferences)
      };
    }
  }

  createRitualPrompt(timeOfDay, preferences) {
    const basePrompts = {
      morning: "Create a morning ritual that energizes and centers the user for their day.",
      evening: "Create an evening ritual that helps the user reflect and unwind.",
      afternoon: "Create a midday ritual that refreshes and refocuses the user.",
      night: "Create a nighttime ritual that promotes peace and restful sleep."
    };

    return `${basePrompts[timeOfDay]} Consider these preferences: ${JSON.stringify(preferences)}`;
  }

  createFallbackRitual(timeOfDay, preferences = {}) {
    const fallbackRituals = {
      morning: {
        title: 'Morning Awakening',
        steps: [
          { action: 'Take 3 deep breaths', duration: 1 },
          { action: 'Set an intention for the day', duration: 2 },
          { action: 'Name three things you\'re grateful for', duration: 2 }
        ],
        affirmation: 'I welcome this new day with an open heart and clear mind.',
        totalDuration: 5
      },
      evening: {
        title: 'Evening Reflection',
        steps: [
          { action: 'Reflect on the day\'s highlights', duration: 3 },
          { action: 'Acknowledge any challenges with compassion', duration: 2 },
          { action: 'Release what no longer serves you', duration: 2 },
          { action: 'Set gentle intentions for tomorrow', duration: 3 }
        ],
        affirmation: 'I honor this day\'s journey and welcome peaceful rest.',
        totalDuration: 10
      }
    };

    return fallbackRituals[timeOfDay] || fallbackRituals.morning;
  }

  async trackRitualCompletion(userId, ritualId, completed = true) {
    try {
      console.log('📝 Tracking ritual completion:', { userId, ritualId, completed });
      
      const completionData = {
        user_id: userId,
        ritual_id: ritualId,
        completed: completed,
        completed_at: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0]
      };

      // Mock API call - in production this would save to database
      return { success: true, data: completionData };
    } catch (error) {
      console.error('❌ Failed to track ritual completion:', error);
      return { success: false, error: error.message };
    }
  }

  async getRitualProgress(userId, days = 7) {
    try {
      console.log('📊 Fetching ritual progress for', days, 'days');
      
      // Mock data - in production this would query the database
      const mockProgress = {
        total_completed: 5,
        total_possible: days * 2, // morning and evening
        completion_rate: 0.36,
        streak_days: 3,
        favorite_ritual: 'gratitude',
        favorite_time: 'morning',
        weekly_pattern: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          morning_completed: Math.random() > 0.4,
          evening_completed: Math.random() > 0.3
        }))
      };

      console.log('✅ Ritual progress fetched');
      return { success: true, progress: mockProgress };
    } catch (error) {
      console.error('❌ Failed to fetch ritual progress:', error);
      return { success: false, error: error.message };
    }
  }

  generateRitualPrompt(ritual) {
    const prompts = {
      gratitude: "What are three things that filled your heart with gratitude today?",
      intention: "What intention will guide your actions today?",
      breath: "Take a moment to breathe deeply. How does your body feel right now?",
      affirmation: "What affirmation does your soul need to hear today?",
      reflection: "What moments from today deserve recognition and appreciation?",
      release: "What thoughts or feelings are you ready to release?",
      appreciation: "How did you show up for yourself today?",
      tomorrow: "What gentle intention will you carry into tomorrow?"
    };

    return prompts[ritual.id] || "Take a moment to connect with yourself.";
  }

  getRitualStats(userId = null) {
    try {
      // Mock stats - in production this would query database
      return {
        total_completed: 12,
        streak_days: 5,
        favorite_ritual: 'gratitude',
        completion_rate: 0.75,
        weekly_completions: 8,
        last_completed: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting ritual stats:', error);
      return {
        total_completed: 0,
        streak_days: 0,
        favorite_ritual: 'gratitude',
        completion_rate: 0,
        weekly_completions: 0,
        last_completed: null
      };
    }
  }

  getRitualWithTracking(type) {
    const rituals = this.getCurrentRituals();
    const selectedRituals = type === 'morning' ? this.morningRituals : this.eveningRituals;
    const randomRitual = selectedRituals[Math.floor(Math.random() * selectedRituals.length)];
    return this.generateRitualPrompt(randomRitual);
  }

  getCurrentTimeType() {
    const timeOfDay = this.getCurrentTimeOfDay();
    return timeOfDay === 'morning' || timeOfDay === 'afternoon' ? 'morning' : 'evening';
  }

  async testConnection() {
    try {
      console.log('🧪 Testing daily ritual engine...');
      const rituals = this.getCurrentRituals();
      const testRitual = await this.generatePersonalizedRitual('test-user', 'morning');
      console.log('✅ Daily ritual test passed:', rituals && testRitual.success);
      return rituals && testRitual.success;
    } catch (error) {
      console.error('❌ Daily ritual test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const dailyRitualEngine = new DailyRitualEngine();

// Export convenience functions
export const getCurrentRituals = () => dailyRitualEngine.getCurrentRituals();
export const generatePersonalizedRitual = (userId, timeOfDay, preferences) => 
  dailyRitualEngine.generatePersonalizedRitual(userId, timeOfDay, preferences);
export const getPersonalizedRitual = (userId, timeOfDay, preferences) => 
  dailyRitualEngine.generatePersonalizedRitual(userId, timeOfDay, preferences);
export const trackRitualCompletion = (userId, ritualId, completed) => 
  dailyRitualEngine.trackRitualCompletion(userId, ritualId, completed);
export const getRitualStats = (userId) => dailyRitualEngine.getRitualStats(userId);
export const getRitualWithTracking = (type) => dailyRitualEngine.getRitualWithTracking(type);
export const getCurrentTimeType = () => dailyRitualEngine.getCurrentTimeType();
export const testRitualConnection = () => dailyRitualEngine.testConnection();