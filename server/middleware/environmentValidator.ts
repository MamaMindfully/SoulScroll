import { z } from "zod";
import { logger } from "../utils/logger";

// Define configuration schema with strict validation
const configSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("Invalid database URL"),
  
  // OpenAI
  OPENAI_API_KEY: z.string().min(20, "OpenAI API key must be at least 20 characters"),
  
  // Authentication
  JWT_SECRET: z.string().min(16, "JWT secret must be at least 16 characters"),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().min(20, "Stripe secret key must be at least 20 characters").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(20, "Stripe webhook secret must be at least 20 characters").optional(),
  
  // Session
  SESSION_SECRET: z.string().min(16, "Session secret must be at least 16 characters").optional(),
  
  // Redis (optional)
  REDIS_URL: z.string().url("Invalid Redis URL").optional(),
  
  // Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Server
  PORT: z.string().regex(/^\d+$/, "Port must be a number").default("5000"),
  
  // Security
  FIELD_ENCRYPTION_KEY: z.string().min(32, "Field encryption key must be at least 32 characters").optional(),
  
  // Monitoring
  SENTRY_DSN: z.string().url("Invalid Sentry DSN").optional(),
  
  REPL_ID: z.string().optional(),
});

// Validated configuration object
let validatedConfig: z.infer<typeof configSchema>;

// Validate environment variables on startup
export function validateEnvironment(): z.infer<typeof configSchema> {
  try {
    validatedConfig = configSchema.parse(process.env);
    
    // Additional security checks
    validateSecurityRequirements(validatedConfig);
    
    logger.info('Environment validation successful', {
      nodeEnv: validatedConfig.NODE_ENV,
      hasOpenAI: !!validatedConfig.OPENAI_API_KEY,
      hasStripe: !!validatedConfig.STRIPE_SECRET_KEY,
      hasRedis: !!validatedConfig.REDIS_URL,
      hasEncryption: !!validatedConfig.FIELD_ENCRYPTION_KEY
    });
    
    return validatedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingOrInvalid = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n');
      
      logger.error('Environment validation failed', { errors: missingOrInvalid });
      throw new Error(`Environment validation failed:\n${missingOrInvalid}`);
    }
    
    logger.error('Environment validation error', { error: error.message });
    throw error;
  }
}

// Additional security validation
function validateSecurityRequirements(config: z.infer<typeof configSchema>) {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Production-specific checks
  if (config.NODE_ENV === 'production') {
    if (!config.STRIPE_SECRET_KEY) {
      warnings.push('Stripe not configured - payment features disabled');
    }
    
    if (!config.FIELD_ENCRYPTION_KEY) {
      warnings.push('Field encryption not configured - using basic security');
    }
    
    if (!config.REDIS_URL) {
      warnings.push('Redis not configured - using memory fallbacks');
    }
    
    if (!config.SENTRY_DSN) {
      warnings.push('Sentry not configured - limited error monitoring');
    }
    
    // Check for default/weak secrets
    if (config.JWT_SECRET === 'change_this_secret' || config.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET appears to be default or weak - use a strong, unique secret');
    }
    
    if (config.SESSION_SECRET && config.SESSION_SECRET.length < 32) {
      errors.push('SESSION_SECRET is too short - use at least 32 characters');
    }
  }
  
  // Log warnings
  if (warnings.length > 0) {
    logger.warn('Environment configuration warnings', { warnings });
  }
  
  // Throw on critical errors
  if (errors.length > 0) {
    throw new Error(`Critical security issues:\n${errors.join('\n')}`);
  }
}

// Get validated config (cached after first validation)
export function getConfig(): z.infer<typeof configSchema> {
  if (!validatedConfig) {
    return validateEnvironment();
  }
  return validatedConfig;
}

// Check if specific features are available
export function isFeatureAvailable(feature: string): boolean {
  const config = getConfig();
  
  switch (feature) {
    case 'stripe':
      return !!(config.STRIPE_SECRET_KEY && config.STRIPE_WEBHOOK_SECRET);
    case 'redis':
      return !!config.REDIS_URL;
    case 'encryption':
      return !!config.FIELD_ENCRYPTION_KEY;
    case 'monitoring':
      return !!config.SENTRY_DSN;
    default:
      return false;
  }
}

// Environment info for health checks
export function getEnvironmentInfo() {
  const config = getConfig();
  
  return {
    nodeEnv: config.NODE_ENV,
    features: {
      openai: !!config.OPENAI_API_KEY,
      stripe: isFeatureAvailable('stripe'),
      redis: isFeatureAvailable('redis'),
      encryption: isFeatureAvailable('encryption'),
      monitoring: isFeatureAvailable('monitoring')
    },
    security: {
      jwtConfigured: config.JWT_SECRET.length >= 16,
      sessionConfigured: !!config.SESSION_SECRET,
      encryptionConfigured: !!config.FIELD_ENCRYPTION_KEY
    }
  };
}

export default {
  validateEnvironment,
  getConfig,
  isFeatureAvailable,
  getEnvironmentInfo
};