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
      // Add timeout to prevent hanging
      const pingPromise = redisService.ping();
      const timeoutPromise = new Promise(resolve => 
        setTimeout(() => resolve(false), 2000)
      );
      
      this.isHealthy = await Promise.race([pingPromise, timeoutPromise]);
      this.lastCheck = new Date();
      
      if (!this.isHealthy) {
        logger.warn('Redis health check failed, operating in fallback mode');
      }
    } catch (error) {
      this.isHealthy = false;
      logger.warn('Redis health monitor error (non-critical):', error.message);
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