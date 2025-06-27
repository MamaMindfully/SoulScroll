import OpenAI from 'openai';
import { storage } from '../storage';
import { logger } from './logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function tagLifeArc(entryId: number, userId: string, content: string): Promise<string[]> {
  try {
    logger.info('Generating life arc tags', { entryId, userId });

    // Use AI to extract life arc themes from the content
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a wise observer of human life patterns. Analyze the journal entry and extract 1-3 life arc tags that represent the deeper themes and growth patterns present.

Life arc tags should capture:
- Major life transitions (career_change, relationship_evolution, spiritual_awakening)
- Growth themes (self_discovery, healing, courage_building)
- Life phases (early_adulthood, midlife_reflection, elder_wisdom)
- Universal patterns (letting_go, embracing_change, finding_purpose)

Return only the tags as a comma-separated list, no explanations.
Example: "self_discovery, courage_building, healing"`
        },
        {
          role: 'user',
          content: content
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    const tagsText = response.choices[0].message.content?.trim() || '';
    const tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    // Store tags in database
    for (const tag of tags) {
      await storage.createLifeArcTag(userId, {
        entryId,
        tag
      });
    }

    logger.info('Life arc tags created', { entryId, userId, tags });
    return tags;

  } catch (error: any) {
    logger.error('Failed to generate life arc tags', { 
      error: error.message, 
      entryId, 
      userId 
    });
    
    // Return fallback tags based on content analysis
    const fallbackTags = extractFallbackTags(content);
    
    for (const tag of fallbackTags) {
      await storage.createLifeArcTag(userId, {
        entryId,
        tag
      });
    }
    
    return fallbackTags;
  }
}

function extractFallbackTags(content: string): string[] {
  const text = content.toLowerCase();
  const tags: string[] = [];

  // Simple keyword-based fallback tagging
  if (text.includes('change') || text.includes('transition')) {
    tags.push('transition');
  }
  
  if (text.includes('relationship') || text.includes('love') || text.includes('family')) {
    tags.push('relationships');
  }
  
  if (text.includes('work') || text.includes('career') || text.includes('job')) {
    tags.push('career');
  }
  
  if (text.includes('growth') || text.includes('learn') || text.includes('discover')) {
    tags.push('growth');
  }
  
  if (text.includes('struggle') || text.includes('difficult') || text.includes('challenge')) {
    tags.push('challenges');
  }
  
  if (text.includes('grateful') || text.includes('thankful') || text.includes('appreciate')) {
    tags.push('gratitude');
  }

  return tags.length > 0 ? tags.slice(0, 3) : ['reflection'];
}

export async function getUserLifeArcSummary(userId: string): Promise<{
  topThemes: Array<{ tag: string; count: number }>;
  recentTags: string[];
  lifePhases: string[];
}> {
  try {
    const allTags = await storage.getLifeArcTags(userId, 100);
    
    // Count tag frequencies
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag.tag] = (acc[tag.tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get top themes
    const topThemes = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get recent tags (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTags = allTags
      .filter(tag => new Date(tag.createdAt) >= thirtyDaysAgo)
      .map(tag => tag.tag)
      .slice(0, 10);

    // Identify potential life phases
    const phaseKeywords = ['transition', 'beginning', 'ending', 'transformation', 'awakening'];
    const lifePhases = topThemes
      .filter(theme => phaseKeywords.some(keyword => theme.tag.includes(keyword)))
      .map(theme => theme.tag);

    return {
      topThemes,
      recentTags,
      lifePhases
    };

  } catch (error: any) {
    logger.error('Failed to get life arc summary', { 
      error: error.message, 
      userId 
    });
    
    return {
      topThemes: [],
      recentTags: [],
      lifePhases: []
    };
  }
}