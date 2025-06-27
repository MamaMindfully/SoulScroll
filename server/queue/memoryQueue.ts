import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

interface Job {
  id: string;
  name: string;
  data: any;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
}

class MemoryQueue extends EventEmitter {
  private jobs: Map<string, Job> = new Map();
  private processing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(private name: string) {
    super();
    this.startProcessing();
  }

  async add(jobName: string, data: any, options: any = {}): Promise<Job> {
    const job: Job = {
      id: `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: jobName,
      data,
      status: 'waiting',
      progress: 0,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: options.attempts || 3
    };

    this.jobs.set(job.id, job);
    
    logger.info('Job added to memory queue', {
      queueName: this.name,
      jobId: job.id,
      jobName
    });

    return job;
  }

  async getJob(jobId: string): Promise<Job | null> {
    return this.jobs.get(jobId) || null;
  }

  async getJobs(states: string[]): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => 
      states.includes(job.status)
    );
  }

  private startProcessing() {
    if (this.processingInterval) return;

    this.processingInterval = setInterval(async () => {
      if (this.processing) return;

      const waitingJobs = Array.from(this.jobs.values())
        .filter(job => job.status === 'waiting')
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      if (waitingJobs.length === 0) return;

      this.processing = true;
      const job = waitingJobs[0];
      
      try {
        await this.processJob(job);
      } catch (error) {
        logger.error('Job processing error', { 
          jobId: job.id, 
          error: error.message 
        });
      } finally {
        this.processing = false;
      }
    }, 1000); // Process every second
  }

  private async processJob(job: Job) {
    job.status = 'active';
    job.attempts++;
    
    logger.info('Processing job', { 
      jobId: job.id, 
      jobName: job.name,
      attempt: job.attempts 
    });

    try {
      // Simulate processing based on job type
      let result;
      
      switch (job.name) {
        case 'journalBundle':
          result = await this.simulateJournalBundle(job);
          break;
        case 'analyze':
          result = await this.simulateJournalAnalysis(job);
          break;
        case 'score':
          result = await this.simulateEmotionScoring(job);
          break;
        case 'updateProgress':
          result = await this.simulateProgressUpdate(job);
          break;
        case 'checkRewards':
          result = await this.simulateRewardCheck(job);
          break;
        case 'updateMemoryLoop':
          result = await this.simulateMemoryUpdate(job);
          break;
        default:
          result = { processed: true, timestamp: new Date() };
      }

      job.status = 'completed';
      job.progress = 100;
      job.result = result;
      
      this.emit('completed', job, result);
      
      logger.info('Job completed', { 
        jobId: job.id, 
        jobName: job.name 
      });

    } catch (error) {
      job.error = error.message;
      
      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed';
        this.emit('failed', job, error);
        
        logger.error('Job failed permanently', { 
          jobId: job.id, 
          attempts: job.attempts,
          error: error.message 
        });
      } else {
        job.status = 'waiting'; // Retry
        
        logger.warn('Job failed, will retry', { 
          jobId: job.id, 
          attempts: job.attempts,
          maxAttempts: job.maxAttempts 
        });
      }
    }
  }

  private async simulateJournalBundle(job: Job): Promise<any> {
    const { entryText, userId } = job.data;
    
    // Simulate unified processing (like your example)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Simulate progress updates
    job.progress = 25;
    await new Promise(resolve => setTimeout(resolve, 1000));
    job.progress = 50;
    await new Promise(resolve => setTimeout(resolve, 1000));
    job.progress = 75;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const emotion = this.getRandomEmotion();
    const intensity = Math.floor(40 + Math.random() * 60);
    const insight = this.generateFallbackInsight(entryText);
    
    // Generate a simple echo for simulation
    const echo = this.generateFallbackEcho(insight);
    
    return {
      insight,
      emotion,
      intensity,
      wordCount: entryText.split(/\s+/).length,
      themes: this.extractThemes(entryText),
      echo,
      processed: true,
      timestamp: new Date()
    };
  }

  private async simulateJournalAnalysis(job: Job): Promise<any> {
    const { journalText } = job.data;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Simulate progress updates
    job.progress = 25;
    await new Promise(resolve => setTimeout(resolve, 1000));
    job.progress = 50;
    await new Promise(resolve => setTimeout(resolve, 1000));
    job.progress = 75;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      insight: this.generateFallbackInsight(journalText),
      wordCount: journalText.split(/\s+/).length,
      themes: this.extractThemes(journalText),
      processed: true,
      timestamp: new Date()
    };
  }

  private async simulateEmotionScoring(job: Job): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
    
    const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'calm', 'excitement'];
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    const intensity = Math.floor(40 + Math.random() * 60); // 40-100
    
    return {
      emotion,
      intensity,
      confidence: Math.floor(70 + Math.random() * 30),
      processed: true
    };
  }

  private async simulateProgressUpdate(job: Job): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      progressUpdated: true,
      streakMaintained: true,
      milestoneReached: Math.random() > 0.8,
      processed: true
    };
  }

  private async simulateRewardCheck(job: Job): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const hasNewReward = Math.random() > 0.7;
    
    return {
      rewardUnlocked: hasNewReward,
      rewardType: hasNewReward ? 'secret_scroll' : null,
      rewardTitle: hasNewReward ? 'Reflection Seeker' : null,
      processed: true
    };
  }

  private async simulateMemoryUpdate(job: Job): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      memoryPatternUpdated: true,
      newThemesDetected: ['resilience', 'growth'],
      memoryLoopStrength: Math.floor(60 + Math.random() * 40),
      processed: true
    };
  }

  private generateFallbackInsight(text: string): string {
    const insights = [
      "Your words reveal a deep capacity for reflection and growth.",
      "There's a beautiful honesty in how you express your thoughts.",
      "Your journal shows the courage it takes to face your inner world.",
      "The way you process experiences shows remarkable self-awareness.",
      "Your writing reveals patterns of resilience and adaptation.",
      "There's wisdom emerging from your willingness to explore difficult emotions.",
      "Your reflections show a mind actively engaged in personal growth."
    ];
    
    return insights[Math.floor(Math.random() * insights.length)];
  }

  private getRandomEmotion(): string {
    const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'calm', 'excitement', 'gratitude', 'hope'];
    return emotions[Math.floor(Math.random() * emotions.length)];
  }

  private extractThemes(text: string): string[] {
    const themes = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('grateful') || lowerText.includes('thankful')) themes.push('gratitude');
    if (lowerText.includes('worried') || lowerText.includes('anxious')) themes.push('anxiety');
    if (lowerText.includes('happy') || lowerText.includes('joy')) themes.push('joy');
    if (lowerText.includes('sad') || lowerText.includes('grief')) themes.push('sadness');
    if (lowerText.includes('change') || lowerText.includes('transition')) themes.push('transformation');
    if (lowerText.includes('love') || lowerText.includes('relationship')) themes.push('connection');
    if (lowerText.includes('work') || lowerText.includes('career')) themes.push('purpose');
    
    return themes.length > 0 ? themes : ['reflection', 'awareness'];
  }

  private generateFallbackEcho(insight: string): string {
    const echoes = [
      "Your words ripple through the quiet spaces of understanding.",
      "Each reflection builds upon the last, weaving patterns of growth.",
      "In the silence between thoughts, wisdom takes root.",
      "Your journey reveals itself one insight at a time.",
      "The echoes of your reflections whisper truths yet to be discovered.",
      "Memory holds your insights like seeds waiting to bloom.",
      "Your thoughts create gentle waves in the ocean of consciousness."
    ];
    
    return echoes[Math.floor(Math.random() * echoes.length)];
  }

  async close() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
}

// Create queue instances
export const journalQueue = new MemoryQueue('journal');
export const emotionQueue = new MemoryQueue('emotion');
export const insightQueue = new MemoryQueue('insight');

// Queue cleanup on process exit
process.on('SIGTERM', async () => {
  logger.info('Closing memory queues...');
  await Promise.all([
    journalQueue.close(),
    emotionQueue.close(),
    insightQueue.close()
  ]);
});

logger.info('Memory-based queues initialized for development', {
  queues: ['journalQueue', 'emotionQueue', 'insightQueue']
});