import { Request, Response, NextFunction } from 'express';
import { getUser } from '../storage';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'admin' | 'moderator';
    isPremium: boolean;
    permissions: string[];
  };
}

// Role hierarchy and permissions
const ROLE_PERMISSIONS = {
  user: ['read:own', 'write:own', 'delete:own'],
  moderator: ['read:own', 'write:own', 'delete:own', 'read:community', 'moderate:content'],
  admin: ['*'] // Full access
};

const ROUTE_PERMISSIONS = {
  '/api/admin/*': ['admin:access'],
  '/api/user/all': ['admin:access'],
  '/api/analytics/*': ['admin:access', 'moderator:access'],
  '/api/journal/delete/*': ['write:own', 'admin:access'],
  '/api/premium/*': ['premium:access'],
  '/api/community/moderate': ['moderate:content']
};

// Enhanced authentication middleware with role checking
export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Fetch full user data with role information
    const user = await getUser(userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid user session',
        code: 'INVALID_SESSION'
      });
    }

    // Attach user with role and permissions to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      isPremium: user.isPremium || false,
      permissions: getUserPermissions(user.role || 'user')
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication service unavailable',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const hasPermission = requiredPermissions.some(permission => 
      req.user!.permissions.includes(permission) || 
      req.user!.permissions.includes('*')
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Access denied',
        code: 'ACCESS_DENIED',
        required: requiredPermissions,
        available: req.user.permissions
      });
    }

    next();
  };
};

// Resource ownership validation
export const requireOwnership = (resourceIdParam: string = 'id') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const resourceId = req.params[resourceIdParam];
    const userId = req.user.id;

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // For other users, validate ownership
    if (resourceId !== userId) {
      return res.status(403).json({ 
        error: 'Resource access denied',
        code: 'RESOURCE_ACCESS_DENIED'
      });
    }

    next();
  };
};

// Premium feature access middleware
export const requirePremium = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.user.isPremium && req.user.role !== 'admin') {
    return res.status(402).json({ 
      error: 'Premium subscription required',
      code: 'PREMIUM_REQUIRED',
      upgradeUrl: '/pricing'
    });
  }

  next();
};

// Rate limiting by role
export const createRoleBasedRateLimit = () => {
  const rateLimits = new Map();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.ip;
    const role = req.user?.role || 'anonymous';
    
    // Different limits by role
    const limits = {
      admin: { requests: 1000, window: 60000 }, // 1000/min
      moderator: { requests: 500, window: 60000 }, // 500/min
      user: { requests: 100, window: 60000 }, // 100/min
      anonymous: { requests: 10, window: 60000 } // 10/min
    };

    const limit = limits[role] || limits.anonymous;
    const key = `${userId}-${role}`;
    const now = Date.now();

    if (!rateLimits.has(key)) {
      rateLimits.set(key, { count: 0, resetTime: now + limit.window });
    }

    const userLimit = rateLimits.get(key);

    if (now > userLimit.resetTime) {
      userLimit.count = 0;
      userLimit.resetTime = now + limit.window;
    }

    if (userLimit.count >= limit.requests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        resetTime: userLimit.resetTime
      });
    }

    userLimit.count++;
    next();
  };
};

// Helper functions
function getUserPermissions(role: string): string[] {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
}

// Audit logging middleware
export const auditLogger = (action: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response
      logAuditEvent({
        action,
        userId: req.user?.id,
        userRole: req.user?.role,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString()
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

async function logAuditEvent(event: any) {
  try {
    // Log to database or external service
    console.log('AUDIT:', JSON.stringify(event));
    
    // Store in database for security analysis
    // await db.insert(auditLogs).values(event);
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}

export default {
  requireAuth,
  requireRole,
  requirePermission,
  requireOwnership,
  requirePremium,
  createRoleBasedRateLimit,
  auditLogger
};