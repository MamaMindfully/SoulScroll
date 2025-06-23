import { logger } from './logger';
import { redisService } from '../services/redisService';

export class RedisHealthMonitor {
  private isHealthy: boolean = false;
  private lastCheck: Date = new Date();
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHealthMonitoring();
  }

  private startHealthMonitoring() {
    // Check Redis health every 30 seconds
    this.checkInterval = setInterval(async () => {
      await this.checkHealth();
    }, 30000);

    // Initial health check
    this.checkHealth();
  }

  private async checkHealth() {
    try {
      this.isHealthy = await redisService.ping();
      this.lastCheck = new Date();
      
      if (!this.isHealthy) {
        logger.warn('Redis health check failed, operating in fallback mode');
      }
    } catch (error) {
      this.isHealthy = false;
      logger.error('Redis health monitor error:', error);
    }
  }

  public getHealthStatus() {
    return {
      healthy: this.isHealthy,
      lastCheck: this.lastCheck,
      status: this.isHealthy ? 'connected' : 'fallback'
    };
  }

  public async forceHealthCheck(): Promise<boolean> {
    await this.checkHealth();
    return this.isHealthy;
  }

  public stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const redisHealthMonitor = new RedisHealthMonitor();