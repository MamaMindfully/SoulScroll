import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";
import { auditService } from "../services/auditService";


interface JwtPayload {
  userId: string;
  email?: string;
  username?: string;
  isAdmin?: boolean;
  isPremium?: boolean;
  iat?: number;
  exp?: number;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      jwtUser?: JwtPayload;
    }
  }
}

export function verifyJwt(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from various sources
    let token = req.headers.authorization?.replace("Bearer ", "");
    
    // Fallback to cookie if no authorization header
    if (!token && req.cookies?.auth_token) {
      token = req.cookies.auth_token;
    }
    
    // Fallback to query parameter for WebSocket connections
    if (!token && req.query?.token) {
      token = req.query.token as string;
    }

    if (!token) {
      logger.warn('JWT verification failed: No token provided', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });

      // Log security event
      auditService.logSecurityEvent({
        eventType: 'MISSING_AUTH_TOKEN',
        severity: 'MEDIUM',
        description: 'Request made to protected endpoint without authentication token',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestPath: req.path
      });

      return res.status(401).json({ 
        error: "Authentication required",
        code: "NO_AUTH_TOKEN"
      });
    }

    // Verify and decode the JWT
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Validate payload structure
    if (!payload.userId) {
      logger.warn('JWT verification failed: Invalid payload structure', {
        ip: req.ip,
        path: req.path
      });

      return res.status(401).json({ 
        error: "Invalid token format",
        code: "INVALID_TOKEN_FORMAT"
      });
    }

    // Attach user info to request
    req.jwtUser = payload;

    // Log successful authentication for audit
    if (req.path.includes('/admin') || req.path.includes('/api/stripe')) {
      auditService.logAuditEvent({
        userId: payload.userId,
        action: 'JWT_AUTH_SUCCESS',
        metadata: {
          path: req.path,
          method: req.method,
          isAdmin: payload.isAdmin,
          isPremium: payload.isPremium
        },
        severity: 'info',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    next();
  } catch (error) {
    let errorMessage = 'Invalid or expired token';
    let errorCode = 'INVALID_TOKEN';

    if (error instanceof jwt.TokenExpiredError) {
      errorMessage = 'Token has expired';
      errorCode = 'TOKEN_EXPIRED';
    } else if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = 'Invalid token signature';
      errorCode = 'INVALID_SIGNATURE';
    }

    logger.warn('JWT verification failed', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });

    // Log security event for failed authentication
    auditService.logSecurityEvent({
      eventType: 'FAILED_JWT_VERIFICATION',
      severity: 'HIGH',
      description: `JWT verification failed: ${error.message}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      requestPath: req.path,
      metadata: { errorType: error.constructor.name }
    });

    return res.status(401).json({ 
      error: errorMessage,
      code: errorCode
    });
  }
}

// Optional JWT verification (doesn't block request if no token)
export function optionalJwt(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.auth_token;
    
    if (token) {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.jwtUser = payload;
    }
    
    next();
  } catch (error) {
    // Don't block request, just continue without user info
    logger.debug('Optional JWT verification failed', { error: error.message });
    next();
  }
}

// Generate JWT token
export function generateJwtToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // 7 days
    issuer: 'soulscroll-ai',
    audience: 'soulscroll-users'
  });
}

// Verify JWT token without middleware (for utilities)
export function verifyJwtToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

export default { verifyJwt, optionalJwt, generateJwtToken, verifyJwtToken };