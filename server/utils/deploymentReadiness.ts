import { logger } from './logger';
import { redisService } from '../services/redisService';
import { storage } from '../storage';

export interface DeploymentStatus {
  ready: boolean;
  services: {
    database: boolean;
    cache: boolean;
    queue: boolean;
    redis: boolean;
  };
  warnings: string[];
  errors: string[];
  mode: 'full' | 'degraded' | 'error';
}

export async function checkDeploymentReadiness(): Promise<DeploymentStatus> {
  const status: DeploymentStatus = {
    ready: false,
    services: {
      database: false,
      cache: false,
      queue: false,
      redis: false
    },
    warnings: [],
    errors: [],
    mode: 'error'
  };

  // Check database connection
  try {
    await storage.getUserCount();
    status.services.database = true;
    logger.info('Database connection verified');
  } catch (error) {
    status.errors.push(`Database connection failed: ${error.message}`);
    logger.error('Database check failed:', error);
  }

  // Check Redis connection (optional, with timeout)
  try {
    const redisPromise = redisService.ping();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Redis health check timeout')), 1000)
    );
    
    const redisHealthy = await Promise.race([redisPromise, timeoutPromise]);
    status.services.redis = redisHealthy;
    if (!redisHealthy) {
      status.warnings.push('Redis unavailable - using in-memory fallbacks');
    } else {
      logger.info('Redis connection verified');
    }
  } catch (error) {
    status.services.redis = false;
    status.warnings.push('Redis unavailable - using in-memory fallbacks');
    logger.warn('Redis check failed, using fallbacks:', error.message);
  }

  // Cache is always available (NodeCache fallback)
  status.services.cache = true;

  // Queue service is always available (memory fallback)
  status.services.queue = true;

  // Determine overall readiness
  const criticalServices = status.services.database && status.services.cache;
  status.ready = criticalServices;

  if (status.ready) {
    if (status.services.redis) {
      status.mode = 'full';
      logger.info('Deployment ready in full mode');
    } else {
      status.mode = 'degraded';
      logger.info('Deployment ready in degraded mode (no Redis)');
    }
  } else {
    status.mode = 'error';
    logger.error('Deployment not ready - critical services unavailable');
  }

  return status;
}

// Startup readiness check with fast timeout
export async function performStartupChecks(): Promise<void> {
  logger.info('Performing deployment readiness checks...');
  
  try {
    // Add overall timeout to prevent hanging
    const checksPromise = checkDeploymentReadiness();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Deployment checks timeout')), 5000)
    );
    
    const status = await Promise.race([checksPromise, timeoutPromise]);
    
    if (status.ready) {
      logger.info('✅ Deployment readiness check passed', {
        mode: status.mode,
        warnings: status.warnings.length,
        redis: status.services.redis ? 'connected' : 'fallback'
      });
      
      if (status.warnings.length > 0) {
        status.warnings.forEach(warning => logger.warn('⚠️', warning));
      }
    } else {
      logger.warn('⚠️ Some services unavailable - running in degraded mode', {
        mode: status.mode,
        services: status.services
      });
    }
  } catch (error) {
    logger.warn('⚠️ Deployment checks timed out - continuing with startup', {
      error: error.message
    });
    // Don't fail startup, just continue
  }
}