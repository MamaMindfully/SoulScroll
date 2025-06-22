import { logger } from './logger';

interface ErrorContext {
  userId?: string;
  operation?: string;
  data?: any;
  timestamp?: Date;
  requestId?: string;
}

class ErrorHandler {
  // Capture and log errors with context
  captureError(error: Error, context: ErrorContext = {}): void {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date(),
      ...context
    };

    // Log error
    logger.error('Application error captured', errorInfo);

    // In production, send to external error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(errorInfo);
    }
  }

  // Send error to external service (Sentry, Discord webhook, etc.)
  private async sendToExternalService(errorInfo: any): Promise<void> {
    try {
      // Discord webhook for critical errors
      if (process.env.DISCORD_WEBHOOK_URL && this.isCriticalError(errorInfo)) {
        await this.sendToDiscord(errorInfo);
      }

      // Could also send to Sentry, Slack, etc.
      // await this.sendToSentry(errorInfo);
    } catch (webhookError) {
      logger.error('Failed to send error to external service', { 
        originalError: errorInfo,
        webhookError: webhookError.message 
      });
    }
  }

  // Send critical errors to Discord
  private async sendToDiscord(errorInfo: any): Promise<void> {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    const embed = {
      title: '🚨 Critical Error in Luma App',
      color: 0xff0000, // Red
      fields: [
        {
          name: 'Error',
          value: `\`\`\`${errorInfo.message}\`\`\``,
          inline: false
        },
        {
          name: 'Operation',
          value: errorInfo.operation || 'Unknown',
          inline: true
        },
        {
          name: 'User ID',
          value: errorInfo.userId || 'Anonymous',
          inline: true
        },
        {
          name: 'Timestamp',
          value: new Date().toISOString(),
          inline: true
        }
      ],
      timestamp: new Date().toISOString()
    };

    const payload = {
      embeds: [embed],
      username: 'Luma Error Bot'
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Discord webhook failed: ${response.status}`);
      }
    } catch (error: any) {
      logger.error('Discord webhook failed', { error: error.message });
    }
  }

  // Determine if error is critical
  private isCriticalError(errorInfo: any): boolean {
    const criticalOperations = [
      'stripe_payment',
      'user_authentication',
      'data_corruption',
      'security_breach'
    ];

    const criticalMessages = [
      'database connection failed',
      'payment failed',
      'authentication error',
      'critical system error'
    ];

    return (
      criticalOperations.includes(errorInfo.operation) ||
      criticalMessages.some(msg => 
        errorInfo.message.toLowerCase().includes(msg)
      )
    );
  }

  // Handle API errors with proper HTTP responses
  handleAPIError(error: any, context: ErrorContext = {}) {
    this.captureError(error, context);

    if (error.name === 'ValidationError') {
      return {
        status: 400,
        error: 'Invalid request data',
        details: error.message
      };
    }

    if (error.name === 'UnauthorizedError') {
      return {
        status: 401,
        error: 'Unauthorized access'
      };
    }

    if (error.name === 'NotFoundError') {
      return {
        status: 404,
        error: 'Resource not found'
      };
    }

    if (error.name === 'RateLimitError') {
      return {
        status: 429,
        error: 'Rate limit exceeded',
        retryAfter: error.retryAfter || '1 minute'
      };
    }

    // Default server error
    return {
      status: 500,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    };
  }

  // Track error patterns and metrics
  trackErrorMetrics(error: Error, context: ErrorContext = {}): void {
    // This could integrate with monitoring services
    const metrics = {
      errorType: error.name,
      operation: context.operation,
      userId: context.userId,
      timestamp: new Date(),
      count: 1
    };

    // In a real implementation, you'd send this to a metrics service
    logger.info('Error metrics tracked', metrics);
  }

  // Generate error report for debugging
  generateErrorReport(timeframe: string = '24h'): any {
    // This would typically query error logs from the last timeframe
    return {
      timeframe,
      summary: 'Error report would be generated here',
      mostCommonErrors: [],
      errorsByUser: {},
      errorsByOperation: {},
      recommendation: 'Monitor system closely'
    };
  }
}

export const errorHandler = new ErrorHandler();

// Convenience function for capturing errors
export function captureError(error: Error, context: ErrorContext = {}): void {
  errorHandler.captureError(error, context);
}

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  public retryAfter: string;
  
  constructor(message: string = 'Rate limit exceeded', retryAfter: string = '1 minute') {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}