import { openaiClient } from './openaiClient';
import { getPersonaByKey } from '../constants/mentorPersonas';

export class InsightTreeEngine {
  constructor() {
    this.maxDepth = 5;
    this.depthLabels = {
      1: 'Surface',
      2: 'Deeper', 
      3: 'Core',
      4: 'Soul',
      5: 'Transcendent'
    };
  }

  async generateDeepInsight(entryText, currentDepth, userId, persona = 'sage') {
    try {
      console.log(`🌳 Generating depth ${currentDepth} insight with ${persona} persona`);
      
      const personaData = getPersonaByKey(persona);
      const result = await openaiClient.generateDeepInsight(entryText, currentDepth, persona);
      
      const insight = {
        depth: currentDepth,
        level_name: this.depthLabels[currentDepth] || 'Unknown',
        text: result.insight,
        persona: persona,
        persona_name: personaData.name,
        timestamp: new Date().toISOString(),
        success: result.success
      };

      console.log('✅ Deep insight generated:', insight);
      return insight;
    } catch (error) {
      console.error('❌ Deep insight generation failed:', error);
      return this.getFallbackInsight(entryText, currentDepth, persona);
    }
  }

  getFallbackInsight(entryText, depth, persona) {
    const fallbackInsights = {
      sage: {
        1: "Your words reveal wisdom that comes from experience. What deeper truth emerges?",
        2: "In the quiet spaces between thoughts, what ancient knowing whispers?",
        3: "This experience connects to the eternal patterns of human growth.",
        4: "Your soul speaks through these words. What is it truly saying?",
        5: "You touch the transcendent truth that connects all beings."
      },
      poet: {
        1: "Your words dance like light on water, revealing depths beneath.",
        2: "There's a rhythm in your thoughts that speaks to the music of existence.",
        3: "Your heart writes verses in the language of pure feeling.",
        4: "The soul's poetry emerges through your authentic expression.",
        5: "You become the poem the universe writes about itself."
      },
      coach: {
        1: "I hear strength in your words. What action will you take?",
        2: "This insight shows you're ready to level up. What's your commitment?",
        3: "You have the power to transform this understanding into reality.",
        4: "Your deepest purpose is calling. How will you answer?",
        5: "You've found the unshakeable foundation of your true power."
      },
      friend: {
        1: "I hear you, and your feelings are completely valid.",
        2: "There's so much wisdom in what you're experiencing right now.",
        3: "You're connecting with something really important about yourself.",
        4: "This feels like a sacred moment of self-discovery for you.",
        5: "You've touched something beautiful and eternal within yourself."
      }
    };

    const insights = fallbackInsights[persona] || fallbackInsights.sage;
    
    return {
      depth: depth,
      level_name: this.depthLabels[depth] || 'Unknown',
      text: insights[depth] || insights[1],
      persona: persona,
      persona_name: getPersonaByKey(persona).name,
      timestamp: new Date().toISOString(),
      success: false,
      fallback: true
    };
  }

  getTreeVisualization(currentDepth) {
    const stages = [
      { depth: 0, symbol: '🌱', name: 'Seed', description: 'Beginning to journal' },
      { depth: 1, symbol: '🌿', name: 'Sprout', description: 'Surface reflections' },
      { depth: 2, symbol: '🌳', name: 'Growing', description: 'Deeper insights' },
      { depth: 3, symbol: '🍃', name: 'Flourishing', description: 'Core understanding' },
      { depth: 4, symbol: '🌸', name: 'Blooming', description: 'Soul wisdom' },
      { depth: 5, symbol: '✨', name: 'Transcendent', description: 'Universal truth' }
    ];

    return stages.map(stage => ({
      ...stage,
      active: currentDepth >= stage.depth,
      current: currentDepth === stage.depth
    }));
  }

  calculateProgressPercentage(currentDepth) {
    return Math.min((currentDepth / this.maxDepth) * 100, 100);
  }

  async saveInsightProgress(userId, entryId, depth, insight) {
    try {
      console.log('💾 Saving insight progress:', { userId, entryId, depth });
      
      // In production, this would save to database
      const progressData = {
        user_id: userId,
        entry_id: entryId,
        depth_level: depth,
        insight_text: insight.text,
        persona: insight.persona,
        created_at: new Date().toISOString()
      };

      // Mock API call for now
      return { success: true, data: progressData };
    } catch (error) {
      console.error('❌ Failed to save insight progress:', error);
      return { success: false, error: error.message };
    }
  }

  async getInsightHistory(userId, limit = 10) {
    try {
      console.log('📚 Fetching insight history for user:', userId);
      
      // Mock data for now - in production this would query the database
      return {
        success: true,
        insights: [],
        total_depth_explored: 0,
        favorite_persona: 'sage',
        deepest_level_reached: 1
      };
    } catch (error) {
      console.error('❌ Failed to fetch insight history:', error);
      return { success: false, error: error.message };
    }
  }

  canGoDeeper(currentDepth, isPremium) {
    if (isPremium) {
      return currentDepth < this.maxDepth;
    }
    
    // Free users can only go 1 level deep
    return currentDepth < 1;
  }

  getNextDepthPrompt(currentDepth) {
    const prompts = {
      1: "What emotions are beneath the surface?",
      2: "What patterns do you notice in your thoughts?",
      3: "How does this connect to your deeper values?",
      4: "What would your wisest self say?",
      5: "What sacred truth emerges from this?"
    };

    return prompts[currentDepth + 1] || "Continue exploring deeper...";
  }

  async testConnection() {
    try {
      console.log('🧪 Testing insight tree engine...');
      const testInsight = await this.generateDeepInsight('I feel peaceful today.', 1, 'test-user', 'sage');
      console.log('✅ Insight tree test passed:', testInsight.success);
      return testInsight.success;
    } catch (error) {
      console.error('❌ Insight tree test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const insightTreeEngine = new InsightTreeEngine();

// Export convenience functions
export const generateDeepInsight = (text, depth, userId, persona) => 
  insightTreeEngine.generateDeepInsight(text, depth, userId, persona);

export const getTreeVisualization = (depth) => 
  insightTreeEngine.getTreeVisualization(depth);

export const canGoDeeper = (depth, isPremium) => 
  insightTreeEngine.canGoDeeper(depth, isPremium);

export const testInsightTreeConnection = () => 
  insightTreeEngine.testConnection();