import { Queue, QueueOptions } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Redis connection for BullMQ
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
});

// Handle Redis connection events
connection.on('connect', () => {
  logger.info('Redis connected for BullMQ');
});

connection.on('error', (error) => {
  logger.error('Redis connection error', { error: error.message });
});

connection.on('close', () => {
  logger.warn('Redis connection closed');
});

// Queue configuration
const queueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Create queues
export const journalQueue = new Queue('journalQueue', queueOptions);
export const emotionQueue = new Queue('emotionQueue', queueOptions);
export const insightQueue = new Queue('insightQueue', queueOptions);

// Queue events
journalQueue.on('error', (error) => {
  logger.error('Journal queue error', { error: error.message });
});

emotionQueue.on('error', (error) => {
  logger.error('Emotion queue error', { error: error.message });
});

insightQueue.on('error', (error) => {
  logger.error('Insight queue error', { error: error.message });
});

// Queue cleanup on process exit
process.on('SIGTERM', async () => {
  logger.info('Closing BullMQ queues...');
  await Promise.all([
    journalQueue.close(),
    emotionQueue.close(),
    insightQueue.close(),
    connection.quit()
  ]);
});

logger.info('BullMQ queues initialized', {
  queues: ['journalQueue', 'emotionQueue', 'insightQueue']
});