import { OpenAI } from "openai";
import { logger } from "../utils/logger";
import { auditService } from "./auditService";
import { cacheService } from "./cacheService";

interface SecurityValidationResult {
  isValid: boolean;
  reason?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number; // Estimated cost in USD
}

interface UserQuota {
  dailyLimit: number;
  monthlyLimit: number;
  dailyUsed: number;
  monthlyUsed: number;
  lastReset: Date;
  isPremium: boolean;
}

class OpenAISecurityService {
  private openai: OpenAI;
  private readonly maxPromptLength = 4000; // Character limit
  private readonly maxResponseTokens = 1000;
  
  // Pricing per 1K tokens (as of latest OpenAI pricing)
  private readonly pricing = {
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.001, output: 0.002 }
  };

  // Suspicious patterns that might indicate prompt injection
  private readonly suspiciousPatterns = [
    /system\s*[:=]\s*["']/i,
    /user\s*[:=]\s*["']/i,
    /assistant\s*[:=]\s*["']/i,
    /role\s*[:=]\s*["']/i,
    /ignore\s+previous\s+instructions/i,
    /pretend\s+you\s+are/i,
    /act\s+as\s+if/i,
    /forget\s+everything/i,
    /new\s+system\s+prompt/i,
    /override\s+your\s+instructions/i,
    /jailbreak/i,
    /\\n\\n/g, // Multiple newlines might be injection attempts
    /<\|.*?\|>/g, // Special tokens
    /```\s*system/i, // Code blocks with system
  ];

  // Banned content patterns
  private readonly bannedPatterns = [
    /generate\s+violent\s+content/i,
    /create\s+illegal\s+content/i,
    /hate\s+speech/i,
    /sexually\s+explicit/i,
    /personal\s+information\s+of\s+real\s+people/i,
  ];

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    
    this.openai = new OpenAI({ 
      apiKey,
      timeout: 30000, // 30 second timeout
      maxRetries: 2
    });
  }

  // Validate prompt for security issues
  validatePrompt(prompt: string, userId: string): SecurityValidationResult {
    try {
      // Basic validation
      if (!prompt || typeof prompt !== 'string') {
        return {
          isValid: false,
          reason: 'Invalid prompt format',
          riskLevel: 'medium'
        };
      }

      // Length validation
      if (prompt.length > this.maxPromptLength) {
        auditService.logSecurityEvent({
          userId,
          eventType: 'PROMPT_TOO_LONG',
          severity: 'MEDIUM',
          description: `Prompt length exceeded: ${prompt.length} characters`,
          metadata: { promptLength: prompt.length, maxLength: this.maxPromptLength }
        });

        return {
          isValid: false,
          reason: `Prompt too long (${prompt.length}/${this.maxPromptLength} characters)`,
          riskLevel: 'medium'
        };
      }

      // Check for suspicious patterns (prompt injection)
      for (const pattern of this.suspiciousPatterns) {
        if (pattern.test(prompt)) {
          auditService.logSecurityEvent({
            userId,
            eventType: 'SUSPICIOUS_PROMPT_PATTERN',
            severity: 'HIGH',
            description: 'Potential prompt injection attempt detected',
            metadata: { 
              pattern: pattern.toString(),
              promptPreview: prompt.substring(0, 100) + '...'
            }
          });

          return {
            isValid: false,
            reason: 'Prompt contains suspicious patterns',
            riskLevel: 'high'
          };
        }
      }

      // Check for banned content
      for (const pattern of this.bannedPatterns) {
        if (pattern.test(prompt)) {
          auditService.logSecurityEvent({
            userId,
            eventType: 'BANNED_CONTENT_ATTEMPT',
            severity: 'CRITICAL',
            description: 'Attempt to generate banned content',
            metadata: { 
              pattern: pattern.toString(),
              promptPreview: prompt.substring(0, 100) + '...'
            }
          });

          return {
            isValid: false,
            reason: 'Prompt contains banned content patterns',
            riskLevel: 'critical'
          };
        }
      }

      // Check for excessive repeated characters (spam/abuse)
      const repeatedCharPattern = /(.)\1{20,}/;
      if (repeatedCharPattern.test(prompt)) {
        return {
          isValid: false,
          reason: 'Prompt contains excessive repeated characters',
          riskLevel: 'medium'
        };
      }

      return {
        isValid: true,
        riskLevel: 'low'
      };
    } catch (error) {
      logger.error('Error validating prompt', { userId, error: error.message });
      return {
        isValid: false,
        reason: 'Prompt validation error',
        riskLevel: 'high'
      };
    }
  }

  // Get user's quota and usage
  async getUserQuota(userId: string, isPremium: boolean = false): Promise<UserQuota> {
    try {
      const cacheKey = `quota:${userId}`;
      const cached = await cacheService.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // Set quotas based on user type
      const dailyLimit = isPremium ? 1000 : 100; // Tokens in thousands
      const monthlyLimit = isPremium ? 30000 : 3000;

      const quota: UserQuota = {
        dailyLimit,
        monthlyLimit,
        dailyUsed: 0,
        monthlyUsed: 0,
        lastReset: new Date(),
        isPremium
      };

      // Cache for 1 hour
      await cacheService.set(cacheKey, JSON.stringify(quota), 3600);
      return quota;
    } catch (error) {
      logger.error('Error getting user quota', { userId, error: error.message });
      // Return conservative quota on error
      return {
        dailyLimit: isPremium ? 1000 : 100,
        monthlyLimit: isPremium ? 30000 : 3000,
        dailyUsed: 0,
        monthlyUsed: 0,
        lastReset: new Date(),
        isPremium
      };
    }
  }

  // Update user token usage
  async updateTokenUsage(userId: string, usage: TokenUsage): Promise<void> {
    try {
      const cacheKey = `quota:${userId}`;
      const quota = await this.getUserQuota(userId);
      
      // Reset daily counter if needed
      const now = new Date();
      const lastReset = new Date(quota.lastReset);
      if (now.getDate() !== lastReset.getDate()) {
        quota.dailyUsed = 0;
        quota.lastReset = now;
      }

      // Reset monthly counter if needed
      if (now.getMonth() !== lastReset.getMonth()) {
        quota.monthlyUsed = 0;
        quota.lastReset = now;
      }

      // Update usage
      quota.dailyUsed += Math.ceil(usage.totalTokens / 1000);
      quota.monthlyUsed += Math.ceil(usage.totalTokens / 1000);

      // Cache updated quota
      await cacheService.set(cacheKey, JSON.stringify(quota), 3600);

      // Log usage for monitoring
      auditService.logAuditEvent({
        userId,
        action: 'OPENAI_TOKEN_USAGE',
        metadata: {
          ...usage,
          dailyUsed: quota.dailyUsed,
          monthlyUsed: quota.monthlyUsed,
          dailyLimit: quota.dailyLimit,
          monthlyLimit: quota.monthlyLimit
        },
        severity: 'info'
      });
    } catch (error) {
      logger.error('Error updating token usage', { userId, error: error.message });
    }
  }

  // Check if user has exceeded quotas
  async checkQuotaExceeded(userId: string, isPremium: boolean = false): Promise<{ exceeded: boolean; reason?: string }> {
    try {
      const quota = await this.getUserQuota(userId, isPremium);
      
      if (quota.dailyUsed >= quota.dailyLimit) {
        return {
          exceeded: true,
          reason: `Daily quota exceeded (${quota.dailyUsed}/${quota.dailyLimit}k tokens)`
        };
      }

      if (quota.monthlyUsed >= quota.monthlyLimit) {
        return {
          exceeded: true,
          reason: `Monthly quota exceeded (${quota.monthlyUsed}/${quota.monthlyLimit}k tokens)`
        };
      }

      return { exceeded: false };
    } catch (error) {
      logger.error('Error checking quota', { userId, error: error.message });
      return { exceeded: true, reason: 'Quota check failed' };
    }
  }

  // Secure OpenAI API call with monitoring
  async secureChatCompletion(
    prompt: string,
    userId: string,
    model: 'gpt-4o' | 'gpt-4' | 'gpt-3.5-turbo' = 'gpt-4o',
    systemPrompt?: string
  ): Promise<{ success: boolean; response?: string; error?: string; usage?: TokenUsage }> {
    try {
      // Validate prompt
      const validation = this.validatePrompt(prompt, userId);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.reason
        };
      }

      // Check quotas
      const quotaCheck = await this.checkQuotaExceeded(userId);
      if (quotaCheck.exceeded) {
        return {
          success: false,
          error: quotaCheck.reason
        };
      }

      // Prepare messages
      const messages: any[] = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      // Make secure API call
      const startTime = Date.now();
      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        max_tokens: this.maxResponseTokens,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
        user: userId // For OpenAI's abuse monitoring
      });

      const duration = Date.now() - startTime;
      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        return {
          success: false,
          error: 'No response generated'
        };
      }

      // Calculate usage and cost
      const usage: TokenUsage = {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
        cost: this.calculateCost(completion.usage, model)
      };

      // Update user quota
      await this.updateTokenUsage(userId, usage);

      // Log successful completion
      auditService.logAuditEvent({
        userId,
        action: 'OPENAI_COMPLETION_SUCCESS',
        metadata: {
          model,
          promptLength: prompt.length,
          responseLength: response.length,
          duration,
          ...usage
        },
        severity: 'info'
      });

      return {
        success: true,
        response,
        usage
      };
    } catch (error) {
      logger.error('OpenAI API call failed', { 
        userId, 
        model, 
        error: error.message,
        promptLength: prompt?.length 
      });

      auditService.logSecurityEvent({
        userId,
        eventType: 'OPENAI_API_ERROR',
        severity: 'HIGH',
        description: `OpenAI API call failed: ${error.message}`,
        metadata: { model, promptLength: prompt?.length }
      });

      return {
        success: false,
        error: 'AI service temporarily unavailable'
      };
    }
  }

  // Calculate estimated cost
  private calculateCost(usage: any, model: string): number {
    if (!usage || !this.pricing[model]) return 0;
    
    const pricing = this.pricing[model];
    const inputCost = (usage.prompt_tokens / 1000) * pricing.input;
    const outputCost = (usage.completion_tokens / 1000) * pricing.output;
    
    return inputCost + outputCost;
  }

  // Get usage statistics for admin
  async getUsageStats(timeframe: 'day' | 'week' | 'month' = 'day') {
    try {
      // This would query your audit logs for usage statistics
      return {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        averageResponseTime: 0,
        errorRate: 0,
        topUsers: []
      };
    } catch (error) {
      logger.error('Error getting usage stats', { error: error.message });
      return null;
    }
  }
}

export const openaiSecurityService = new OpenAISecurityService();
export default openaiSecurityService;