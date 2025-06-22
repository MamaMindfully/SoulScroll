import { storage } from '../storage';
import { logger } from './logger';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function updateToneVector({ 
  userId, 
  content 
}: {
  userId: string;
  content: string;
}) {
  try {
    // Analyze tone using GPT-4o
    const toneAnalysis = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Analyze the emotional tone of this journal entry and return a JSON object with tone scores (0-100) for: optimism, anxiety, gratitude, introspection, energy, sadness, anger, joy, fear, love. Also include a dominant_emotion field with the strongest emotion.`
        },
        {
          role: 'user',
          content: content
        }
      ],
      temperature: 0.1,
      max_tokens: 200
    });

    const toneResponse = toneAnalysis.choices[0].message.content;
    let toneVector;

    try {
      toneVector = JSON.parse(toneResponse || '{}');
    } catch {
      // Fallback tone analysis
      toneVector = generateFallbackToneVector(content);
    }

    // Store tone vector
    await storage.upsertToneVector(userId, toneVector);

    logger.info('Tone vector updated', { 
      userId, 
      dominantEmotion: toneVector.dominant_emotion 
    });

    return toneVector;

  } catch (error: any) {
    logger.error('Failed to update tone vector', { 
      error: error.message, 
      userId 
    });

    // Generate fallback tone vector
    const fallbackVector = generateFallbackToneVector(content);
    
    try {
      await storage.upsertToneVector(userId, fallbackVector);
    } catch (storageError) {
      logger.error('Failed to store fallback tone vector', { error: storageError.message });
    }

    return fallbackVector;
  }
}

function generateFallbackToneVector(content: string) {
  const text = content.toLowerCase();
  
  // Simple keyword-based tone analysis
  const toneScores = {
    optimism: calculateKeywordScore(text, ['hope', 'excited', 'positive', 'amazing', 'wonderful', 'great']),
    anxiety: calculateKeywordScore(text, ['worried', 'anxious', 'nervous', 'stress', 'overwhelming']),
    gratitude: calculateKeywordScore(text, ['grateful', 'thankful', 'appreciate', 'blessed', 'grateful']),
    introspection: calculateKeywordScore(text, ['thinking', 'reflect', 'realize', 'understand', 'learned']),
    energy: calculateKeywordScore(text, ['energetic', 'motivated', 'active', 'productive', 'accomplished']),
    sadness: calculateKeywordScore(text, ['sad', 'depressed', 'down', 'lonely', 'disappointed']),
    anger: calculateKeywordScore(text, ['angry', 'frustrated', 'annoyed', 'irritated', 'mad']),
    joy: calculateKeywordScore(text, ['happy', 'joyful', 'elated', 'cheerful', 'delighted']),
    fear: calculateKeywordScore(text, ['afraid', 'scared', 'fearful', 'terrified', 'worried']),
    love: calculateKeywordScore(text, ['love', 'caring', 'affection', 'cherish', 'adore'])
  };

  // Find dominant emotion
  const dominantEmotion = Object.entries(toneScores)
    .sort(([,a], [,b]) => b - a)[0][0];

  return {
    ...toneScores,
    dominant_emotion: dominantEmotion,
    generated_at: new Date().toISOString(),
    method: 'fallback'
  };
}

function calculateKeywordScore(text: string, keywords: string[]): number {
  const matches = keywords.filter(keyword => text.includes(keyword)).length;
  return Math.min(matches * 20, 100); // Max score of 100
}

export async function getToneVector(userId: string) {
  try {
    const toneVector = await storage.getToneVector(userId);
    return toneVector || null;
  } catch (error: any) {
    logger.error('Failed to get tone vector', { 
      error: error.message, 
      userId 
    });
    return null;
  }
}

export async function compareToneVectors(userId: string, recentDays: number = 7) {
  try {
    // Get recent journal entries to generate comparison
    const recentEntries = await storage.getJournalEntries(userId, 10, 0);
    const currentTone = await getToneVector(userId);

    if (!currentTone || recentEntries.length === 0) {
      return null;
    }

    // Calculate trend over time (simplified)
    const recentEmotions = recentEntries
      .slice(0, recentDays)
      .filter(entry => entry.emotionalTone !== null)
      .map(entry => entry.emotionalTone);

    if (recentEmotions.length === 0) {
      return currentTone;
    }

    const avgRecentEmotion = recentEmotions.reduce((a, b) => a + b, 0) / recentEmotions.length;
    
    return {
      current: currentTone,
      trend: {
        direction: avgRecentEmotion > 0 ? 'improving' : avgRecentEmotion < 0 ? 'declining' : 'stable',
        strength: Math.abs(avgRecentEmotion),
        recentAverage: avgRecentEmotion
      }
    };

  } catch (error: any) {
    logger.error('Failed to compare tone vectors', { 
      error: error.message, 
      userId 
    });
    return null;
  }
}