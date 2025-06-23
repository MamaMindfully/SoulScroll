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

  // Check Redis connection (optional)
  try {
    const redisHealthy = await redisService.ping();
    status.services.redis = redisHealthy;
    if (!redisHealthy) {
      status.warnings.push('Redis unavailable - using in-memory fallbacks');
    } else {
      logger.info('Redis connection verified');
    }
  } catch (error) {
    status.warnings.push(`Redis connection failed: ${error.message} - using fallbacks`);
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

// Startup readiness check
export async function performStartupChecks(): Promise<void> {
  logger.info('Performing deployment readiness checks...');
  
  const status = await checkDeploymentReadiness();
  
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
    logger.error('❌ Deployment readiness check failed', {
      errors: status.errors,
      services: status.services
    });
    
    // In production, don't exit - try to run in degraded mode
    if (process.env.NODE_ENV === 'production') {
      logger.warn('🔧 Attempting to start in emergency mode...');
    } else {
      logger.warn('⚠️ Starting in development mode with limited services');
    }
  }
}