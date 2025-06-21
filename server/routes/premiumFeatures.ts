import express from 'express';
import { storage } from '../storage.js';
import { isAuthenticated } from '../replitAuth.js';

const router = express.Router();

// Get premium status for a user
router.get('/premium/:userId', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Get user from storage
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ isPremium: user.isPremium || false });
  } catch (error) {
    console.error('Premium fetch error:', error);
    res.status(500).json({ error: 'Unable to check premium status' });
  }
});

// Update premium status for a user (for admin or subscription webhooks)
router.put('/premium/:userId', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.params.userId;
    const { isPremium } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Update user premium status
    const updatedUser = await storage.upsertUser({
      id: userId,
      isPremium: Boolean(isPremium)
    });

    res.json({ 
      success: true, 
      isPremium: updatedUser.isPremium 
    });
  } catch (error) {
    console.error('Premium update error:', error);
    res.status(500).json({ error: 'Unable to update premium status' });
  }
});

export default router;