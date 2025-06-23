// Redis failsafe utilities to prevent deployment failures
import { logger } from './logger';

// Suppress Redis connection errors during deployment
export function suppressRedisErrors() {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (message.includes('Redis') || message.includes('ECONNREFUSED') || message.includes('127.0.0.1:6379')) {
      logger.warn('Redis error suppressed during deployment:', message);
      return;
    }
    originalConsoleError.apply(console, args);
  };
  
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (message.includes('Redis') && message.includes('connection')) {
      logger.info('Redis warning suppressed during deployment:', message);
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
}

// Create a Redis connection wrapper that never throws
export function createSafeRedisWrapper(originalRedis: any) {
  if (!originalRedis) return null;
  
  return new Proxy(originalRedis, {
    get(target, prop) {
      const value = target[prop];
      if (typeof value === 'function') {
        return async (...args: any[]) => {
          try {
            const result = await value.apply(target, args);
            return result;
          } catch (error) {
            logger.warn(`Redis operation ${String(prop)} failed, using fallback:`, error.message);
            return null;
          }
        };
      }
      return value;
    }
  });
}

// Environment-specific Redis configuration
export function getRedisConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasRedisUrl = !!process.env.REDIS_URL;
  
  if (!hasRedisUrl) {
    logger.info('No REDIS_URL configured - running in memory-only mode');
    return null;
  }
  
  return {
    url: process.env.REDIS_URL,
    config: {
      connectTimeout: isProduction ? 5000 : 2000,
      commandTimeout: isProduction ? 5000 : 2000,
      maxRetriesPerRequest: 0, // Never retry to fail fast
      lazyConnect: true,
      enableOfflineQueue: false,
      retryDelayOnFailover: 100,
      maxLoadingTimeout: isProduction ? 5000 : 2000,
    }
  };
}