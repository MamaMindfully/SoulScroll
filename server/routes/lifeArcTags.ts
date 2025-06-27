import { Router, Request, Response } from "express";
import { logger } from "../utils/logger";
import { tagLifeArc, getUserLifeArcSummary } from "../utils/lifeArcTagger";
import { storage } from "../storage";

const router = Router();

// Create life arc tags for journal entry
router.post('/api/life-arc-tags', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;
    const { entryId, content } = req.body;

    if (!entryId || !content) {
      return res.status(400).json({ error: 'entryId and content are required' });
    }

    const tags = await tagLifeArc(entryId, userId, content);
    
    logger.info('Life arc tags created', { entryId, userId, tagCount: tags.length });
    
    res.json({ success: true, tags });

  } catch (error: any) {
    logger.error('Failed to create life arc tags', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to create life arc tags' });
  }
});

// Get user's life arc summary
router.get('/api/life-arc-summary', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;

    const summary = await getUserLifeArcSummary(userId);
    
    logger.info('Life arc summary retrieved', { 
      userId, 
      topThemeCount: summary.topThemes.length,
      recentTagCount: summary.recentTags.length 
    });
    
    res.json(summary);

  } catch (error: any) {
    logger.error('Failed to get life arc summary', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to get life arc summary' });
  }
});

// Get all life arc tags for user
router.get('/api/life-arc-tags', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const tags = await storage.getLifeArcTags(userId, limit);
    
    res.json({ tags });

  } catch (error: any) {
    logger.error('Failed to get life arc tags', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to get life arc tags' });
  }
});

// Get life arc insights
router.get('/api/life-arc-insights', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;

    const summary = await storage.getUserLifeArcSummary(userId);
    
    // Generate insights based on patterns
    const insights = [];

    if (summary.topThemes.length > 0) {
      const dominantTheme = summary.topThemes[0];
      insights.push({
        type: 'dominant_theme',
        title: `Your Journey Centers on ${dominantTheme.tag.replace('_', ' ')}`,
        description: `This theme appears ${dominantTheme.count} times in your entries, suggesting it's a central part of your current life chapter.`,
        theme: dominantTheme.tag
      });
    }

    if (summary.recentTags.length > 0) {
      const recentThemes = [...new Set(summary.recentTags)];
      insights.push({
        type: 'recent_focus',
        title: 'Your Recent Focus Areas',
        description: `In the past month, you've been exploring: ${recentThemes.slice(0, 3).join(', ')}`,
        themes: recentThemes
      });
    }

    // Look for growth patterns
    const growthTags = summary.topThemes.filter(theme => 
      ['growth', 'healing', 'discovery', 'transformation', 'awakening'].some(keyword => 
        theme.tag.includes(keyword)
      )
    );

    if (growthTags.length > 0) {
      insights.push({
        type: 'growth_pattern',
        title: 'Growth and Transformation',
        description: 'Your entries show strong patterns of personal development and transformation.',
        themes: growthTags.map(t => t.tag)
      });
    }

    logger.info('Life arc insights generated', { userId, insightCount: insights.length });
    
    res.json({ insights });

  } catch (error: any) {
    logger.error('Failed to generate life arc insights', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

export default router;