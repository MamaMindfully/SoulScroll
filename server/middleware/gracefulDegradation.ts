import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface DegradationConfig {
  redis?: boolean;
  cache?: boolean;
  queue?: boolean;
  ai?: boolean;
}

// Middleware to handle graceful service degradation
export function gracefulDegradation(config: DegradationConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add degradation context to request
    (req as any).serviceStatus = {
      redis: config.redis ?? false,
      cache: config.cache ?? true,
      queue: config.queue ?? true,
      ai: config.ai ?? true,
      fallbackMode: !config.redis
    };
    
    next();
  };
}

// Enhanced error handler for service failures
export function serviceFailureHandler(
  error: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  const serviceStatus = (req as any).serviceStatus || {};
  
  // Redis connection errors
  if (error.code === 'ECONNREFUSED' || error.message.includes('Redis')) {
    logger.warn('Redis service unavailable, continuing with fallback', {
      error: error.message,
      path: req.path
    });
    
    // Don't fail the request, just note the degradation
    if (!res.headersSent) {
      res.setHeader('X-Service-Mode', 'degraded');
    }
    return next();
  }
  
  // OpenAI API errors
  if (error.status === 429 || error.message.includes('OpenAI')) {
    logger.warn('AI service temporarily unavailable', {
      error: error.message,
      path: req.path
    });
    
    // Provide fallback response for AI endpoints
    if (req.path.includes('/api/reflect') || req.path.includes('/api/ai')) {
      return res.json({
        insight: "Thank you for sharing your thoughts. Sometimes the most profound insights come from within.",
        followUpPrompt: "What feels most important for you to explore right now?",
        source: 'fallback',
        note: 'AI services temporarily unavailable'
      });
    }
  }
  
  // Pass other errors to default handler
  next(error);
}

// Environment detection utility
export function detectServiceAvailability() {
  return {
    redis: !!process.env.REDIS_URL,
    openai: !!process.env.OPENAI_API_KEY,
    stripe: !!process.env.STRIPE_SECRET_KEY,
    database: !!process.env.DATABASE_URL
  };
}