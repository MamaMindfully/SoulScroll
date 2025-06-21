// Memory management utilities for the journaling app

// Clean up old cache entries
export const cleanupCache = () => {
  const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    navigator.storage.estimate().then(estimate => {
      if (estimate.usage && estimate.usage > MAX_CACHE_SIZE) {
        console.log('Cache size exceeded, cleaning up...');
        
        // Clean up old service worker caches
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
              if (cacheName.includes('old') || cacheName.includes('v1.0.0')) {
                caches.delete(cacheName);
              }
            });
          });
        }
        
        // Clean up old localStorage entries
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('soulscroll-old-')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    });
  }
};

// Memory-efficient journal entry storage
export class JournalEntryCache {
  private static instance: JournalEntryCache;
  private entries = new Map<string, any>();
  private maxEntries = 100;
  private accessTimes = new Map<string, number>();

  static getInstance(): JournalEntryCache {
    if (!JournalEntryCache.instance) {
      JournalEntryCache.instance = new JournalEntryCache();
    }
    return JournalEntryCache.instance;
  }

  set(id: string, entry: any): void {
    // Remove oldest entries if cache is full
    if (this.entries.size >= this.maxEntries) {
      this.evictOldest();
    }
    
    this.entries.set(id, entry);
    this.accessTimes.set(id, Date.now());
  }

  get(id: string): any {
    const entry = this.entries.get(id);
    if (entry) {
      this.accessTimes.set(id, Date.now()); // Update access time
    }
    return entry;
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.entries.delete(oldestKey);
      this.accessTimes.delete(oldestKey);
    }
  }

  clear(): void {
    this.entries.clear();
    this.accessTimes.clear();
  }

  getSize(): number {
    return this.entries.size;
  }
}

// Image compression for user uploads
export const compressImage = (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          resolve(blob || file);
        },
        'image/jpeg',
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Memory monitoring
export const monitorMemory = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    
    const memoryInfo = {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
    };
    
    console.log('Memory usage:', memoryInfo);
    
    // Warn if memory usage is high
    if (memoryInfo.used / memoryInfo.limit > 0.8) {
      console.warn('High memory usage detected. Consider cleaning up resources.');
      cleanupCache();
    }
    
    return memoryInfo;
  }
  
  return null;
};

// Garbage collection helper for large objects
export const forceGarbageCollection = () => {
  // Force garbage collection in development
  if (process.env.NODE_ENV === 'development' && 'gc' in window) {
    (window as any).gc();
  }
};

// Resource cleanup on page unload
export const setupCleanupHandlers = () => {
  const cleanup = () => {
    JournalEntryCache.getInstance().clear();
    cleanupCache();
  };
  
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
  
  return cleanup;
};