import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";

/**
 * Middleware to require premium subscription for protected routes
 * Verifies premium status from database, not frontend claims
 */
export async function requirePremium(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: "Authentication required",
        code: "NOT_AUTHENTICATED"
      });
    }

    // Get user from database to verify premium status
    const user = await storage.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    // Check if user has active premium subscription
    const isPremiumActive = user.isPremium && 
      (!user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date());

    if (!isPremiumActive) {
      logger.info('Premium access denied', { 
        userId, 
        isPremium: user.isPremium,
        premiumExpiresAt: user.premiumExpiresAt
      });
      
      return res.status(403).json({ 
        error: "Premium subscription required",
        code: "PREMIUM_REQUIRED",
        message: "This feature requires an active premium subscription. Please upgrade to continue.",
        upgradeUrl: "/pricing"
      });
    }

    // Log successful premium access
    logger.info('Premium access granted', { userId });
    
    // Attach premium user info to request for downstream use
    req.premiumUser = {
      ...user,
      premiumVerified: true
    };
    
    next();
  } catch (error) {
    logger.error('Premium middleware error', { 
      userId: req.user?.id, 
      error: error.message 
    });
    
    return res.status(500).json({ 
      error: "Premium verification failed",
      code: "PREMIUM_CHECK_ERROR"
    });
  }
}

/**
 * Optional premium middleware - allows access but marks premium status
 * Useful for features with premium/free tiers
 */
export async function checkPremium(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      req.premiumUser = null;
      return next();
    }

    const user = await storage.getUserById(userId);
    
    if (!user) {
      req.premiumUser = null;
      return next();
    }

    const isPremiumActive = user.isPremium && 
      (!user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date());

    req.premiumUser = isPremiumActive ? {
      ...user,
      premiumVerified: true
    } : null;
    
    next();
  } catch (error) {
    logger.error('Premium check middleware error', { 
      userId: req.user?.id, 
      error: error.message 
    });
    
    req.premiumUser = null;
    next();
  }
}

/**
 * Admin-only middleware with secure token verification
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: "Authentication required",
        code: "NOT_AUTHENTICATED"
      });
    }

    const user = await storage.getUserById(userId);
    
    if (!user?.isAdmin) {
      logger.warn('Admin access denied', { userId });
      
      return res.status(403).json({ 
        error: "Admin access required",
        code: "ADMIN_REQUIRED"
      });
    }

    logger.info('Admin access granted', { userId });
    next();
  } catch (error) {
    logger.error('Admin middleware error', { 
      userId: req.user?.id, 
      error: error.message 
    });
    
    return res.status(500).json({ 
      error: "Admin verification failed",
      code: "ADMIN_CHECK_ERROR"
    });
  }
}

// Type extension for Request object
declare global {
  namespace Express {
    interface Request {
      premiumUser?: any;
    }
  }
}

export default { requirePremium, checkPremium, requireAdmin };