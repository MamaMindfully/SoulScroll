import { OpenAI } from 'openai';
import { storage } from '../storage';
import { logger } from '../utils/logger';
import { retryOpenAICall } from '../utils/retryUtils';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface ExtractedTheme {
  tag: string;
  strength: number;
}

export async function extractAndStoreThemes(userId: string, insights: string[]): Promise<UserMemoryTag[]> {
  try {
    if (!insights.length) return [];

    const insightsText = insights.join('\n');
    
    const prompt = `
You are an emotional theme analyst. Extract the core emotional and psychological themes from this journal reflection.

Return a JSON array of themes with strength ratings (0-5). Focus on deep psychological patterns like:
- uncertainty, letting_go, acceptance, control, desire
- healing, grief, growth, transformation, resistance
- connection, solitude, purpose, identity, fear

Text to analyze:
---
${insightsText}

Return format: [{"tag": "uncertainty", "strength": 3.8}, {"tag": "letting_go", "strength": 4.2}]
Limit to 3-5 most prominent themes.
    `;

    const response = await retryOpenAICall(
      () => openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200
      }),
      'theme-extraction'
    );

    const responseText = response.choices[0].message.content?.trim();
    
    try {
      const extractedThemes: ExtractedTheme[] = JSON.parse(responseText || '[]');
      
      // Store themes in database
      const storedTags: UserMemoryTag[] = [];
      for (const theme of extractedThemes) {
        if (theme.tag && theme.strength) {
          const storedTag = await storage.upsertMemoryTag(userId, theme.tag, theme.strength);
          storedTags.push(storedTag);
        }
      }

      logger.info('Themes extracted and stored', { 
        userId, 
        themeCount: storedTags.length,
        themes: storedTags.map(t => `${t.tag}:${t.strength}`)
      });

      return storedTags;
      
    } catch (parseError) {
      logger.error('Failed to parse theme extraction response', { 
        userId, 
        response: responseText,
        error: parseError.message 
      });
      return [];
    }

  } catch (error: any) {
    logger.error('Theme extraction failed', { 
      userId, 
      error: error.message 
    });
    return [];
  }
}

export async function getThemeBasedPromptContext(userId: string): Promise<string> {
  try {
    const topThemes = await storage.getTopUserThemes(userId, 3);
    
    if (!topThemes.length) return '';
    
    const themeList = topThemes
      .map(t => `${t.tag} (strength: ${t.strength})`)
      .join(', ');
    
    return `The user has been exploring themes such as: ${themeList}`;
    
  } catch (error: any) {
    logger.error('Failed to get theme context', { userId, error: error.message });
    return '';
  }
}

// Import UserMemoryTag type
import type { UserMemoryTag } from '../../shared/schema';