import Redis from 'ioredis';

let redis: Redis | null = null;
const fallbackCache: Record<string, any> = {};

// Initialize Redis connection with robust fallback
async function initializeRedis() {
  try {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      console.log('REDIS_URL not configured. Using fallback in-memory cache for deployment.');
      return null;
    }
    
    const redisClient = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: null, // Disable retries to fail fast
      connectTimeout: 5000, // Reduced timeout
      commandTimeout: 3000,
      lazyConnect: true, // Don't connect immediately
      tls: redisUrl.startsWith('rediss://') ? {
        rejectUnauthorized: false
      } : undefined
    });
    
    // Test connection with timeout
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    
    redisClient.on('connect', () => {
      console.log('Redis connection established successfully.');
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err.message);
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

// Initialize with proper error handling
initializeRedis()
  .then(client => {
    redis = client;
    if (!redis) {
      console.log('Running in fallback mode with in-memory cache.');
    }
  })
  .catch(error => {
    console.error('Failed to initialize Redis service:', error);
    redis = null;
  });

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

  // Health check
  async ping(): Promise<boolean> {
    if (redis) {
      try {
        const result = await redis.ping();
        return result === 'PONG';
      } catch (err) {
        console.error('Redis ping failed:', err);
        return false;
      }
    }
    return false;
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