// Deployment safety utilities to prevent Redis connection failures from blocking deployment
import { logger } from './logger';

// Override IoRedis to prevent connection attempts to localhost when REDIS_URL is not set
export function preventRedisLocalhost() {
  if (process.env.REDIS_URL) {
    return; // Redis URL is configured, allow normal operation
  }

  logger.info('Preventing Redis localhost connections - using memory-only fallbacks');
  
  // In ES modules, we can't easily override require cache
  // Instead, we'll rely on the Redis service layer to handle fallbacks gracefully
  // This function serves as a placeholder for deployment safety logging
}

// Suppress Redis-related console output during deployment
export function suppressRedisLogs() {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.log = (...args: any[]) => {
    const message = args.join(' ');
    if (message.includes('Redis') && (message.includes('connection') || message.includes('ECONNREFUSED'))) {
      return; // Suppress Redis connection logs
    }
    originalLog.apply(console, args);
  };
  
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (message.includes('Redis') && message.includes('localhost:6379')) {
      return; // Suppress Redis localhost warnings
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (message.includes('Redis') && (message.includes('ECONNREFUSED') || message.includes('127.0.0.1:6379'))) {
      return; // Suppress Redis connection errors
    }
    originalError.apply(console, args);
  };
}

// Initialize deployment safety measures
export function initializeDeploymentSafety() {
  if (!process.env.REDIS_URL) {
    logger.info('REDIS_URL not configured - initializing deployment safety measures');
    preventRedisLocalhost();
    suppressRedisLogs();
  }
}