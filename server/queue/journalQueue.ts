import { logger } from '../utils/logger';

// Conditional queue system - use BullMQ if Redis available, fallback to memory
let journalQueue: any;
let emotionQueue: any;
let insightQueue: any;

async function initializeQueues() {
  try {
    // Try to use BullMQ with Redis first
    const { Queue } = await import('bullmq');
    const Redis = (await import('ioredis')).default;
    
    const connection = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 1,
      retryDelayOnFailover: 100,
      connectTimeout: 5000,
      enableOfflineQueue: false,
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

    journalQueue = new Queue('journalQueue', queueOptions);
    emotionQueue = new Queue('emotionQueue', queueOptions);
    insightQueue = new Queue('insightQueue', queueOptions);

    logger.info('BullMQ queues initialized with Redis', {
      queues: ['journalQueue', 'emotionQueue', 'insightQueue']
    });

  } catch (error) {
    // Fallback to memory-based queues
    logger.warn('Redis not available, using memory-based queues', { 
      error: error.message 
    });
    
    const memoryQueues = await import('./memoryQueue');
    journalQueue = memoryQueues.journalQueue;
    emotionQueue = memoryQueues.emotionQueue;
    insightQueue = memoryQueues.insightQueue;
  }
}

// Initialize queues immediately
initializeQueues().catch(error => {
  logger.error('Failed to initialize queues', { error: error.message });
});

export { journalQueue, emotionQueue, insightQueue };