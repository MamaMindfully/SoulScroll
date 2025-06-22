import { logger } from '../utils/logger';

// Always use memory-based queues in development for stability
let journalQueue: any;
let emotionQueue: any;
let insightQueue: any;

// Environment check for Redis availability
const REDIS_ENABLED = process.env.REDIS_URL || process.env.NODE_ENV === 'production';

async function initializeQueues() {
  if (!REDIS_ENABLED) {
    // Use memory-based queues for development
    logger.info('Using memory-based queues for development');
    const memoryQueues = await import('./memoryQueue');
    journalQueue = memoryQueues.journalQueue;
    emotionQueue = memoryQueues.emotionQueue;
    insightQueue = memoryQueues.insightQueue;
    return;
  }

  try {
    // Try BullMQ with Redis for production
    const { Queue } = await import('bullmq');
    const Redis = (await import('ioredis')).default;
    
    const connection = new Redis(process.env.REDIS_URL || {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      connectTimeout: 10000,
      lazyConnect: true,
    });

    // Test connection
    await connection.ping();
    
    const queueOptions = {
      connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    };

    journalQueue = new Queue('journalBundle', queueOptions);
    emotionQueue = new Queue('emotionQueue', queueOptions);
    insightQueue = new Queue('insightQueue', queueOptions);

    logger.info('BullMQ queues initialized with Redis', {
      queues: ['journalBundle', 'emotionQueue', 'insightQueue']
    });

  } catch (error) {
    // Fallback to memory-based queues
    logger.warn('Redis connection failed, using memory-based queues', { 
      error: error.message 
    });
    
    const memoryQueues = await import('./memoryQueue');
    journalQueue = memoryQueues.journalQueue;
    emotionQueue = memoryQueues.emotionQueue;
    insightQueue = memoryQueues.insightQueue;
  }
}

// Initialize queues
initializeQueues().catch(error => {
  logger.error('Failed to initialize queues', { error: error.message });
});

export { journalQueue, emotionQueue, insightQueue };