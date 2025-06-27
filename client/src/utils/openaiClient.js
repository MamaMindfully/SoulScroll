// OpenAI client utility - wrapper for API calls with error handling
import { apiRequest } from '../lib/queryClient';

export class OpenAIClient {
  constructor() {
    this.baseURL = '/api';
  }

  async testConnection() {
    try {
      const response = await apiRequest('GET', '/api/test-openai');
      const data = await response.json();
      return { success: true, ...data };
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return { success: false, error: error.message };
    }
  }

  async generateInsight(text, userId, persona = 'sage') {
    try {
      const response = await apiRequest('POST', '/api/generate-insight-with-persona', {
        entry_text: text,
        user_id: userId,
        persona_key: persona,
        system_prompt: `You are a ${persona} AI mentor providing thoughtful insights.`,
        context: 'journal reflection'
      });
      
      const data = await response.json();
      return { success: true, insight: data.insight };
    } catch (error) {
      console.error('Insight generation failed:', error);
      return { 
        success: false, 
        insight: 'Your thoughts reflect a journey of growth and self-discovery.',
        error: error.message 
      };
    }
  }

  async scoreEmotion(text, entryId) {
    try {
      const response = await apiRequest('POST', '/api/score-emotion', {
        entry_text: text,
        entry_id: entryId
      });
      
      const data = await response.json();
      return { success: true, score: data.emotion_score };
    } catch (error) {
      console.error('Emotion scoring failed:', error);
      return { success: false, score: 5, error: error.message };
    }
  }

  async generateSecretScroll(milestone, userId) {
    try {
      const response = await apiRequest('POST', '/api/generate-secret-scroll', {
        milestone,
        userId
      });
      
      const data = await response.json();
      return { success: true, scroll: data.scroll };
    } catch (error) {
      console.error('Secret scroll generation failed:', error);
      return { 
        success: false, 
        scroll: `Milestone ${milestone} reached! Your journey continues to unfold with wisdom and grace.`,
        error: error.message 
      };
    }
  }

  async generateDeepInsight(text, depth, persona = 'sage') {
    try {
      const response = await apiRequest('POST', '/api/generate-deep-insight', {
        prompt: `As a ${persona}, provide depth level ${depth} insight`,
        persona_key: persona,
        depth_level: depth,
        entry_text: text
      });
      
      const data = await response.json();
      return { success: true, insight: data.insight };
    } catch (error) {
      console.error('Deep insight generation failed:', error);
      return { 
        success: false, 
        insight: 'There are deeper layers to explore in your experience.',
        error: error.message 
      };
    }
  }

  async generateWeeklyTheme(weekId) {
    try {
      const response = await apiRequest('POST', '/api/generate-weekly-theme', {
        weekId
      });
      
      const data = await response.json();
      return { success: true, theme: data.theme };
    } catch (error) {
      console.error('Weekly theme generation failed:', error);
      return { 
        success: false, 
        theme: {
          title: 'Inner Wisdom',
          description: 'Trust the guidance that comes from within',
          color: 'purple',
          affirmation: 'I trust my inner wisdom to guide me'
        },
        error: error.message 
      };
    }
  }

  async convertAffirmationToAction(affirmation) {
    try {
      const response = await apiRequest('POST', '/api/affirmation-to-action', {
        affirmation
      });
      
      const data = await response.json();
      return { success: true, action: data.action };
    } catch (error) {
      console.error('Affirmation to action conversion failed:', error);
      return { 
        success: false, 
        action: "Today's soul-task: Take one mindful breath and set a positive intention.",
        error: error.message 
      };
    }
  }
}

// Export singleton instance
export const openaiClient = new OpenAIClient();

// Helper functions for backward compatibility
export const generateInsight = (text, userId, persona) => 
  openaiClient.generateInsight(text, userId, persona);

export const scoreEmotion = (text, entryId) => 
  openaiClient.scoreEmotion(text, entryId);

export const generateSecretScroll = (milestone, userId) => 
  openaiClient.generateSecretScroll(milestone, userId);

export const testOpenAIConnection = () => 
  openaiClient.testConnection();