import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { aiJournalEngine } from '../engines/aiJournalEngine';
import { storage } from '../storage';

interface QueueJob {
  id: string;
  userId: string;
  type: 'ai_analysis' | 'emotion_score' | 'batch_analysis';
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

class QueueService extends EventEmitter {
  private jobs: Map<string, QueueJob> = new Map();
  private processing: boolean = false;
  private concurrency: number = 3; // Process 3 jobs concurrently
  private activeJobs: Set<string> = new Set();

  constructor() {
    super();
    this.startProcessor();
    logger.info('Queue service initialized');
  }

  // Add job to queue
  async addJob(
    userId: string, 
    type: QueueJob['type'], 
    data: any, 
    maxRetries: number = 3
  ): Promise<string> {
    const jobId = `${type}_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: QueueJob = {
      id: jobId,
      userId,
      type,
      data,
      status: 'pending',
      createdAt: new Date(),
      retryCount: 0,
      maxRetries
    };

    this.jobs.set(jobId, job);
    
    logger.info('Job added to queue', { 
      jobId, 
      userId, 
      type, 
      queueSize: this.jobs.size 
    });

    this.emit('jobAdded', job);
    this.processJobs();
    
    return jobId;
  }

  // Get job status
  getJobStatus(jobId: string): QueueJob | null {
    return this.jobs.get(jobId) || null;
  }

  // Get user's jobs
  getUserJobs(userId: string): QueueJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Start job processor
  private startProcessor(): void {
    setInterval(() => {
      this.processJobs();
    }, 2000); // Process jobs every 2 seconds
  }

  // Process pending jobs
  private async processJobs(): Promise<void> {
    if (this.processing || this.activeJobs.size >= this.concurrency) {
      return;
    }

    const pendingJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'pending')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, this.concurrency - this.activeJobs.size);

    if (pendingJobs.length === 0) {
      return;
    }

    for (const job of pendingJobs) {
      this.processJob(job);
    }
  }

  // Process individual job
  private async processJob(job: QueueJob): Promise<void> {
    if (this.activeJobs.has(job.id)) {
      return;
    }

    this.activeJobs.add(job.id);
    job.status = 'processing';
    job.startedAt = new Date();

    logger.info('Processing job', { 
      jobId: job.id, 
      type: job.type, 
      userId: job.userId 
    });

    this.emit('jobStarted', job);

    try {
      let result;

      switch (job.type) {
        case 'ai_analysis':
          result = await this.processAIAnalysis(job);
          break;
        case 'emotion_score':
          result = await this.processEmotionScore(job);
          break;
        case 'batch_analysis':
          result = await this.processBatchAnalysis(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;

      logger.info('Job completed', { 
        jobId: job.id, 
        type: job.type, 
        duration: job.completedAt.getTime() - job.startedAt!.getTime() 
      });

      this.emit('jobCompleted', job);

    } catch (error: any) {
      job.retryCount++;
      
      if (job.retryCount >= job.maxRetries) {
        job.status = 'failed';
        job.error = error.message;
        job.completedAt = new Date();

        logger.error('Job failed permanently', { 
          jobId: job.id, 
          type: job.type, 
          error: error.message,
          retryCount: job.retryCount 
        });

        this.emit('jobFailed', job);
      } else {
        job.status = 'pending';
        
        logger.warn('Job failed, will retry', { 
          jobId: job.id, 
          type: job.type, 
          error: error.message,
          retryCount: job.retryCount,
          maxRetries: job.maxRetries 
        });

        this.emit('jobRetry', job);
      }
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  // Process AI analysis job
  private async processAIAnalysis(job: QueueJob): Promise<any> {
    const { content, userId, entryId } = job.data;
    
    // Get recent entries for context
    const recentEntries = await storage.getJournalEntries(userId, 5, 0);
    
    // Perform AI analysis
    const analysis = await aiJournalEngine.analyzeJournalEntry(content, userId);
    const emotions = await aiJournalEngine.detectEmotions(content);
    const reflection = await aiJournalEngine.generatePersonalizedReflection(
      content, 
      userId, 
      recentEntries
    );
    const insights = await aiJournalEngine.scoreInsightDepth(content);

    // Update entry with AI analysis
    if (entryId) {
      await storage.updateJournalEntry(entryId, {
        aiResponse: reflection,
        emotionScore: emotions.intensity,
        themes: analysis.themes,
        insights: analysis.insights
      });
    }

    // Create emotional insight record
    await storage.createEmotionalInsight(userId, {
      period: 'daily',
      averageMood: Math.round(emotions.intensity / 10),
      insights: analysis.insights,
      emotionalPatterns: analysis.themes,
      recommendations: analysis.suggestions
    });

    return {
      analysis,
      emotions,
      reflection,
      insights
    };
  }

  // Process emotion score job
  private async processEmotionScore(job: QueueJob): Promise<any> {
    const { journalText, userId } = job.data;
    
    // This would call the emotion scoring logic
    // Implementation would be similar to the emotion score route
    
    return {
      emotion: 'processed',
      intensity: 50,
      timestamp: new Date()
    };
  }

  // Process batch analysis job
  private async processBatchAnalysis(job: QueueJob): Promise<any> {
    const { entries, userId } = job.data;
    
    const results = [];
    for (const entry of entries.slice(0, 10)) { // Limit to 10 entries
      try {
        const emotions = await aiJournalEngine.detectEmotions(entry);
        results.push({
          text: entry.substring(0, 100) + '...',
          emotionScore: emotions.intensity,
          emotionLabels: [emotions.primary],
          wordCount: entry.split(/\s+/).length
        });
      } catch (error) {
        results.push({
          text: entry.substring(0, 100) + '...',
          error: 'Analysis failed',
          emotionScore: 5,
          emotionLabels: ['unknown'],
          wordCount: 0
        });
      }
    }

    return {
      results,
      summary: {
        totalEntries: results.length,
        averageEmotionScore: results.reduce((sum, r) => sum + r.emotionScore, 0) / results.length,
        totalWords: results.reduce((sum, r) => sum + r.wordCount, 0)
      }
    };
  }

  // Clean up old jobs (call this periodically)
  cleanupOldJobs(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAge);
    let cleaned = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.createdAt < cutoff && ['completed', 'failed'].includes(job.status)) {
        this.jobs.delete(jobId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cleaned up old jobs', { cleaned, remaining: this.jobs.size });
    }
  }

  // Get queue statistics
  getStats() {
    const jobs = Array.from(this.jobs.values());
    
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      activeJobs: this.activeJobs.size,
      concurrency: this.concurrency
    };
  }
}

export const queueService = new QueueService();

// Cleanup old jobs every hour
setInterval(() => {
  queueService.cleanupOldJobs();
}, 60 * 60 * 1000);