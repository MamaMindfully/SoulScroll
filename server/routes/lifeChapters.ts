import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { captureError } from "../utils/errorHandler";
import { generateLifeChapter, shouldGenerateNewChapter } from "../engines/chapterGenerator";

const router = Router();

// Get user's life chapters
router.get('/api/chapters', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter required' });
    }

    logger.info('Fetching life chapters', { userId });

    const chapters = await storage.getLifeChapters(userId as string, 20);

    res.json(chapters.map(chapter => ({
      id: chapter.id,
      title: chapter.title,
      emotions: chapter.emotions || [],
      theme: chapter.theme,
      summary: chapter.summary,
      entryCount: chapter.entryCount,
      createdAt: chapter.createdAt
    })));

  } catch (error: any) {
    captureError(error, {
      userId: req.query.userId as string,
      operation: 'fetch_life_chapters'
    });

    logger.error('Failed to fetch life chapters', {
      error: error.message,
      userId: req.query.userId
    });

    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

// Generate a new life chapter
router.post('/api/generate-chapter', async (req: Request, res: Response) => {
  try {
    const { userId, daysBack } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    logger.info('Generating life chapter', { userId, daysBack });

    // Check if user has enough entries
    const chapter = await generateLifeChapter(userId, daysBack || 30);

    if (!chapter) {
      return res.status(400).json({ 
        error: 'Not enough entries to generate a chapter. Write more journal entries and try again.' 
      });
    }

    res.json({ 
      message: 'Chapter generated successfully',
      chapter: {
        id: chapter.id,
        title: chapter.title,
        emotions: chapter.emotions,
        theme: chapter.theme,
        summary: chapter.summary,
        entryCount: chapter.entryCount,
        createdAt: chapter.createdAt
      }
    });

  } catch (error: any) {
    captureError(error, {
      userId: req.body.userId,
      operation: 'generate_life_chapter'
    });

    logger.error('Failed to generate life chapter', {
      error: error.message,
      userId: req.body.userId
    });

    res.status(500).json({ error: 'Failed to generate chapter' });
  }
});

// Check if user should generate a new chapter
router.get('/api/chapters/should-generate', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter required' });
    }

    const shouldGenerate = await shouldGenerateNewChapter(userId as string);
    const latestChapter = await storage.getLatestChapter(userId as string);

    res.json({ 
      shouldGenerate,
      hasChapters: !!latestChapter,
      lastChapterDate: latestChapter?.createdAt || null
    });

  } catch (error: any) {
    captureError(error, {
      userId: req.query.userId as string,
      operation: 'check_chapter_generation'
    });

    logger.error('Failed to check chapter generation status', {
      error: error.message,
      userId: req.query.userId
    });

    res.status(500).json({ error: 'Failed to check status' });
  }
});

export default router;