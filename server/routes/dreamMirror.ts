import { Router, Request, Response } from "express";
import { logger } from "../utils/logger";
import { storage } from "../storage";
import OpenAI from "openai";
import { retryOpenAICall } from "../utils/retryUtils";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Dream Mirror Mode - Cluster personal reflections into emotional themes
router.post('/api/dream-mirror', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;

    logger.info('Generating dream mirror clusters', { userId });

    // Get saved reflections for analysis
    const reflections = await storage.getSavedReflections(userId);
    
    if (reflections.length === 0) {
      return res.json({
        clusters: "You haven't saved any reflections yet. Start journaling and saving meaningful insights to unlock your Dream Mirror.",
        isEmpty: true
      });
    }

    // Prepare reflection content for analysis
    const reflectionTexts = reflections
      .slice(0, 25) // Limit to recent reflections
      .map(r => `• ${r.reflectionContent}`)
      .join('\n');

    const prompt = `Analyze these personal reflections and cluster them into 3-5 emotional themes. For each theme, provide:
1. A poetic theme name
2. A brief description of the emotional pattern
3. Key insights from this cluster

Reflections to analyze:
${reflectionTexts}

Respond with a beautiful, introspective analysis that helps the user understand their emotional patterns.`;

    const response = await retryOpenAICall(
      () => openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a reflection interpreter who helps people understand their emotional patterns through beautiful, insightful analysis. Write in a poetic, contemplative style.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      }),
      'dream-mirror'
    );

    const clusters = response.choices[0].message.content?.trim() || 
      "Your reflections reveal a journey of growth and self-discovery. Each saved insight is a step toward understanding your inner landscape.";

    logger.info('Dream mirror clusters generated', { 
      userId, 
      reflectionCount: reflections.length,
      clustersLength: clusters.length
    });

    res.json({ 
      clusters,
      reflectionCount: reflections.length,
      isEmpty: false
    });

  } catch (error: any) {
    logger.error('Dream mirror generation failed', { 
      error: error.message, 
      userId: req.user?.id 
    });

    // Fallback response
    res.json({
      clusters: "In the mirror of your reflections, patterns emerge like constellations in the night sky. Your journey of self-discovery is unique and beautiful, even when the details remain hidden.",
      fallback: true
    });
  }
});

// Get reflection themes summary
router.get('/api/reflection-themes', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;

    const reflections = await storage.getSavedReflections(userId);
    
    // Simple theme extraction from reflection content
    const themes = extractThemesFromReflections(reflections);

    res.json({ themes, totalReflections: reflections.length });

  } catch (error: any) {
    logger.error('Failed to get reflection themes', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to get reflection themes' });
  }
});

function extractThemesFromReflections(reflections: any[]) {
  const content = reflections
    .map(r => r.reflectionContent.toLowerCase())
    .join(' ');

  const themeKeywords = {
    growth: ['growth', 'learning', 'development', 'progress', 'improvement'],
    relationships: ['relationship', 'love', 'family', 'friend', 'connection'],
    creativity: ['creative', 'art', 'imagination', 'inspiration', 'expression'],
    mindfulness: ['present', 'mindful', 'awareness', 'meditation', 'breath'],
    challenges: ['challenge', 'difficult', 'struggle', 'overcome', 'resilience'],
    gratitude: ['grateful', 'thankful', 'appreciate', 'blessed', 'fortunate'],
    purpose: ['purpose', 'meaning', 'mission', 'calling', 'direction'],
    emotions: ['feeling', 'emotion', 'mood', 'emotional', 'heart']
  };

  const themes = Object.entries(themeKeywords).map(([theme, keywords]) => {
    const matches = keywords.filter(keyword => content.includes(keyword)).length;
    return {
      theme,
      strength: Math.min(matches * 20, 100),
      keywords: keywords.filter(keyword => content.includes(keyword))
    };
  }).filter(theme => theme.strength > 0)
    .sort((a, b) => b.strength - a.strength);

  return themes;
}

export default router;