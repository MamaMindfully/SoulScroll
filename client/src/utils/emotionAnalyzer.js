import { openaiClient } from './openaiClient.js';

export class EmotionAnalyzer {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async analyzeEmotion(text, entryId = null) {
    try {
      console.log('Analyzing emotion for text:', text.substring(0, 50) + '...');
      
      const result = await openaiClient.scoreEmotion(text, entryId);
      
      if (result.success) {
        console.log('Emotion analysis successful:', result.score);
        return {
          score: result.score,
          label: this.getEmotionLabel(result.score),
          confidence: 0.85,
          success: true
        };
      } else {
        console.warn('OpenAI emotion analysis failed, using fallback');
        const fallbackScore = this.calculateFallbackScore(text);
        return {
          score: fallbackScore,
          label: this.getEmotionLabel(fallbackScore),
          confidence: 0.6,
          success: false,
          fallback: true
        };
      }
    } catch (error) {
      console.error('Emotion analysis error:', error);
      const fallbackScore = this.calculateFallbackScore(text);
      return {
        score: fallbackScore,
        label: this.getEmotionLabel(fallbackScore),
        confidence: 0.4,
        success: false,
        error: error.message
      };
    }
  }

  calculateFallbackScore(text) {
    const words = text.toLowerCase().split(/\s+/);
    
    const emotionKeywords = {
      high: ['amazing', 'incredible', 'devastating', 'overwhelming', 'ecstatic', 'furious', 'heartbroken', 'elated'],
      medium: ['happy', 'sad', 'excited', 'worried', 'grateful', 'frustrated', 'hopeful', 'disappointed'],
      low: ['okay', 'fine', 'calm', 'peaceful', 'neutral', 'steady', 'balanced', 'mild']
    };

    let score = 5; // neutral baseline
    
    words.forEach(word => {
      if (emotionKeywords.high.includes(word)) {
        score += 2;
      } else if (emotionKeywords.medium.includes(word)) {
        score += 1;
      } else if (emotionKeywords.low.includes(word)) {
        score += 0.5;
      }
    });

    // Factor in punctuation intensity
    const exclamations = (text.match(/!/g) || []).length;
    const questions = (text.match(/\?/g) || []).length;
    const caps = (text.match(/[A-Z]{2,}/g) || []).length;

    score += exclamations * 0.5 + questions * 0.3 + caps * 0.4;

    return Math.max(1, Math.min(10, Math.round(score)));
  }

  getEmotionLabel(score) {
    if (score >= 9) return { label: 'Intense', color: 'red', description: 'Highly charged emotional state' };
    if (score >= 7) return { label: 'Strong', color: 'orange', description: 'Significant emotional engagement' };
    if (score >= 5) return { label: 'Moderate', color: 'yellow', description: 'Balanced emotional expression' };
    if (score >= 3) return { label: 'Gentle', color: 'green', description: 'Calm emotional state' };
    return { label: 'Peaceful', color: 'blue', description: 'Very calm and centered' };
  }

  async testConnection() {
    try {
      console.log('Testing emotion analyzer connection...');
      const testResult = await this.analyzeEmotion('I feel happy and content today.');
      console.log('Emotion analyzer test passed:', testResult);
      return testResult.success;
    } catch (error) {
      console.error('Emotion analyzer test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emotionAnalyzer = new EmotionAnalyzer();

// Export convenience functions
export const analyzeEmotion = (text, entryId) => emotionAnalyzer.analyzeEmotion(text, entryId);
export const testEmotionConnection = () => emotionAnalyzer.testConnection();