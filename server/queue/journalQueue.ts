import { logger } from '../utils/logger';

// Always use memory-based queues in development for stability
let journalQueue: any;
let emotionQueue: any;
let insightQueue: any;

// Environment check for Redis availability
async function initializeQueues() {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    // Use memory-based queues when Redis is not available
    logger.info('REDIS_URL not configured. Using memory-based queues for deployment.');
    const memoryQueues = await import('./memoryQueue');
    journalQueue = memoryQueues.journalQueue;
    emotionQueue = memoryQueues.emotionQueue;
    insightQueue = memoryQueues.insightQueue;
    return;
  }

  try {
    // Try BullMQ with Redis when available
    const { Queue } = await import('bullmq');
    const Redis = (await import('ioredis')).default;
    
    const connection = new Redis(redisUrl, {
      connectTimeout: 2000, // Very short timeout
      commandTimeout: 2000,
      maxRetriesPerRequest: 0, // Disable all retries
      lazyConnect: true,
      enableOfflineQueue: false, // Don't queue commands when offline
    });

    // Test connection with very short timeout
    const connectPromise = connection.ping();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Redis connection timeout')), 2000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    logger.info('Redis connection established for queues.');
    
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