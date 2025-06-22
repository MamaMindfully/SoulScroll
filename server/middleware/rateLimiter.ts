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
  handler: (req, res) => {
    logger.warn('Journal rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      error: 'Too many journal entries. Please wait before submitting another entry.',
      retryAfter: '10 minutes'
    });
  }
});

// Rate limiter for AI analysis - 50 per hour (more lenient)
export const aiAnalysisRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 requests per window
  message: {
    error: 'Too many AI analysis requests. Please wait before requesting another analysis.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('AI analysis rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      error: 'Too many AI analysis requests. Please wait before requesting another analysis.',
      retryAfter: '1 hour'
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
  handler: (req, res) => {
    logger.warn('Stripe rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      error: 'Too many billing requests. Please wait before trying again.',
      retryAfter: '1 hour'
    });
  }
});

// General API rate limiter - 500 requests per 15 minutes (more lenient for development)
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window
  message: {
    error: 'Too many requests. Please slow down.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('General rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({
      error: 'Too many requests. Please slow down.',
      retryAfter: '15 minutes'
    });
  }
});