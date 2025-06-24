import { Router, Request, Response } from "express";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { logger } from "../utils/logger";

const router = Router();

// Get current user's premium status
router.get('/user/premium-status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await storage.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if premium is still active
    const isPremiumActive = user.isPremium && 
      (!user.premiumExpiresAt || new Date(user.premiumExpiresAt) > new Date());

    const premiumStatus = {
      isPremium: isPremiumActive,
      premiumExpiresAt: user.premiumExpiresAt,
      subscriptionId: user.stripeSubscriptionId,
      planType: isPremiumActive ? (user.planType || 'premium') : 'free',
      customerId: user.stripeCustomerId,
      lastVerified: new Date().toISOString()
    };

    logger.info('Premium status checked', { 
      userId, 
      isPremium: isPremiumActive,
      expiresAt: user.premiumExpiresAt
    });

    res.json(premiumStatus);
  } catch (error) {
    logger.error('Error checking premium status', { 
      userId: req.user?.id, 
      error: error.message 
    });
    
    res.status(500).json({ 
      error: 'Failed to check premium status',
      isPremium: false,
      planType: 'free'
    });
  }
});

// Refresh premium status from Stripe (for debugging)
router.post('/user/refresh-premium', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await storage.getUserById(userId);
    
    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }

    // This would typically fetch from Stripe API
    // For now, just return current status
    const premiumStatus = {
      isPremium: user.isPremium,
      premiumExpiresAt: user.premiumExpiresAt,
      subscriptionId: user.stripeSubscriptionId,
      planType: user.isPremium ? (user.planType || 'premium') : 'free',
      refreshedAt: new Date().toISOString()
    };

    logger.info('Premium status refreshed', { userId });

    res.json(premiumStatus);
  } catch (error) {
    logger.error('Error refreshing premium status', { 
      userId: req.user?.id, 
      error: error.message 
    });
    
    res.status(500).json({ error: 'Failed to refresh premium status' });
  }
});

export default router;