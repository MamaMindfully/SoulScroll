import { logger } from '../utils/logger';

// Conditional worker initialization - only if Redis is available
async function initializeWorkers() {
  try {
    // Check if we can use BullMQ workers
    const Redis = (await import('ioredis')).default;
    const connection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      enableOfflineQueue: false,
    });

    await connection.ping();
    
    // If Redis is available, initialize BullMQ workers
    await initializeBullMQWorkers(connection);
    
  } catch (error) {
    logger.info('Redis not available, using memory queue processing', { 
      error: error.message 
    });
    // Memory queues handle their own processing
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

  // Journal Analysis Worker
  const journalWorker = new Worker('journalQueue', async (job: any) => {
  const { userId, journalText, entryId } = job.data;
  
  logger.info('Processing journal analysis job', { 
    jobId: job.id, 
    userId, 
    textLength: journalText.length 
  });

  try {
    // Check token limits
    const canMakeRequest = await tokenMonitor.canMakeRequest(userId, tokenMonitor.estimateTokens(journalText));
    if (!canMakeRequest) {
      throw new Error('User has exceeded monthly token limit');
    }

    // Generate AI insight with retry logic
    const response = await retryOpenAICall(
      () => openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a wise and compassionate journaling coach. Provide thoughtful, supportive insights that help users gain deeper self-understanding. Be warm, empathetic, and encouraging while offering meaningful reflections on their thoughts and experiences.'
          },
          {
            role: 'user',
            content: `Here's my journal entry: ${journalText}`
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      }),
      'journal-worker-analysis'
    );

    // Track token usage
    if (response.usage) {
      await tokenMonitor.trackUsage(userId, 'journal_analysis', response.usage);
    }

    const insight = response.choices[0].message.content || "Thank you for sharing your thoughts. Your reflection shows courage and self-awareness.";

    // Perform emotional analysis
    const emotionAnalysis = await analyzeEmotions(journalText);

    // Save insight to database
    if (entryId) {
      await storage.updateJournalEntry(entryId, {
        aiResponse: insight,
        emotionScore: emotionAnalysis.intensity,
        themes: emotionAnalysis.labels
      });
    }

    // Create emotional insight record
    await storage.createEmotionalInsight(userId, {
      period: 'daily',
      averageMood: Math.round(emotionAnalysis.intensity / 10),
      insights: [insight],
      emotionalPatterns: emotionAnalysis.labels,
      recommendations: getEmotionRecommendations(emotionAnalysis.primary, emotionAnalysis.intensity)
    });

    logger.info('Journal analysis completed', {
      jobId: job.id,
      userId,
      emotionScore: emotionAnalysis.intensity
    });

    return {
      insight,
      emotionAnalysis,
      processed: true,
      timestamp: new Date()
    };

  } catch (error: any) {
    captureError(error, {
      userId,
      operation: 'journal_worker_analysis',
      jobId: job.id
    });

    logger.error('Journal analysis job failed', {
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