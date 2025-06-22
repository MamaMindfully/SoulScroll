import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

// Rate limiter for journal entries - 5 per 10 minutes
export const journalRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'Too many journal entries. Please wait before submitting another entry.',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req) => {
    logger.warn('Journal rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent')
    });
  }
});

// Rate limiter for AI analysis - 10 per hour
export const aiAnalysisRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per window
  message: {
    error: 'Too many AI analysis requests. Please wait before requesting another analysis.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req) => {
    logger.warn('AI analysis rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent')
    });
  }
});

// Rate limiter for Stripe operations - 20 per hour
export const stripeRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per window
  message: {
    error: 'Too many billing requests. Please wait before trying again.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req) => {
    logger.warn('Stripe rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent')
    });
  }
});

// General API rate limiter - 100 requests per 15 minutes
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests. Please slow down.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req) => {
    logger.warn('General rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent')
    });
  }
});