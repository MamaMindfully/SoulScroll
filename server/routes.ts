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

  const httpServer = createServer(app);
  return httpServer;
}
