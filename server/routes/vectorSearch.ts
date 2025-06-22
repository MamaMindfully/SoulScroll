import { Router, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { logger } from "../utils/logger";
import { embedEntry, embedAndSimilarSearch } from "../utils/embedEntry";
import { storage } from "../storage";

const router = Router();

// Create embeddings for journal entry
router.post('/api/embed-entry', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;
    const { entryId, content } = req.body;

    if (!entryId || !content) {
      return res.status(400).json({ error: 'entryId and content are required' });
    }

    const embedding = await embedEntry({ entryId, content, userId });
    
    logger.info('Entry embedded successfully', { entryId, userId });
    
    res.json({ success: true, embedding: embedding.slice(0, 5) }); // Return only first 5 values for response size

  } catch (error: any) {
    logger.error('Failed to embed entry', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to create embedding' });
  }
});

// Search similar journal entries
router.post('/api/similar-entries', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;
    const { query, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const similarEntries = await embedAndSimilarSearch(userId, query);
    
    // Get full journal entries for the similar results
    const entryPromises = similarEntries.slice(0, limit).map(async (similar) => {
      const entry = await storage.getJournalEntryById(similar.entryId);
      return {
        ...entry,
        similarity: similar.similarity
      };
    });

    const entries = await Promise.all(entryPromises);
    const validEntries = entries.filter(entry => entry && entry.id);

    logger.info('Similar entries found', { userId, query: query.substring(0, 50), count: validEntries.length });
    
    res.json({ 
      entries: validEntries,
      query: query.substring(0, 100) // Truncate for logging
    });

  } catch (error: any) {
    logger.error('Failed to search similar entries', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to search entries' });
  }
});

// Get embedding statistics for user
router.get('/api/embedding-stats', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const userId = user.id;

    const embeddings = await storage.getJournalEmbeddings(userId, 1000);
    const totalEntries = await storage.getJournalEntries(userId, 1000, 0);

    const stats = {
      totalEmbeddings: embeddings.length,
      totalEntries: totalEntries.length,
      embeddingCoverage: totalEntries.length > 0 ? (embeddings.length / totalEntries.length * 100).toFixed(1) : 0,
      oldestEmbedding: embeddings.length > 0 ? embeddings[embeddings.length - 1].createdAt : null,
      newestEmbedding: embeddings.length > 0 ? embeddings[0].createdAt : null
    };

    res.json(stats);

  } catch (error: any) {
    logger.error('Failed to get embedding stats', { 
      error: error.message, 
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to get embedding statistics' });
  }
});

export default router;