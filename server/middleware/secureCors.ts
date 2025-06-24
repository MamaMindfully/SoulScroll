import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { auditService } from "../services/auditService";

// Production domains whitelist
const productionWhitelist = [
  "https://soulscroll-ai.replit.app",
  "https://soulscroll.ai", 
  "https://www.soulscroll.ai",
  "https://app.soulscroll.ai"
];

// Development domains
const developmentWhitelist = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5000"
];

// Replit specific domains
const replitWhitelist = [
  "https://soulscrollai.replit.dev",
  /^https:\/\/.*\.replit\.dev$/,
  /^https:\/\/.*\.replit\.app$/,
  /^https:\/\/.*\.repl\.co$/
];

// Combine whitelists based on environment
const getAllowedOrigins = (): (string | RegExp)[] => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isReplit = process.env.REPL_ID || process.env.REPLIT_DEPLOYMENT;
  
  let whitelist: (string | RegExp)[] = [...productionWhitelist];
  
  if (isDevelopment) {
    whitelist.push(...developmentWhitelist);
  }
  
  if (isReplit) {
    whitelist.push(...replitWhitelist);
  }
  
  return whitelist;
};

// Check if origin is allowed
const isOriginAllowed = (origin: string | undefined, whitelist: (string | RegExp)[]): boolean => {
  if (!origin) return false;
  
  return whitelist.some(allowed => {
    if (typeof allowed === 'string') {
      return allowed === origin;
    } else {
      return allowed.test(origin);
    }
  });
};

export function secureCors(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const whitelist = getAllowedOrigins();
  
  // Check if origin is allowed
  if (origin && isOriginAllowed(origin, whitelist)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    
    // Log successful CORS for sensitive endpoints
    if (req.path.includes('/api/stripe') || req.path.includes('/admin')) {
      logger.debug('CORS allowed for sensitive endpoint', {
        origin,
        path: req.path,
        method: req.method
      });
    }
  } else if (origin) {
    // Log blocked CORS attempts
    logger.warn('CORS blocked for unauthorized origin', {
      origin,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Log security event for blocked CORS
    auditService.logSecurityEvent({
      eventType: 'CORS_VIOLATION',
      severity: 'MEDIUM',
      description: `Blocked request from unauthorized origin: ${origin}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      requestPath: req.path,
      metadata: { 
        blockedOrigin: origin,
        allowedOrigins: whitelist.filter(w => typeof w === 'string')
      }
    });

    // For non-preflight requests, return 403
    if (req.method !== 'OPTIONS') {
      return res.status(403).json({
        error: 'CORS policy violation',
        code: 'UNAUTHORIZED_ORIGIN'
      });
    }
  }

  // Set standard CORS headers
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key, X-Client-Version");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD");
  res.header("Access-Control-Max-Age", "86400"); // 24 hours preflight cache

  // Security headers
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("X-XSS-Protection", "1; mode=block");
  res.header("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy for API responses
  if (req.path.startsWith('/api/')) {
    res.header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none';");
  }

  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    logger.debug('CORS preflight request processed', {
      origin,
      path: req.path,
      allowed: origin ? isOriginAllowed(origin, whitelist) : false
    });
    
    return res.status(204).end();
  }

  next();
}

// Strict CORS for admin endpoints
export function strictCors(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const adminWhitelist = process.env.NODE_ENV === 'production' 
    ? productionWhitelist 
    : [...productionWhitelist, ...developmentWhitelist];

  if (origin && isOriginAllowed(origin, adminWhitelist)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  } else if (origin) {
    logger.warn('Strict CORS blocked for admin endpoint', {
      origin,
      path: req.path,
      ip: req.ip
    });

    auditService.logSecurityEvent({
      eventType: 'ADMIN_CORS_VIOLATION',
      severity: 'HIGH',
      description: `Blocked admin request from unauthorized origin: ${origin}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      requestPath: req.path
    });

    return res.status(403).json({
      error: 'Admin access denied - unauthorized origin',
      code: 'ADMIN_CORS_VIOLATION'
    });
  }

  // Strict security headers for admin endpoints
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
}

// Public CORS for webhook endpoints
export function publicCors(req: Request, res: Response, next: NextFunction) {
  // Allow all origins for public webhooks (like Stripe)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Stripe-Signature");
  res.header("Access-Control-Allow-Methods", "POST");
  
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
}

export default { secureCors, strictCors, publicCors };