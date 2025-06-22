import { logger } from '../utils/logger';
import { cacheService } from './cacheService';
import { errorHandler } from '../utils/errorHandler';

interface TokenUsage {
  userId: string;
  operation: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  timestamp: Date;
}

interface UserTokenStats {
  dailyUsage: number;
  monthlyUsage: number;
  totalCost: number;
  lastReset: Date;
}

class TokenMonitorService {
  private readonly MONTHLY_FREE_LIMIT = 10000; // 10K tokens per month for free users
  private readonly MONTHLY_PREMIUM_LIMIT = 100000; // 100K tokens per month for premium users
  private readonly COST_PER_TOKEN = 0.000002; // Approximate cost per token for GPT-4

  // Track token usage for a request
  async trackUsage(
    userId: string,
    operation: string,
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    }
  ): Promise<void> {
    const tokenUsage: TokenUsage = {
      userId,
      operation,
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      cost: usage.total_tokens * this.COST_PER_TOKEN,
      timestamp: new Date()
    };

    // Update cache
    await cacheService.trackTokenUsage(userId, usage.total_tokens);

    // Log usage
    logger.info('Token usage tracked', {
      userId,
      operation,
      totalTokens: usage.total_tokens,
      cost: tokenUsage.cost.toFixed(6)
    });

    // Check if user is approaching limits
    await this.checkUsageLimits(userId, tokenUsage);

    // Store in database for long-term tracking
    // await this.storeUsageInDB(tokenUsage);
  }

  // Check if user has exceeded usage limits
  async checkUsageLimits(userId: string, currentUsage: TokenUsage): Promise<void> {
    const stats = await this.getUserStats(userId);
    const userSubscription = await this.getUserSubscriptionStatus(userId);
    
    const limit = userSubscription === 'premium' 
      ? this.MONTHLY_PREMIUM_LIMIT 
      : this.MONTHLY_FREE_LIMIT;

    const usagePercentage = (stats.monthlyUsage / limit) * 100;

    // Warn at 80% usage
    if (usagePercentage >= 80 && usagePercentage < 100) {
      await this.sendUsageWarning(userId, usagePercentage, limit, userSubscription);
    }

    // Block at 100% usage for free users
    if (usagePercentage >= 100 && userSubscription === 'free') {
      await this.sendUsageLimitReached(userId, limit);
      throw new Error('Monthly token limit exceeded. Please upgrade to Premium for higher limits.');
    }

    // Alert at 100% for premium users but don't block
    if (usagePercentage >= 100 && userSubscription === 'premium') {
      await this.sendPremiumUsageAlert(userId, stats.monthlyUsage, limit);
    }
  }

  // Get user's token usage statistics
  async getUserStats(userId: string): Promise<UserTokenStats> {
    const dailyUsage = await cacheService.getUserTokenUsage(userId);
    
    // In a real implementation, you'd query the database for monthly usage
    const monthlyUsage = dailyUsage * 5; // Rough estimate
    const totalCost = monthlyUsage * this.COST_PER_TOKEN;

    return {
      dailyUsage,
      monthlyUsage,
      totalCost,
      lastReset: new Date()
    };
  }

  // Check if user can make a request based on token limits
  async canMakeRequest(userId: string, estimatedTokens: number = 1000): Promise<boolean> {
    try {
      const stats = await this.getUserStats(userId);
      const userSubscription = await this.getUserSubscriptionStatus(userId);
      
      const limit = userSubscription === 'premium' 
        ? this.MONTHLY_PREMIUM_LIMIT 
        : this.MONTHLY_FREE_LIMIT;

      return (stats.monthlyUsage + estimatedTokens) <= limit;
    } catch (error) {
      // If we can't check limits, allow the request but log the error
      logger.error('Failed to check token limits', { userId, error: error.message });
      return true;
    }
  }

  // Get user's subscription status (would integrate with your user service)
  private async getUserSubscriptionStatus(userId: string): Promise<'free' | 'premium'> {
    // This would query your database to get the user's subscription status
    // For now, return 'free' as default
    return 'free';
  }

  // Send usage warning to user
  private async sendUsageWarning(
    userId: string, 
    usagePercentage: number, 
    limit: number,
    subscription: string
  ): Promise<void> {
    logger.warn('User approaching token limit', {
      userId,
      usagePercentage: usagePercentage.toFixed(1),
      limit,
      subscription
    });

    // Send notification to user (email, in-app notification, etc.)
    // await notificationService.sendUsageWarning(userId, usagePercentage, limit);
  }

  // Send usage limit reached notification
  private async sendUsageLimitReached(userId: string, limit: number): Promise<void> {
    logger.error('User exceeded token limit', { userId, limit });

    // Send notification about limit reached
    // await notificationService.sendLimitReached(userId, limit);
  }

  // Send premium usage alert
  private async sendPremiumUsageAlert(
    userId: string, 
    usage: number, 
    limit: number
  ): Promise<void> {
    logger.warn('Premium user exceeded normal limit', { userId, usage, limit });

    // Send notification to premium user
    // await notificationService.sendPremiumAlert(userId, usage, limit);
  }

  // Get token usage analytics
  async getUsageAnalytics(timeframe: string = '30d'): Promise<any> {
    // This would query usage data from the database
    return {
      timeframe,
      totalTokensUsed: 0,
      totalCost: 0,
      topUsers: [],
      topOperations: [],
      costTrends: []
    };
  }

  // Estimate tokens for text (rough approximation)
  estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  // Estimate cost for operation
  estimateCost(tokens: number): number {
    return tokens * this.COST_PER_TOKEN;
  }

  // Get usage summary for user
  async getUserUsageSummary(userId: string): Promise<any> {
    const stats = await this.getUserStats(userId);
    const subscription = await this.getUserSubscriptionStatus(userId);
    const limit = subscription === 'premium' ? this.MONTHLY_PREMIUM_LIMIT : this.MONTHLY_FREE_LIMIT;

    return {
      subscription,
      dailyUsage: stats.dailyUsage,
      monthlyUsage: stats.monthlyUsage,
      monthlyLimit: limit,
      usagePercentage: (stats.monthlyUsage / limit) * 100,
      estimatedMonthlyCost: stats.totalCost,
      canMakeRequests: await this.canMakeRequest(userId),
      recommendUpgrade: subscription === 'free' && stats.monthlyUsage > limit * 0.8
    };
  }
}

export const tokenMonitor = new TokenMonitorService();