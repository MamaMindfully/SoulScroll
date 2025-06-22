import OpenAI from 'openai';
import { storage } from '../storage';
import { logger } from './logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedEntry({ entryId, content, userId }: {
  entryId: number;
  content: string;
  userId: string;
}) {
  try {
    logger.info('Creating embedding for journal entry', { entryId, userId });

    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: content.substring(0, 8000) // Limit content length
    });

    const embedding = embeddingRes.data[0].embedding;

    await storage.createJournalEmbedding(userId, {
      entryId,
      embedding
    });

    logger.info('Embedding created successfully', { entryId, userId });
    return embedding;

  } catch (error: any) {
    logger.error('Failed to create embedding', { 
      error: error.message, 
      entryId, 
      userId 
    });
    throw error;
  }
}

export async function findSimilarEntries(userId: string, queryEmbedding: number[], limit: number = 5) {
  try {
    // Get all embeddings for user (in a real app, you'd use vector similarity search)
    const embeddings = await storage.getJournalEmbeddings(userId, 100);
    
    // Calculate cosine similarity for each embedding
    const similarities = embeddings.map(emb => ({
      ...emb,
      similarity: cosineSimilarity(queryEmbedding, emb.embedding)
    }));

    // Sort by similarity and return top results
    const similar = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similar;

  } catch (error: any) {
    logger.error('Failed to find similar entries', { 
      error: error.message, 
      userId 
    });
    return [];
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

export async function embedAndSimilarSearch(userId: string, query: string) {
  try {
    // Create embedding for the query
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query
    });

    const queryEmbedding = embeddingRes.data[0].embedding;
    
    // Find similar entries
    const similarEntries = await findSimilarEntries(userId, queryEmbedding);
    
    return similarEntries;

  } catch (error: any) {
    logger.error('Failed to perform similarity search', { 
      error: error.message, 
      userId,
      query: query.substring(0, 100)
    });
    return [];
  }
}