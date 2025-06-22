import { logger } from '../utils/logger';

// Simplified worker initialization
const REDIS_ENABLED = process.env.REDIS_URL || process.env.NODE_ENV === 'production';

async function initializeWorkers() {
  if (!REDIS_ENABLED) {
    logger.info('Memory queues handle their own processing in development');
    return;
  }

  try {
    // Only initialize BullMQ workers if Redis is available in production
    const Redis = (await import('ioredis')).default;
    const connection = new Redis(process.env.REDIS_URL || {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    await connection.ping();
    await initializeBullMQWorkers(connection);
    
  } catch (error) {
    logger.info('Redis not available for workers, using memory processing', { 
      error: error.message 
    });
  }
}

async function initializeBullMQWorkers(connection: any) {
  const { Worker } = await import('bullmq');
  const { OpenAI } = await import('openai');
  const { storage } = await import('../storage');
  const { retryOpenAICall } = await import('../utils/retryUtils');
  const { captureError } = await import('../utils/errorHandler');
  const { tokenMonitor } = await import('../services/tokenMonitor');

  const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
  });

  // Unified Journal Bundle Worker (following your pattern)
  const journalBundleWorker = new Worker('journalBundle', async (job: any) => {
    const { userId, entryText } = job.data;
    
    logger.info('Processing journal bundle job', { 
      jobId: job.id, 
      userId, 
      textLength: entryText.length 
    });

    try {
      // Step 1: Generate AI Insight
      const insightRes = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'Give an emotionally intelligent, personal insight about the following journal entry.' 
          },
          { 
            role: 'user', 
            content: entryText 
          }
        ],
        temperature: 0.7,
      });

      const insight = insightRes.choices[0].message.content.trim();

      // Step 2: Emotion Scoring
      const emotionRes = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'Return a JSON with "emotion" and "intensity" (0-100). Be brief.' 
          },
          { 
            role: 'user', 
            content: entryText 
          }
        ],
        temperature: 0.2,
      });

      const emotionData = JSON.parse(emotionRes.choices[0].message.content.trim());
      const { emotion, intensity } = emotionData;

      // Step 3: Save All to Database
      const journalEntry = await storage.createJournalEntry(userId, {
        content: entryText,
        mood: Math.round(intensity / 10), // Convert to 1-10 scale
        wordCount: entryText.split(/\s+/).length,
        aiResponse: insight,
        emotionScore: intensity,
        themes: [emotion]
      });

      // Step 4: Update Progress/Graph Summary
      await storage.updateUserStreak(userId);

      logger.info('Journal bundle processing completed', {
        jobId: job.id,
        userId,
        entryId: journalEntry.id,
        emotion,
        intensity
      });

      return {
        journalEntry,
        insight,
        emotion,
        intensity,
        processed: true,
        timestamp: new Date()
      };

    } catch (error: any) {
      captureError(error, {
        userId,
        operation: 'journal_bundle_worker',
        jobId: job.id
      });

      logger.error('Journal bundle job failed', {
        jobId: job.id,
        userId,
        error: error.message
      });

      throw error;
    }
  }, { connection });

// Emotion Analysis Worker
const emotionWorker = new Worker('emotionQueue', async (job: Job) => {
  const { userId, journalText } = job.data;
  
  logger.info('Processing emotion analysis job', { 
    jobId: job.id, 
    userId 
  });

  try {
    const emotionAnalysis = await analyzeEmotions(journalText);

    // Save emotion data
    await storage.createEmotionalInsight(userId, {
      period: 'daily',
      averageMood: Math.round(emotionAnalysis.intensity / 10),
      insights: [`Detected emotion: ${emotionAnalysis.primary} with ${emotionAnalysis.intensity}% intensity`],
      emotionalPatterns: [emotionAnalysis.primary],
      recommendations: getEmotionRecommendations(emotionAnalysis.primary, emotionAnalysis.intensity)
    });

    logger.info('Emotion analysis completed', {
      jobId: job.id,
      userId,
      emotion: emotionAnalysis.primary,
      intensity: emotionAnalysis.intensity
    });

    return emotionAnalysis;

  } catch (error: any) {
    captureError(error, {
      userId,
      operation: 'emotion_worker_analysis',
      jobId: job.id
    });

    logger.error('Emotion analysis job failed', {
      jobId: job.id,
      userId,
      error: error.message
    });

    throw error;
  }
}, { connection });

// Insight Generation Worker
const insightWorker = new Worker('insightQueue', async (job: Job) => {
  const { userId, entries } = job.data;
  
  logger.info('Processing insight generation job', { 
    jobId: job.id, 
    userId,
    entriesCount: entries.length
  });

  try {
    const insights = [];
    
    for (const entry of entries.slice(0, 5)) { // Limit to 5 entries
      const emotionAnalysis = await analyzeEmotions(entry);
      insights.push({
        text: entry.substring(0, 100) + '...',
        emotion: emotionAnalysis.primary,
        intensity: emotionAnalysis.intensity,
        wordCount: entry.split(/\s+/).length
      });
    }

    const summary = {
      totalEntries: insights.length,
      averageIntensity: insights.reduce((sum, i) => sum + i.intensity, 0) / insights.length,
      dominantEmotion: getMostCommonEmotion(insights.map(i => i.emotion)),
      totalWords: insights.reduce((sum, i) => sum + i.wordCount, 0)
    };

    logger.info('Insight generation completed', {
      jobId: job.id,
      userId,
      summary
    });

    return { insights, summary };

  } catch (error: any) {
    captureError(error, {
      userId,
      operation: 'insight_worker_generation',
      jobId: job.id
    });

    logger.error('Insight generation job failed', {
      jobId: job.id,
      userId,
      error: error.message
    });

    throw error;
  }
}, { connection });

// Helper function for emotion analysis
async function analyzeEmotions(text: string) {
  try {
    const response = await retryOpenAICall(
      () => openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Analyze the emotional content and respond with JSON: {"primary": "emotion_name", "intensity": 1-100, "labels": ["emotion1", "emotion2"]}'
          },
          {
            role: 'user',
            content: `Analyze emotions in: "${text}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 100
      }),
      'emotion-analysis'
    );

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      primary: result.primary || 'neutral',
      intensity: result.intensity || 50,
      labels: result.labels || ['neutral']
    };
  } catch (error) {
    return {
      primary: 'neutral',
      intensity: 50,
      labels: ['neutral']
    };
  }
}

// Helper function for emotion recommendations
function getEmotionRecommendations(emotion: string, intensity: number): string[] {
  const recommendations: Record<string, string[]> = {
    joy: ['Savor this positive moment', 'Share your happiness with others'],
    sadness: ['Be gentle with yourself', 'Consider talking to someone you trust'],
    anxiety: ['Try deep breathing exercises', 'Focus on what you can control'],
    anger: ['Take a moment to cool down', 'Express feelings constructively'],
    calm: ['Appreciate this peaceful state', 'Use this clarity for reflection'],
    excitement: ['Channel this energy positively', 'Plan your next steps mindfully']
  };

  const baseRecommendations = recommendations[emotion.toLowerCase()] || ['Practice self-awareness', 'Be present with your feelings'];
  
  if (intensity > 80) {
    baseRecommendations.push('Consider the intensity of this emotion and what it might be telling you');
  }
  
  return baseRecommendations;
}

// Helper function to find most common emotion
function getMostCommonEmotion(emotions: string[]): string {
  if (emotions.length === 0) return 'neutral';
  
  const counts = emotions.reduce((acc, emotion) => {
    acc[emotion] = (acc[emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';
}

  // Worker event handlers
  journalWorker.on('completed', (job: any, result: any) => {
    logger.info('Journal analysis job completed', { jobId: job.id, result });
  });

  journalWorker.on('failed', (job: any, err: any) => {
    logger.error('Journal analysis job failed', { jobId: job?.id, error: err.message });
  });

  emotionWorker.on('completed', (job: any, result: any) => {
    logger.info('Emotion analysis job completed', { jobId: job.id, result });
  });

  emotionWorker.on('failed', (job: any, err: any) => {
    logger.error('Emotion analysis job failed', { jobId: job?.id, error: err.message });
  });

  insightWorker.on('completed', (job: any, result: any) => {
    logger.info('Insight generation job completed', { jobId: job.id, result });
  });

  insightWorker.on('failed', (job: any, err: any) => {
    logger.error('Insight generation job failed', { jobId: job?.id, error: err.message });
  });

  logger.info('BullMQ workers initialized', {
    workers: ['journalWorker', 'emotionWorker', 'insightWorker']
  });
}

// Initialize workers
initializeWorkers().catch(error => {
  logger.error('Failed to initialize workers', { error: error.message });
});