import Redis from 'ioredis';
import { getRedisConfig, suppressRedisErrors } from '../utils/redisFailsafe';

// Suppress Redis errors during startup
if (process.env.NODE_ENV === 'production') {
  suppressRedisErrors();
}

let redis: Redis | null = null;
const fallbackCache: Record<string, any> = {};

// Initialize Redis connection with robust fallback
async function initializeRedis() {
  try {
    const redisConfig = getRedisConfig();
    
    if (!redisConfig) {
      logger.info('Redis service running in fallback mode with in-memory cache.');
      return null;
    }
    
    const redisClient = new Redis(redisConfig.url, {
      ...redisConfig.config,
      tls: redisConfig.url.startsWith('rediss://') ? {
        rejectUnauthorized: false
      } : undefined
    });
    
    // Test connection with timeout
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Redis connection timeout')), redisConfig.config.connectTimeout)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    
    redisClient.on('connect', () => {
      logger.info('Redis connection established successfully.');
    });
    
    redisClient.on('error', (err) => {
      logger.warn('Redis connection error, using fallback cache:', err.message);
      // Don't throw here, let operations handle individual failures
    });

    redisClient.on('ready', () => {
      console.log('Redis client ready for operations.');
    });
    
    // Test with a simple ping
    await redisClient.ping();
    console.log('Redis ping successful.');
    
    return redisClient;
  } catch (error) {
    console.warn('Redis initialization failed, using fallback in-memory cache:', error.message);
    return null;
  }
}

// Initialize with proper error handling and timeout
let initializationPromise = Promise.race([
  initializeRedis(),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Redis initialization timeout')), 3000)
  )
])
  .then(client => {
    redis = client;
    if (!redis) {
      console.log('Redis service running in fallback mode with in-memory cache.');
    }
    return client;
  })
  .catch(error => {
    console.warn('Redis initialization failed, using fallback mode:', error.message);
    redis = null;
    return null;
  });

// Export initialization promise for health checks
export const redisInitialization = initializationPromise;

export class RedisService {
  // Service worker version management
  async setServiceWorkerVersion(version: string): Promise<void> {
    await this.setCache('sw:version', version, 3600); // 1 hour TTL
  }

  async getServiceWorkerVersion(): Promise<string | null> {
    return await this.getCache('sw:version');
  }

  async setDeploymentTimestamp(): Promise<void> {
    const timestamp = Date.now().toString();
    await this.setCache('sw:deployment', timestamp, 86400); // 24 hours TTL
  }

  async getLastDeploymentTimestamp(): Promise<string | null> {
    return await this.getCache('sw:deployment');
  }

  // Generic cache operations with fallback
  async getCache(key: string): Promise<any> {
    if (redis) {
      try {
        const value = await redis.get(key);
        return value ? JSON.parse(value) : null;
      } catch (err) {
        console.error('Redis get failed. Using fallback cache:', err);
        return fallbackCache[key] || null;
      }
    } else {
      return fallbackCache[key] || null;
    }
  }

  async setCache(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    
    if (redis) {
      try {
        if (ttlSeconds) {
          await redis.setex(key, ttlSeconds, serializedValue);
        } else {
          await redis.set(key, serializedValue);
        }
      } catch (err) {
        console.error('Redis set failed. Using fallback cache:', err);
        fallbackCache[key] = value;
        
        // Optional: Set timeout for fallback cache TTL
        if (ttlSeconds) {
          setTimeout(() => {
            delete fallbackCache[key];
          }, ttlSeconds * 1000);
        }
      }
    } else {
      fallbackCache[key] = value;
      
      // Optional: Set timeout for fallback cache TTL
      if (ttlSeconds) {
        setTimeout(() => {
          delete fallbackCache[key];
        }, ttlSeconds * 1000);
      }
    }
  }

  async deleteCache(key: string): Promise<void> {
    if (redis) {
      try {
        await redis.del(key);
      } catch (err) {
        console.error('Redis delete failed:', err);
      }
    }
    delete fallbackCache[key];
  }

  async exists(key: string): Promise<boolean> {
    if (redis) {
      try {
        const result = await redis.exists(key);
        return result === 1;
      } catch (err) {
        console.error('Redis exists check failed:', err);
        return key in fallbackCache;
      }
    } else {
      return key in fallbackCache;
    }
  }

  // Health check with timeout
  async ping(): Promise<boolean> {
    if (!redis) {
      return false;
    }
    
    try {
      const pingPromise = redis.ping();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis ping timeout')), 1000)
      );
      
      const result = await Promise.race([pingPromise, timeoutPromise]);
      return result === 'PONG';
    } catch (err) {
      console.error('Redis ping failed:', err.message);
      return false;
    }
  }

  // Cleanup
  async disconnect(): Promise<void> {
    if (redis) {
      try {
        await redis.quit();
        console.log('Redis connection closed.');
      } catch (err) {
        console.error('Redis disconnect error:', err);
      }
    }
  }
}

export const redisService = new RedisService();