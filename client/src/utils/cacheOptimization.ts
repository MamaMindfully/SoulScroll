// Cache optimization utilities

// Intelligent cache management
export class IntelligentCache {
  private cache = new Map<string, any>();
  private accessCounts = new Map<string, number>();
  private lastAccessed = new Map<string, number>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 200, ttl: number = 10 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key: string, value: any, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    // Clean expired entries first
    this.cleanExpired();
    
    // If cache is full, evict based on LFU + LRU algorithm
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUseful();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      priority,
      size: this.estimateSize(value)
    });
    
    this.accessCounts.set(key, 1);
    this.lastAccessed.set(key, Date.now());
  }

  get(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.delete(key);
      return null;
    }

    // Update access metrics
    this.accessCounts.set(key, (this.accessCounts.get(key) || 0) + 1);
    this.lastAccessed.set(key, Date.now());

    return entry.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.accessCounts.delete(key);
    this.lastAccessed.delete(key);
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.delete(key);
      }
    }
  }

  private evictLeastUseful(): void {
    let leastUsefulKey = '';
    let lowestScore = Infinity;

    for (const key of this.cache.keys()) {
      const accessCount = this.accessCounts.get(key) || 0;
      const lastAccess = this.lastAccessed.get(key) || 0;
      const entry = this.cache.get(key);
      
      // Calculate usefulness score
      const recency = Date.now() - lastAccess;
      const frequency = accessCount;
      const priorityWeight = entry.priority === 'high' ? 3 : entry.priority === 'medium' ? 2 : 1;
      
      const score = (frequency * priorityWeight) / (recency / 1000); // Frequency/Recency ratio
      
      if (score < lowestScore) {
        lowestScore = score;
        leastUsefulKey = key;
      }
    }

    if (leastUsefulKey) {
      this.delete(leastUsefulKey);
    }
  }

  private estimateSize(value: any): number {
    return JSON.stringify(value).length * 2; // Rough estimate in bytes
  }

  getStats(): { size: number; totalSize: number; hitRate: number } {
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
    
    return {
      size: this.cache.size,
      totalSize,
      hitRate: 0 // Would need to track hits/misses to calculate
    };
  }
}

// Global cache instances
export const apiCache = new IntelligentCache(100, 5 * 60 * 1000); // 5 minutes
export const imageCache = new IntelligentCache(50, 30 * 60 * 1000); // 30 minutes
export const userDataCache = new IntelligentCache(20, 60 * 60 * 1000); // 1 hour

// Cache-aware API request wrapper
export const cachedApiRequest = async (
  method: string,
  url: string,
  data?: any,
  cacheOptions?: { ttl?: number; priority?: 'high' | 'medium' | 'low' }
) => {
  const cacheKey = `${method}:${url}:${JSON.stringify(data)}`;
  
  // Try cache first for GET requests
  if (method === 'GET') {
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    // Make actual request
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Cache successful GET responses
    if (method === 'GET') {
      apiCache.set(cacheKey, result, cacheOptions?.priority);
    }

    return result;
  } catch (error) {
    // Try to return cached data on error for GET requests
    if (method === 'GET') {
      const cached = apiCache.get(cacheKey);
      if (cached) {
        console.warn('API request failed, using cached data:', error);
        return cached;
      }
    }
    throw error;
  }
};

// IndexedDB cache for large data
export class IndexedDBCache {
  private dbName: string;
  private version: number;
  private storeName: string;

  constructor(dbName: string = 'SoulScrollCache', version: number = 1, storeName: string = 'cache') {
    this.dbName = dbName;
    this.version = version;
    this.storeName = storeName;
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  async set(key: string, value: any, ttl: number = 24 * 60 * 60 * 1000): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    await store.put({
      key,
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  async get(key: string): Promise<any> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          resolve(null);
          return;
        }

        // Check if expired
        if (Date.now() - result.timestamp > result.ttl) {
          this.delete(key); // Clean up expired entry
          resolve(null);
          return;
        }

        resolve(result.value);
      };
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    await store.delete(key);
  }

  async clear(): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    await store.clear();
  }
}

// Global IndexedDB cache for large data
export const persistentCache = new IndexedDBCache();

// Cache warming strategies
export const warmupCache = async () => {
  // Preload critical data
  const criticalEndpoints = [
    '/api/prompts/daily',
    '/api/user/stats',
    '/api/user/premium-status'
  ];

  for (const endpoint of criticalEndpoints) {
    try {
      await cachedApiRequest('GET', endpoint, undefined, { priority: 'high' });
    } catch (error) {
      console.warn(`Failed to warmup cache for ${endpoint}:`, error);
    }
  }
};

// Cache monitoring and optimization
export const optimizeCache = () => {
  setInterval(() => {
    // Clean up caches
    [apiCache, imageCache, userDataCache].forEach(cache => {
      const stats = cache.getStats();
      console.log('Cache stats:', stats);
      
      // Clear cache if it's getting too large
      if (stats.totalSize > 10 * 1024 * 1024) { // 10MB
        console.log('Cache size exceeded, clearing...');
        // Could implement partial clearing here
      }
    });
  }, 60000); // Check every minute
};