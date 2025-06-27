import pRetry from 'p-retry';
import { logger } from './logger';
import { captureError } from './errorHandler';

interface RetryOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  randomize?: boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

export class RetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class NonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

// Retry wrapper for OpenAI API calls
export async function retryOpenAICall<T>(
  operation: () => Promise<T>,
  context: string,
  options: RetryOptions = {}
): Promise<T> {
  const defaultOptions: pRetry.Options = {
    retries: options.retries || 3,
    factor: options.factor || 2,
    minTimeout: options.minTimeout || 1000,
    maxTimeout: options.maxTimeout || 10000,
    randomize: options.randomize !== false,
    onFailedAttempt: (error) => {
      logger.warn(`${context} failed, attempt ${error.attemptNumber}/${error.retriesLeft + error.attemptNumber}`, {
        error: error.message,
        attemptNumber: error.attemptNumber,
        retriesLeft: error.retriesLeft
      });
      
      options.onRetry?.(error, error.attemptNumber);
    }
  };

  return pRetry(async () => {
    try {
      return await operation();
    } catch (error: any) {
      // Check if error should be retried
      if (shouldRetryOpenAIError(error)) {
        throw new RetryableError(error.message);
      } else {
        throw new NonRetryableError(error.message);
      }
    }
  }, {
    ...defaultOptions,
    onFailedAttempt: (error) => {
      // Don't retry non-retryable errors
      if (error.name === 'NonRetryableError') {
        throw error;
      }
      defaultOptions.onFailedAttempt?.(error);
    }
  });
}

// Retry wrapper for Stripe API calls
export async function retryStripeCall<T>(
  operation: () => Promise<T>,
  context: string,
  options: RetryOptions = {}
): Promise<T> {
  const defaultOptions: pRetry.Options = {
    retries: options.retries || 2,
    factor: options.factor || 2,
    minTimeout: options.minTimeout || 2000,
    maxTimeout: options.maxTimeout || 8000,
    randomize: true,
    onFailedAttempt: (error) => {
      logger.warn(`${context} failed, attempt ${error.attemptNumber}/${error.retriesLeft + error.attemptNumber}`, {
        error: error.message,
        attemptNumber: error.attemptNumber,
        retriesLeft: error.retriesLeft
      });
    }
  };

  return pRetry(async () => {
    try {
      return await operation();
    } catch (error: any) {
      if (shouldRetryStripeError(error)) {
        throw new RetryableError(error.message);
      } else {
        throw new NonRetryableError(error.message);
      }
    }
  }, {
    ...defaultOptions,
    onFailedAttempt: (error) => {
      if (error.name === 'NonRetryableError') {
        throw error;
      }
      defaultOptions.onFailedAttempt?.(error);
    }
  });
}

// Retry wrapper for database operations
export async function retryDatabaseCall<T>(
  operation: () => Promise<T>,
  context: string,
  options: RetryOptions = {}
): Promise<T> {
  const defaultOptions: pRetry.Options = {
    retries: options.retries || 3,
    factor: options.factor || 1.5,
    minTimeout: options.minTimeout || 500,
    maxTimeout: options.maxTimeout || 5000,
    randomize: true,
    onFailedAttempt: (error) => {
      logger.warn(`Database ${context} failed, attempt ${error.attemptNumber}/${error.retriesLeft + error.attemptNumber}`, {
        error: error.message,
        attemptNumber: error.attemptNumber,
        retriesLeft: error.retriesLeft
      });
    }
  };

  return pRetry(async () => {
    try {
      return await operation();
    } catch (error: any) {
      if (shouldRetryDatabaseError(error)) {
        throw new RetryableError(error.message);
      } else {
        throw new NonRetryableError(error.message);
      }
    }
  }, {
    ...defaultOptions,
    onFailedAttempt: (error) => {
      if (error.name === 'NonRetryableError') {
        throw error;
      }
      defaultOptions.onFailedAttempt?.(error);
    }
  });
}

// Determine if OpenAI error should be retried
function shouldRetryOpenAIError(error: any): boolean {
  // Retry on rate limits, server errors, timeouts
  if (error.status === 429) return true; // Rate limit
  if (error.status >= 500) return true; // Server errors
  if (error.code === 'ECONNRESET') return true; // Connection reset
  if (error.code === 'ETIMEDOUT') return true; // Timeout
  if (error.message?.includes('timeout')) return true;
  if (error.message?.includes('network')) return true;
  
  // Don't retry on authentication or invalid request errors
  if (error.status === 401) return false; // Unauthorized
  if (error.status === 403) return false; // Forbidden
  if (error.status === 400) return false; // Bad request
  
  return false;
}

// Determine if Stripe error should be retried
function shouldRetryStripeError(error: any): boolean {
  // Retry on rate limits and server errors
  if (error.type === 'StripeConnectionError') return true;
  if (error.type === 'StripeAPIError' && error.statusCode >= 500) return true;
  if (error.statusCode === 429) return true; // Rate limit
  
  // Don't retry on authentication or card errors
  if (error.type === 'StripeAuthenticationError') return false;
  if (error.type === 'StripeCardError') return false;
  if (error.type === 'StripeInvalidRequestError') return false;
  
  return false;
}

// Determine if database error should be retried
function shouldRetryDatabaseError(error: any): boolean {
  // Retry on connection issues
  if (error.code === 'ECONNRESET') return true;
  if (error.code === 'ECONNREFUSED') return true;
  if (error.code === 'ETIMEDOUT') return true;
  if (error.message?.includes('timeout')) return true;
  if (error.message?.includes('connection')) return true;
  
  // Don't retry on syntax or constraint errors
  if (error.code === '42601') return false; // Syntax error
  if (error.code === '23505') return false; // Unique violation
  if (error.code === '23503') return false; // Foreign key violation
  
  return false;
}

// Generic retry function with custom retry logic
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  shouldRetry: (error: any) => boolean,
  options: RetryOptions = {}
): Promise<T> {
  const defaultOptions: pRetry.Options = {
    retries: options.retries || 3,
    factor: options.factor || 2,
    minTimeout: options.minTimeout || 1000,
    maxTimeout: options.maxTimeout || 10000,
    randomize: options.randomize !== false,
    onFailedAttempt: (error) => {
      logger.warn(`Operation failed, attempt ${error.attemptNumber}/${error.retriesLeft + error.attemptNumber}`, {
        error: error.message,
        attemptNumber: error.attemptNumber,
        retriesLeft: error.retriesLeft
      });
    }
  };

  return pRetry(async () => {
    try {
      return await operation();
    } catch (error: any) {
      if (shouldRetry(error)) {
        throw new RetryableError(error.message);
      } else {
        throw new NonRetryableError(error.message);
      }
    }
  }, {
    ...defaultOptions,
    onFailedAttempt: (error) => {
      if (error.name === 'NonRetryableError') {
        throw error;
      }
      defaultOptions.onFailedAttempt?.(error);
    }
  });
}