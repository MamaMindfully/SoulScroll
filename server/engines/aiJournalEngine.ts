import OpenAI from "openai";
import { logger } from "../utils/logger";
import { storage } from "../storage";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface JournalAnalysis {
  emotionScore: number;
  confidenceScore: number;
  themes: string[];
  insights: string[];
  reflection: string;
  suggestions: string[];
}

interface EmotionDetection {
  primary: string;
  secondary: string[];
  intensity: number;
  valence: number; // positive/negative scale
}

export class AIJournalEngine {
  
  /**
   * Analyze journal entry for emotional content and insights
   */
  async analyzeJournalEntry(content: string, userId: string): Promise<JournalAnalysis> {
    try {
      logger.info('Starting journal analysis', { userId, contentLength: content.length });

      const analysisPrompt = `
        As an empathetic AI journal companion, analyze this journal entry with deep emotional intelligence:

        "${content}"

        Provide analysis in this exact JSON format:
        {
          "emotionScore": [1-10 scale of emotional intensity],
          "confidenceScore": [1-10 how confident you are in analysis],
          "themes": ["theme1", "theme2", "theme3"],
          "insights": ["insight1", "insight2", "insight3"],
          "reflection": "A compassionate, personalized reflection that validates feelings and offers gentle wisdom",
          "suggestions": ["actionable suggestion 1", "suggestion 2"]
        }

        Be warm, non-judgmental, and supportive. Focus on growth and self-compassion.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a wise, compassionate AI journal companion. Provide deep emotional insights with warmth and empathy."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const analysisText = response.choices[0].message.content;
      let analysis: JournalAnalysis;

      try {
        analysis = JSON.parse(analysisText);
      } catch (parseError) {
        logger.warn('Failed to parse AI analysis JSON, using fallback', { userId, parseError });
        analysis = this.generateFallbackAnalysis(content);
      }

      logger.info('Journal analysis completed', { 
        userId, 
        emotionScore: analysis.emotionScore,
        themes: analysis.themes.length 
      });

      return analysis;

    } catch (error) {
      logger.error('Error in journal analysis', { userId, error: error.message });
      return this.generateFallbackAnalysis(content);
    }
  }

  /**
   * Detect specific emotions in journal content
   */
  async detectEmotions(content: string): Promise<EmotionDetection> {
    try {
      const emotionPrompt = `
        Analyze the emotional content of this journal entry:
        "${content}"
        
        Respond in JSON format:
        {
          "primary": "primary emotion name",
          "secondary": ["emotion2", "emotion3"],
          "intensity": [1-10 scale],
          "valence": [-5 to +5, negative to positive]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert at emotion detection. Identify emotions with precision."
          },
          {
            role: "user",
            content: emotionPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const emotionText = response.choices[0].message.content;
      
      try {
        return JSON.parse(emotionText);
      } catch {
        return this.generateFallbackEmotion();
      }

    } catch (error) {
      logger.error('Error in emotion detection', { error: error.message });
      return this.generateFallbackEmotion();
    }
  }

  /**
   * Generate personalized reflection based on user history
   */
  async generatePersonalizedReflection(
    content: string, 
    userId: string, 
    recentEntries: any[] = []
  ): Promise<string> {
    try {
      // Get user's recent patterns
      const userContext = await this.buildUserContext(userId, recentEntries);
      
      const reflectionPrompt = `
        User context: ${userContext}
        
        Current journal entry: "${content}"
        
        As their personal AI companion, write a warm, insightful reflection that:
        1. Acknowledges their current feelings
        2. Connects to their growth patterns
        3. Offers gentle wisdom
        4. Encourages continued self-discovery
        
        Keep it personal, supportive, and under 200 words.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a wise, caring AI companion who knows this person's journey. Be personal and supportive."
          },
          {
            role: "user",
            content: reflectionPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 300
      });

      return response.choices[0].message.content || "Thank you for sharing your thoughts. Your journey of self-reflection is valuable.";

    } catch (error) {
      logger.error('Error generating personalized reflection', { userId, error: error.message });
      return "Thank you for sharing. Your thoughts and feelings are valid, and this moment of reflection is part of your growth.";
    }
  }

  /**
   * Score emotional intensity and insight depth
   */
  async scoreInsightDepth(content: string): Promise<{ depth: number; complexity: number }> {
    try {
      const scoringPrompt = `
        Rate this journal entry on:
        1. Emotional depth (1-10): How deeply does the person explore their feelings?
        2. Insight complexity (1-10): How sophisticated is their self-analysis?
        
        "${content}"
        
        Respond as JSON: {"depth": X, "complexity": Y}
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing emotional depth and psychological insight in writing."
          },
          {
            role: "user",
            content: scoringPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 50
      });

      try {
        return JSON.parse(response.choices[0].message.content);
      } catch {
        return { depth: 5, complexity: 5 };
      }

    } catch (error) {
      logger.error('Error scoring insight depth', { error: error.message });
      return { depth: 5, complexity: 5 };
    }
  }

  /**
   * Build user context from their journal history
   */
  private async buildUserContext(userId: string, recentEntries: any[]): Promise<string> {
    try {
      if (recentEntries.length === 0) {
        return "New journaler beginning their self-discovery journey.";
      }

      const patterns = recentEntries.slice(0, 5).map(entry => ({
        themes: entry.themes || [],
        mood: entry.mood || 5,
        insights: entry.insights || []
      }));

      return `
        Recent patterns: 
        - Common themes: ${patterns.flatMap(p => p.themes).slice(0, 5).join(', ')}
        - Average mood: ${patterns.reduce((acc, p) => acc + p.mood, 0) / patterns.length}
        - Growth areas: ${patterns.flatMap(p => p.insights).slice(0, 3).join(', ')}
      `;

    } catch (error) {
      logger.error('Error building user context', { userId, error: error.message });
      return "Continuing their mindful journaling practice.";
    }
  }

  /**
   * Fallback analysis when AI fails
   */
  private generateFallbackAnalysis(content: string): JournalAnalysis {
    const wordCount = content.split(/\s+/).length;
    const hasPositiveWords = /\b(happy|joy|grateful|love|excited|peaceful|calm)\b/i.test(content);
    const hasNegativeWords = /\b(sad|angry|frustrated|worried|anxious|stressed)\b/i.test(content);
    
    let emotionScore = 5;
    if (hasPositiveWords && !hasNegativeWords) emotionScore = 7;
    if (hasNegativeWords && !hasPositiveWords) emotionScore = 3;

    return {
      emotionScore,
      confidenceScore: 6,
      themes: wordCount > 50 ? ["self-reflection", "daily experiences"] : ["brief thoughts"],
      insights: ["Your willingness to reflect shows self-awareness", "Every entry contributes to your growth"],
      reflection: "Thank you for taking time to reflect. Your thoughts and feelings matter, and this practice of journaling is a meaningful step in your personal growth journey.",
      suggestions: ["Consider exploring these feelings further", "Notice patterns in your daily experiences"]
    };
  }

  /**
   * Fallback emotion detection
   */
  private generateFallbackEmotion(): EmotionDetection {
    return {
      primary: "reflective",
      secondary: ["contemplative", "introspective"],
      intensity: 5,
      valence: 0
    };
  }
}

export const aiJournalEngine = new AIJournalEngine();