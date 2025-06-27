import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { checkDatabaseHealth } from '../db';

// Database error recovery middleware
export function databaseErrorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  // Check if it's a database connection error
  const isDatabaseError = error.message && (
    error.message.includes('terminating connection') ||
    error.message.includes('connection terminated') ||
    error.message.includes('server closed the connection') ||
    error.message.includes('Connection terminated') ||
    error.code === '57P01' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ECONNRESET'
  );

  if (isDatabaseError) {
    logger.warn('Database connection error intercepted:', {
      message: error.message,
      code: error.code,
      url: req.url,
      method: req.method
    });

    // Don't crash the application, return a graceful error response
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Database temporarily unavailable',
        message: 'Please try again in a moment',
        code: 'DB_CONNECTION_ERROR',
        timestamp: new Date().toISOString()
      });
    }
    return;
  }

  // Pass other errors to the next error handler
  next(error);
}

// Middleware to wrap database operations with retry logic
export function withDatabaseRetry(operation: Function) {
  return async (req: Request, res: Response, next: NextFunction) => {
    let retries = 3;
    
    while (retries > 0) {
      try {
        await operation(req, res, next);
        return;
      } catch (error: any) {
        const isDatabaseError = error.message && (
          error.message.includes('terminating connection') ||
          error.message.includes('connection terminated') ||
          error.code === '57P01'
        );

        if (isDatabaseError && retries > 1) {
          logger.warn(`Database operation failed, retrying... (${retries - 1} attempts left)`);
          retries--;
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        // If not a database error, or no retries left, pass to error handler
        next(error);
        return;
      }
    }
  };
}

// Database connection health monitoring
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

export async function ensureDatabaseConnection(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  
  // Only check health periodically to avoid overhead
  if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
    try {
      const isHealthy = await checkDatabaseHealth();
      lastHealthCheck = now;
      
      if (!isHealthy) {
        logger.warn('Database health check failed - connection may be unstable');
      }
    } catch (error) {
      logger.error('Database health check error:', error);
    }
  }
  
  next();
}