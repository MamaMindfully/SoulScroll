import { OpenAI } from 'openai';
import { storage } from '../storage';
import { logger } from '../utils/logger';
import { retryOpenAICall } from '../utils/retryUtils';
import type { LifeChapter, JournalEntry } from '../../shared/schema';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface ChapterData {
  title: string;
  emotions: string[];
  theme: string;
  summary: string;
}

export async function generateLifeChapter(userId: string, daysBack: number = 30): Promise<LifeChapter | null> {
  try {
    // Calculate date threshold (30 days ago)
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysBack);

    // Fetch recent journal entries with insights
    const allEntries = await storage.getJournalEntries(userId, 100, 0);
    const recentEntries = allEntries.filter(entry => 
      entry.createdAt && new Date(entry.createdAt) >= dateThreshold
    );

    if (!recentEntries || recentEntries.length < 5) {
      logger.info('Not enough entries to generate chapter', { 
        userId, 
        entryCount: recentEntries.length,
        daysBack 
      });
      return null;
    }

    // Prepare insights data for analysis
    const insights = recentEntries
      .filter(entry => entry.aiResponse)
      .map(entry => ({
        insight: entry.aiResponse,
        emotion: entry.themes?.[0] || 'reflection',
        intensity: entry.emotionScore || 5
      }));

    if (insights.length < 3) {
      logger.info('Not enough insights for chapter generation', { 
        userId, 
        insightCount: insights.length 
      });
      return null;
    }

    const prompt = `
You are a poetic autobiographer summarizing a person's emotional growth.
Given the following insights, emotions, and intensities, write a chapter summary including:
- Title (2–5 words, poetic and meaningful)
- Top emotions (max 3, most significant)
- Dominant theme (one clear psychological/emotional theme)
- A one-sentence insight that captures the arc of growth

Respond in JSON format:
{ "title": "...", "emotions": ["", ""], "theme": "...", "summary": "..." }

INSIGHTS:
${insights.map(i => `- "${i.insight}" [${i.emotion}, ${i.intensity}]`).join('\n')}
    `;

    const response = await retryOpenAICall(
      () => openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.75,
        max_tokens: 300
      }),
      'chapter-generation'
    );

    const responseText = response.choices[0].message.content?.trim();
    
    try {
      const chapterData: ChapterData = JSON.parse(responseText || '{}');
      
      if (!chapterData.title || !chapterData.theme || !chapterData.summary) {
        throw new Error('Incomplete chapter data received');
      }

      // Store chapter in database
      const savedChapter = await storage.createLifeChapter(userId, {
        title: chapterData.title,
        emotions: chapterData.emotions || [],
        theme: chapterData.theme,
        summary: chapterData.summary,
        entryCount: recentEntries.length
      });

      logger.info('Life chapter generated and saved', { 
        userId, 
        chapterId: savedChapter.id,
        title: savedChapter.title,
        entryCount: recentEntries.length
      });

      return savedChapter;
      
    } catch (parseError) {
      logger.error('Failed to parse chapter generation response', { 
        userId, 
        response: responseText,
        error: parseError.message 
      });
      return null;
    }

  } catch (error: any) {
    logger.error('Chapter generation failed', { 
      userId, 
      error: error.message 
    });
    return null;
  }
}

export async function shouldGenerateNewChapter(userId: string): Promise<boolean> {
  try {
    const latestChapter = await storage.getLatestChapter(userId);
    
    if (!latestChapter) {
      // No chapters exist, check if user has enough entries
      const entries = await storage.getJournalEntries(userId, 10, 0);
      return entries.length >= 5;
    }

    // Check if it's been at least 30 days since last chapter
    const daysSinceLastChapter = Math.floor(
      (Date.now() - new Date(latestChapter.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastChapter < 28) {
      return false; // Too soon for new chapter
    }

    // Check if user has enough new entries since last chapter
    const entriesSinceChapter = await storage.getJournalEntries(userId, 50, 0);
    const newEntries = entriesSinceChapter.filter(entry => 
      new Date(entry.createdAt) > new Date(latestChapter.createdAt)
    );

    return newEntries.length >= 10; // Need at least 10 new entries

  } catch (error: any) {
    logger.error('Failed to check chapter generation criteria', { 
      userId, 
      error: error.message 
    });
    return false;
  }
}