import { apiRequest } from '@/lib/queryClient';
import { addBreadcrumb } from '@/utils/sentry';

interface BatchItem {
  id: string;
  data: any;
  timestamp: Date;
  retries: number;
}

interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number; // milliseconds
  maxRetries: number;
  endpoint: string;
}

class BatchProcessor {
  private queue: Map<string, BatchItem[]> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private processing: Set<string> = new Set();

  // Add item to batch queue
  addToBatch(
    batchKey: string, 
    data: any, 
    config: BatchConfig
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const item: BatchItem = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data: { ...data, resolve, reject },
        timestamp: new Date(),
        retries: 0
      };

      // Initialize queue for this batch key if needed
      if (!this.queue.has(batchKey)) {
        this.queue.set(batchKey, []);
      }

      const batch = this.queue.get(batchKey)!;
      batch.push(item);

      addBreadcrumb('Item added to batch', 'batch', {
        batchKey,
        batchSize: batch.length,
        maxSize: config.maxBatchSize
      });

      // Process immediately if batch is full
      if (batch.length >= config.maxBatchSize) {
        this.processBatch(batchKey, config);
      } else {
        // Set timer to process batch after wait time
        this.setProcessTimer(batchKey, config);
      }
    });
  }

  // Set timer for batch processing
  private setProcessTimer(batchKey: string, config: BatchConfig): void {
    // Clear existing timer
    const existingTimer = this.timers.get(batchKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.processBatch(batchKey, config);
    }, config.maxWaitTime);

    this.timers.set(batchKey, timer);
  }

  // Process batch of items
  private async processBatch(batchKey: string, config: BatchConfig): Promise<void> {
    // Prevent concurrent processing of same batch
    if (this.processing.has(batchKey)) {
      return;
    }

    const batch = this.queue.get(batchKey);
    if (!batch || batch.length === 0) {
      return;
    }

    this.processing.add(batchKey);

    // Clear timer
    const timer = this.timers.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(batchKey);
    }

    // Remove items from queue
    this.queue.set(batchKey, []);

    addBreadcrumb('Processing batch', 'batch', {
      batchKey,
      itemCount: batch.length,
      endpoint: config.endpoint
    });

    try {
      // Prepare batch data
      const batchData = batch.map(item => ({
        id: item.id,
        ...item.data
      }));

      // Remove resolve/reject functions from data
      const cleanBatchData = batchData.map(({ resolve, reject, ...data }) => data);

      // Send batch request
      const response = await apiRequest('POST', config.endpoint, {
        items: cleanBatchData,
        batchId: `${batchKey}_${Date.now()}`
      });

      if (!response.ok) {
        throw new Error(`Batch request failed: ${response.status}`);
      }

      const results = await response.json();

      // Resolve individual promises
      batch.forEach((item, index) => {
        const result = results.items?.[index] || results;
        item.data.resolve(result);
      });

      addBreadcrumb('Batch processed successfully', 'batch', {
        batchKey,
        itemCount: batch.length
      });

    } catch (error: any) {
      console.error('Batch processing failed:', error);

      // Handle failed items
      await this.handleFailedBatch(batch, config, batchKey, error);
    } finally {
      this.processing.delete(batchKey);
    }
  }

  // Handle failed batch processing
  private async handleFailedBatch(
    batch: BatchItem[], 
    config: BatchConfig, 
    batchKey: string, 
    error: Error
  ): Promise<void> {
    const retryableItems: BatchItem[] = [];

    batch.forEach(item => {
      item.retries++;

      if (item.retries <= config.maxRetries) {
        retryableItems.push(item);
      } else {
        // Reject items that exceeded retry limit
        item.data.reject(new Error(`Batch processing failed after ${config.maxRetries} retries: ${error.message}`));
      }
    });

    // Re-queue retryable items
    if (retryableItems.length > 0) {
      const existingQueue = this.queue.get(batchKey) || [];
      this.queue.set(batchKey, [...existingQueue, ...retryableItems]);

      addBreadcrumb('Batch items re-queued for retry', 'batch', {
        batchKey,
        retryCount: retryableItems.length,
        failedCount: batch.length - retryableItems.length
      });

      // Schedule retry with exponential backoff
      const backoffDelay = Math.min(config.maxWaitTime * Math.pow(2, retryableItems[0].retries), 30000);
      setTimeout(() => {
        this.processBatch(batchKey, config);
      }, backoffDelay);
    }
  }

  // Get queue statistics
  getStats(): any {
    const stats = {};
    
    for (const [batchKey, items] of this.queue.entries()) {
      stats[batchKey] = {
        queueSize: items.length,
        oldestItem: items.length > 0 ? items[0].timestamp : null,
        isProcessing: this.processing.has(batchKey),
        hasTimer: this.timers.has(batchKey)
      };
    }

    return stats;
  }

  // Clear all queues
  clearAll(): void {
    this.queue.clear();
    
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    
    this.processing.clear();
  }
}

// Create singleton instance
export const batchProcessor = new BatchProcessor();

// Specific batch processors for different operations

export class JournalBatchProcessor {
  private static readonly CONFIG: BatchConfig = {
    maxBatchSize: 5,
    maxWaitTime: 10000, // 10 seconds
    maxRetries: 3,
    endpoint: '/api/journal/batch'
  };

  static async addJournalEntry(entryData: any): Promise<any> {
    return batchProcessor.addToBatch('journal_entries', entryData, this.CONFIG);
  }
}

export class EmotionBatchProcessor {
  private static readonly CONFIG: BatchConfig = {
    maxBatchSize: 10,
    maxWaitTime: 15000, // 15 seconds
    maxRetries: 2,
    endpoint: '/api/emotion-score/batch'
  };

  static async analyzeEmotion(textData: any): Promise<any> {
    return batchProcessor.addToBatch('emotion_analysis', textData, this.CONFIG);
  }
}

export class InsightBatchProcessor {
  private static readonly CONFIG: BatchConfig = {
    maxBatchSize: 3,
    maxWaitTime: 20000, // 20 seconds
    maxRetries: 2,
    endpoint: '/api/ai/journal/batch'
  };

  static async generateInsight(journalData: any): Promise<any> {
    return batchProcessor.addToBatch('ai_insights', journalData, this.CONFIG);
  }
}

// Utility function to get all batch statistics
export function getBatchStats(): any {
  return {
    ...batchProcessor.getStats(),
    lastUpdated: new Date()
  };
}