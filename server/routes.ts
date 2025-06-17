import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { insertJournalEntrySchema, insertDailyPromptSchema } from "@shared/schema";
import { journalService } from "./services/journalService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Journal entry routes
  app.post('/api/journal/entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entryData = insertJournalEntrySchema.parse(req.body);
      
      // Calculate word count
      const wordCount = entryData.content.trim().split(/\s+/).filter(word => word.length > 0).length;
      
      // Create entry
      const entry = await storage.createJournalEntry(userId, {
        ...entryData,
        wordCount,
      });

      // Update user streak
      await storage.updateUserStreak(userId);

      // Generate AI response asynchronously
      journalService.generateAIResponse(entry.id).catch(console.error);

      res.json(entry);
    } catch (error) {
      console.error("Error creating journal entry:", error);
      res.status(500).json({ message: "Failed to create journal entry" });
    }
  });

  app.get('/api/journal/entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const entries = await storage.getJournalEntries(userId, limit, offset);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.get('/api/journal/entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const entryId = parseInt(req.params.id);
      const entry = await storage.getJournalEntryById(entryId);
      
      if (!entry) {
        return res.status(404).json({ message: "Journal entry not found" });
      }

      // Check if user owns this entry
      if (entry.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Unauthorized access to journal entry" });
      }

      res.json(entry);
    } catch (error) {
      console.error("Error fetching journal entry:", error);
      res.status(500).json({ message: "Failed to fetch journal entry" });
    }
  });

  app.put('/api/journal/entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const entryId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const updates = insertJournalEntrySchema.partial().parse(req.body);

      // Check if user owns this entry
      const existingEntry = await storage.getJournalEntryById(entryId);
      if (!existingEntry || existingEntry.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to journal entry" });
      }

      // Update word count if content changed
      if (updates.content) {
        updates.wordCount = updates.content.trim().split(/\s+/).filter(word => word.length > 0).length;
      }

      const updatedEntry = await storage.updateJournalEntry(entryId, updates);
      res.json(updatedEntry);
    } catch (error) {
      console.error("Error updating journal entry:", error);
      res.status(500).json({ message: "Failed to update journal entry" });
    }
  });

  app.delete('/api/journal/entries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const entryId = parseInt(req.params.id);
      const userId = req.user.claims.sub;

      // Check if user owns this entry
      const existingEntry = await storage.getJournalEntryById(entryId);
      if (!existingEntry || existingEntry.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to journal entry" });
      }

      await storage.deleteJournalEntry(entryId);
      res.json({ message: "Journal entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      res.status(500).json({ message: "Failed to delete journal entry" });
    }
  });

  // Daily prompt routes
  app.get('/api/prompts/daily', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const isPremium = user?.isPremium || false;
      
      const prompt = await storage.getDailyPrompt(new Date(), isPremium);
      res.json(prompt);
    } catch (error) {
      console.error("Error fetching daily prompt:", error);
      res.status(500).json({ message: "Failed to fetch daily prompt" });
    }
  });

  // Emotional insights routes
  app.get('/api/insights/emotional', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const period = req.query.period as string || 'weekly';
      
      const insights = await storage.getEmotionalInsights(userId, period);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching emotional insights:", error);
      res.status(500).json({ message: "Failed to fetch emotional insights" });
    }
  });

  // User stats route
  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Reflection letters route
  app.get('/api/reflection-letters', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const letters = await storage.getReflectionLetters(userId);
      res.json(letters);
    } catch (error) {
      console.error("Error fetching reflection letters:", error);
      res.status(500).json({ message: "Failed to fetch reflection letters" });
    }
  });

  // Premium subscription check
  app.get('/api/user/premium-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const isPremium = user?.isPremium && 
        (!user.subscriptionExpiresAt || user.subscriptionExpiresAt > new Date());
      
      res.json({ isPremium });
    } catch (error) {
      console.error("Error checking premium status:", error);
      res.status(500).json({ message: "Failed to check premium status" });
    }
  });

  // Annual subscription and gift subscription routes
  app.post('/api/subscriptions/annual', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { planId } = req.body;
      
      const annualPrices = {
        premium: 9999, // $99.99 in cents
        'premium-plus': 19999 // $199.99 in cents
      };

      const price = annualPrices[planId as keyof typeof annualPrices];
      if (!price) {
        return res.status(400).json({ message: "Invalid plan ID" });
      }

      // Create annual subscription with 17% discount already applied
      const subscription = await storage.createSubscription({
        userId,
        planId,
        billingCycle: 'annual',
        priceId: `annual_${planId}`,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      });

      res.json({ 
        subscriptionId: subscription.id,
        message: "Annual subscription created successfully",
        savings: planId === 'premium' ? 39.88 : 79.88
      });
    } catch (error) {
      console.error("Error creating annual subscription:", error);
      res.status(500).json({ message: "Failed to create annual subscription" });
    }
  });

  app.post('/api/subscriptions/gift', isAuthenticated, async (req: any, res) => {
    try {
      const { planId, duration, recipientEmail, giftMessage } = req.body;
      const gifterId = req.user.claims.sub;

      // Calculate gift price with bulk discounts
      const basePrices = { premium: 9.99, 'premium-plus': 19.99 };
      const basePrice = basePrices[planId as keyof typeof basePrices];
      
      if (!basePrice) {
        return res.status(400).json({ message: "Invalid plan ID" });
      }

      const discounts = { 1: 0, 3: 0.05, 6: 0.10, 12: 0.17 };
      const discount = discounts[duration as keyof typeof discounts] || 0;
      const totalPrice = Math.round((basePrice * duration * (1 - discount)) * 100); // in cents

      // Create gift subscription record
      const giftSubscription = await storage.createSubscription({
        userId: recipientEmail, // Use email as temporary identifier
        planId,
        billingCycle: 'gift',
        priceId: `gift_${planId}_${duration}m`,
        status: 'gift_pending',
        gifterId,
        giftMessage,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + duration * 30 * 24 * 60 * 60 * 1000),
      });

      // In real implementation, send gift email here
      console.log(`Gift subscription created for ${recipientEmail} from user ${gifterId}`);

      res.json({ 
        giftId: giftSubscription.id,
        totalPrice: totalPrice / 100,
        message: "Gift subscription created successfully"
      });
    } catch (error) {
      console.error("Error creating gift subscription:", error);
      res.status(500).json({ message: "Failed to create gift subscription" });
    }
  });

  // Redeem gift subscription
  app.post('/api/subscriptions/redeem-gift', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { giftCode } = req.body;

      // Find pending gift subscription
      const giftSubscription = await storage.getUserSubscription(giftCode);
      
      if (!giftSubscription || giftSubscription.status !== 'gift_pending') {
        return res.status(404).json({ message: "Invalid or expired gift code" });
      }

      // Activate gift subscription for the current user
      await storage.updateSubscription(giftSubscription.id, {
        userId,
        status: 'active',
        redeemedAt: new Date()
      });

      res.json({ 
        message: "Gift subscription redeemed successfully",
        planId: giftSubscription.planId,
        expiresAt: giftSubscription.currentPeriodEnd
      });
    } catch (error) {
      console.error("Error redeeming gift subscription:", error);
      res.status(500).json({ message: "Failed to redeem gift subscription" });
    }
  });

  // Get subscription analytics for revenue tracking
  app.get('/api/admin/revenue-analytics', isAuthenticated, async (req: any, res) => {
    try {
      // This would typically require admin permissions
      const analytics = {
        totalSubscriptions: 0,
        monthlyRevenue: 0,
        annualRevenue: 0,
        giftRevenue: 0,
        conversionRate: 0,
        churnRate: 0,
      };

      // In real implementation, calculate from database
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
