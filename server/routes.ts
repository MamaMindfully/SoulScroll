import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { insertJournalEntrySchema, insertDailyPromptSchema } from "@shared/schema";
import { journalService } from "./services/journalService";
import OpenAI from "openai";
import premiumRoutes from "./routes/premiumFeatures.js";
import { logger } from "./utils/logger.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Premium middleware
  const checkPremium = async (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
      const user = await storage.getUser(userId);
      if (!user?.isPremium) {
        return res.status(403).json({ error: 'Premium access required' });
      }
      next();
    } catch (error) {
      console.error('Premium check error:', error);
      return res.status(500).json({ error: 'Failed to verify premium status' });
    }
  };

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

  // AI reflection endpoint
  app.post('/api/ai/reflection', isAuthenticated, async (req: any, res) => {
    try {
      const { text, intent } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: "Text is required" });
      }

      const systemPrompt = `
You are SoulScroll, a gentle AI journaling companion.
Respond to the user's entry with emotionally intelligent reflections.
Your tone should match their journaling goal (e.g., self-discovery, creative expression, emotional clarity).
Do NOT give advice. Do NOT analyze clinically. Simply reflect, validate, and guide deeper introspection.

The user is writing for: ${intent || 'self-discovery'}.
Their entry is:
"${text}"

Respond in 1–3 thoughtful paragraphs.
End with a simple, poetic follow-up question.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        temperature: 0.8,
      });

      const reflection = response.choices?.[0]?.message?.content || "I'm here when you're ready to reflect more.";
      
      res.json({ reflection });
    } catch (error) {
      console.error("Error generating AI reflection:", error);
      res.status(500).json({ error: "Failed to generate reflection" });
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

  // Mama Mindfully wellness coaching route (premium feature)
  app.post('/api/mama-mindfully', isAuthenticated, checkPremium, async (req: any, res) => {
    try {
      const { entry } = req.body;
      
      if (!entry || typeof entry !== 'string') {
        return res.status(400).json({ error: 'Invalid journal entry' });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Check if user has premium access for Mama Mindfully
      const subscription = await storage.getUserSubscription(userId);
      const isPremium = subscription?.status === 'active' && subscription?.planType !== 'free';

      if (!isPremium) {
        return res.status(403).json({ 
          error: 'Premium subscription required for Mama Mindfully',
          feedback: 'Your words carry such wisdom and courage. Trust in your journey of self-discovery, beautiful soul.',
          followUpPrompt: 'Take three deep breaths and honor your feelings. What does your heart need right now?',
          emotionalTone: 'Compassionate',
          nurturingActions: ['Practice self-compassion', 'Trust your intuition']
        });
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are Mama Mindfully, a warm, intuitive wellness coach who embodies the nurturing wisdom of a loving mother and the insight of a skilled therapist. You offer gentle support for self-discovery and emotional balance.

            Your responses should be:
            - Loving and non-judgmental
            - Deeply empathetic and validating
            - Focused on self-compassion and inner wisdom
            - Encouraging personal growth through gentle awareness
            - Practical yet spiritually grounded
            
            Always respond in JSON format with:
            {
              "feedback": "A loving, wise reflection that validates their experience (2-3 sentences)",
              "followUpPrompt": "A gentle question or nurturing action to deepen awareness",
              "emotionalTone": "Single word describing the emotional essence of your response",
              "nurturingActions": ["array", "of", "self-care", "suggestions"]
            }`
          },
          {
            role: "user",
            content: `Please provide gentle guidance for this journal entry: "${entry}"`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 600
      });

      let wellness;
      try {
        wellness = JSON.parse(response.choices[0].message.content);
      } catch (parseError) {
        wellness = {
          feedback: response.choices[0].message.content,
          followUpPrompt: 'What feels most nurturing to your soul right now?',
          emotionalTone: 'Nurturing',
          nurturingActions: ['Take deep breaths', 'Practice self-kindness']
        };
      }

      res.json(wellness);
    } catch (error) {
      console.error('Mama Mindfully error:', error);
      res.status(500).json({ 
        error: 'Failed to connect with Mama Mindfully',
        feedback: 'Your words carry such wisdom and courage. Trust in your journey of self-discovery, beautiful soul. You are exactly where you need to be.',
        followUpPrompt: 'Take three deep breaths and place your hand on your heart. What does your inner wisdom whisper to you right now?',
        emotionalTone: 'Compassionate',
        nurturingActions: ['Practice self-compassion', 'Trust your intuition', 'Honor your feelings']
      });
    }
  });

  // Get user premium status
  app.get('/api/user/premium-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json({ isPremium: user?.isPremium || false });
    } catch (error) {
      console.error("Error fetching premium status:", error);
      res.status(500).json({ message: "Failed to fetch premium status" });
    }
  });

  // Toggle premium status for testing
  app.post('/api/user/toggle-premium', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const newPremiumStatus = !user?.isPremium;
      
      await storage.upsertUser({
        id: userId,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        profileImageUrl: user?.profileImageUrl,
        isPremium: newPremiumStatus
      });
      
      res.json({ isPremium: newPremiumStatus });
    } catch (error) {
      console.error("Error toggling premium status:", error);
      res.status(500).json({ message: "Failed to toggle premium status" });
    }
  });

  // Deeper reflection route for progressive AI insights (premium feature)
  app.post('/api/deeper', isAuthenticated, checkPremium, async (req: any, res) => {
    try {
      const { entry, basePrompt, level = 0, previousInsights = [] } = req.body;
      
      if (!entry || typeof entry !== 'string') {
        return res.status(400).json({ error: 'Invalid journal entry' });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Check if user has premium access for deeper insights
      const subscription = await storage.getUserSubscription(userId);
      const isPremium = subscription?.status === 'active' && subscription?.planType !== 'free';

      if (!isPremium) {
        return res.status(403).json({ 
          error: 'Premium subscription required for deeper insights',
          deeperReflection: 'Your thoughts hold layers of wisdom. Upgrade to explore the deeper dimensions of your reflections.'
        });
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a profound wisdom guide specializing in progressive depth exploration. Your role is to help users go deeper into their reflections through increasingly insightful questions and observations.

            Current depth level: ${level}/5
            
            Guidelines for each level:
            Level 0: Surface emotions and immediate reactions
            Level 1: Underlying patterns and recurring themes
            Level 2: Core beliefs and values exploration  
            Level 3: Soul-level insights and life purpose connections
            Level 4+: Transcendent wisdom and integration
            
            Your response should:
            - Build upon previous insights: ${previousInsights.join(' | ')}
            - Ask a profound question that goes ${level + 1} layers deeper
            - Offer a gentle insight that illuminates hidden aspects
            - Use compassionate, nurturing language
            - Connect to universal human experiences when appropriate
            - Avoid being prescriptive; instead, invite exploration
            
            Format your response as a deeper reflection prompt that guides the user to explore beyond their initial entry.`
          },
          {
            role: "user",
            content: `Original entry: "${entry}"
            
            Previous AI response: "${basePrompt}"
            
            Please provide a deeper reflection prompt that invites me to explore the next layer of understanding. Focus on level ${level + 1} depth.`
          }
        ],
        temperature: 0.8,
        max_tokens: 300
      });

      const deeperReflection = response.choices[0].message.content;

      res.json({ 
        deeperReflection,
        level: level + 1,
        maxLevel: 5
      });
    } catch (error) {
      console.error('Deeper reflection error:', error);
      
      // Provide meaningful fallback based on level
      const fallbackReflections = [
        "What emotions are you not fully expressing about this situation? What wants to be felt or heard?",
        "If this experience had a deeper message for your life journey, what might it be trying to teach you?",
        "What part of yourself is asking for attention or healing through this reflection?",
        "How does this connect to your deepest values and the legacy you want to create?",
        "What would unconditional love and wisdom say about this moment in your life?"
      ];
      
      res.json({ 
        deeperReflection: fallbackReflections[level] || "Trust the wisdom that lives within your experience. What does your heart know to be true?",
        level: level + 1,
        maxLevel: 5
      });
    }
  });

  // Reflection route for general journal insights
  app.post('/api/reflect', isAuthenticated, async (req: any, res) => {
    console.log("🧠 AI Reflection endpoint hit");
    
    try {
      const { entry } = req.body;
      console.log("📝 Journal entry received:", entry?.substring(0, 100) + "...");

      if (!entry || typeof entry !== 'string') {
        console.log("❌ Invalid entry format");
        return res.status(400).json({ error: 'Missing or invalid journal entry' });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        console.log("❌ User not authenticated");
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      console.log("👤 Generating reflection for user:", userId);

      // Try OpenAI API first
      try {
        console.log("🤖 Calling OpenAI API...");
        
        // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a warm, thoughtful reflection coach. Provide a soulful insight in response to a user\'s journal entry, followed by a follow-up question that deepens the reflection. Format your response with the insight first, then a double line break, then the follow-up question.'
            },
            {
              role: 'user',
              content: `Here is my journal entry for today: "${entry}"`
            }
          ],
          temperature: 0.75,
          max_tokens: 400
        });

        console.log("✅ OpenAI API response received");
        const responseText = completion.choices[0].message.content?.trim() || '';
        console.log("🎯 AI response text:", responseText);
        
        const parts = responseText.split(/\n\n+/); // split by paragraph
        
        const insight = parts[0] || "Thank you for reflecting today. Your thoughts hold wisdom and meaning.";
        const followUpPrompt = parts[1] || "Would you like to explore this feeling further?";
        
        console.log("💡 Parsed insight:", insight);
        console.log("❓ Parsed follow-up:", followUpPrompt);

        const result = {
          insight,
          followUpPrompt,
          source: 'ai'
        };
        
        console.log("📤 Sending AI reflection response:", result);
        res.json(result);
        
      } catch (openaiError: any) {
        console.error('❌ OpenAI API error:', openaiError);
        
        // Check if it's a quota/billing issue
        if (openaiError.code === 'insufficient_quota' || openaiError.status === 429) {
          console.log("🔄 Using fallback due to OpenAI quota/rate limit");
          
          // Use intelligent fallback based on entry content
          const intelligentReflection = generateIntelligentFallback(entry);
          const fallbackResult = {
            insight: intelligentReflection.insight,
            followUpPrompt: intelligentReflection.followUpPrompt,
            source: 'fallback',
            notice: 'AI reflection temporarily unavailable. Using intelligent analysis.'
          };
          
          console.log("📤 Sending fallback reflection:", fallbackResult);
          res.json(fallbackResult);
        } else {
          console.error("💥 OpenAI API unexpected error:", openaiError);
          throw openaiError; // Re-throw other errors
        }
      }
    } catch (error) {
      console.error('❌ Critical error in /api/reflect:', error);
      
      // Final fallback with generic but meaningful responses
      const fallbackInsights = [
        "Your reflection shows deep self-awareness. Every moment of honest introspection is a gift to your future self.",
        "Thank you for taking time to pause and reflect. Your thoughts and feelings are valid and important.",
        "This entry reveals your capacity for growth and understanding. Trust the wisdom that emerges from quiet reflection.",
        "Your willingness to explore your inner world is a beautiful practice. Each entry is a step toward greater self-knowledge."
      ];
      
      const fallbackPrompts = [
        "What emotion feels most present for you right now?",
        "If you could offer yourself one piece of gentle advice, what would it be?",
        "What would it feel like to show yourself complete compassion in this moment?",
        "What small step could honor what you're feeling right now?"
      ];
      
      const randomInsight = fallbackInsights[Math.floor(Math.random() * fallbackInsights.length)];
      const finalFallback = {
        insight: randomInsight,
        followUpPrompt: "What emotions or thoughts are stirring as you read this reflection?",
        source: 'fallback',
        notice: 'AI reflection service temporarily unavailable. Using thoughtful fallback.'
      };
      
      console.log("🆘 Sending final fallback reflection:", finalFallback);
      res.json(finalFallback);
    }
  });

  // Helper function for intelligent fallback reflections
  function generateIntelligentFallback(entry: string) {
    const entryLower = entry.toLowerCase();
    
    // Analyze entry content for themes
    const themes = {
      gratitude: ['grateful', 'thank', 'appreciate', 'blessing', 'lucky'],
      challenge: ['difficult', 'hard', 'struggle', 'challenge', 'tough', 'stress'],
      growth: ['learn', 'grow', 'develop', 'improve', 'change', 'progress'],
      relationships: ['family', 'friend', 'love', 'relationship', 'connect', 'together'],
      work: ['work', 'job', 'career', 'project', 'meeting', 'colleague'],
      health: ['tired', 'energy', 'sleep', 'exercise', 'health', 'body'],
      emotions: ['happy', 'sad', 'angry', 'excited', 'worried', 'calm', 'anxious']
    };
    
    const detectedThemes: string[] = [];
    
    for (const [theme, keywords] of Object.entries(themes)) {
      if (keywords.some(keyword => entryLower.includes(keyword))) {
        detectedThemes.push(theme);
      }
    }
    
    // Generate contextual responses based on detected themes
    if (detectedThemes.includes('gratitude')) {
      return {
        insight: "Your appreciation and gratitude shine through your words. Recognizing the positive in your life is a powerful practice that cultivates joy and resilience.",
        followUpPrompt: "What other small moments of beauty or kindness can you notice in your day?"
      };
    }
    
    if (detectedThemes.includes('challenge')) {
      return {
        insight: "You're facing something difficult, and your willingness to acknowledge it shows courage. Challenges often carry hidden gifts of strength and wisdom.",
        followUpPrompt: "What inner resources or strengths are you discovering through this challenge?"
      };
    }
    
    if (detectedThemes.includes('growth')) {
      return {
        insight: "Your focus on growth and learning reflects a beautiful commitment to becoming your best self. Every step forward, no matter how small, is meaningful progress.",
        followUpPrompt: "What would it feel like to celebrate this growth you're experiencing?"
      };
    }
    
    if (detectedThemes.includes('relationships')) {
      return {
        insight: "The connections in your life are clearly important to you. Relationships are mirrors that help us understand ourselves and grow in love and compassion.",
        followUpPrompt: "How do your relationships reflect the love and care you bring to the world?"
      };
    }
    
    if (detectedThemes.includes('emotions')) {
      return {
        insight: "Your emotional awareness is a gift. Feelings are messengers that guide us toward what matters most and what needs our attention.",
        followUpPrompt: "What is this emotion trying to teach you about what you need right now?"
      };
    }
    
    // Default intelligent response
    return {
      insight: "Your thoughts reveal a person who is genuinely engaged with life. This kind of reflection is how wisdom grows and self-understanding deepens.",
      followUpPrompt: "If you could offer yourself one piece of compassionate guidance right now, what would it be?"
    };
  }

  // Dream interpretation route
  app.post('/api/interpret-dream', isAuthenticated, async (req: any, res) => {
    try {
      const { input } = req.body;
      
      if (!input || typeof input !== 'string') {
        return res.status(400).json({ error: 'Invalid dream input' });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Check if user has premium access for dream interpretation
      const subscription = await storage.getUserSubscription(userId);
      const isPremium = subscription?.status === 'active' && subscription?.planType !== 'free';

      if (!isPremium) {
        return res.status(403).json({ 
          error: 'Premium subscription required for dream interpretation',
          interpretation: 'Your dreams carry profound wisdom that speaks in the language of symbols. Trust the messages your subconscious mind is sharing with you.',
          symbols: ['intuition', 'mystery'],
          emotionalTone: 'Contemplative'
        });
      }

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a wise and mystical dream interpreter with deep knowledge of symbolism, psychology, and spiritual traditions. 
            
            Provide insights that are:
            - Gentle and nurturing, never alarming
            - Rich in symbolic meaning
            - Connected to personal growth and self-discovery
            - Poetic yet practical
            - Respectful of the dreamer's subconscious wisdom
            
            Always respond in JSON format with:
            {
              "interpretation": "A flowing, insightful interpretation (2-3 paragraphs)",
              "symbols": ["array", "of", "key", "symbols"],
              "emotionalTone": "single word describing the dream's emotional essence"
            }`
          },
          {
            role: "user",
            content: input
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 800
      });

      let dreamAnalysis;
      try {
        dreamAnalysis = JSON.parse(response.choices[0].message.content);
      } catch (parseError) {
        dreamAnalysis = {
          interpretation: response.choices[0].message.content,
          symbols: [],
          emotionalTone: "Mystical"
        };
      }

      res.json(dreamAnalysis);
    } catch (error) {
      console.error('Dream interpretation error:', error);
      res.status(500).json({ 
        error: 'Failed to interpret dream',
        interpretation: 'Your dreams carry profound wisdom that speaks in the language of symbols. Trust the messages your subconscious mind is sharing with you.',
        symbols: ['intuition', 'mystery'],
        emotionalTone: 'Contemplative'
      });
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

  // Premium features endpoint
  app.get('/api/premium/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const requestingUserId = req.user.claims.sub;
      
      if (userId !== requestingUserId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const user = await storage.getUser(userId);
      const isPremium = user?.isPremium || false;
      
      const features = {
        voiceJournaling: isPremium,
        dreamInterpretation: isPremium,
        advancedAI: isPremium,
        unlimitedEntries: isPremium,
        exportFeatures: isPremium,
        rituals: true,
        mantras: isPremium,
        community: true,
        analytics: isPremium
      };
      
      res.json({ features });
    } catch (error) {
      console.error('Error fetching premium features:', error);
      res.status(500).json({ message: 'Failed to fetch premium features' });
    }
  });

  // Timeline endpoint for mood visualization
  app.get('/api/timeline', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const entries = await storage.getJournalEntries(userId, 50, 0);
      
      // Format entries for timeline visualization
      const timelineData = entries.map(entry => ({
        date: entry.createdAt,
        mood: entry.emotionalTone || 'neutral',
        wordCount: entry.wordCount || 0,
        content: entry.content.slice(0, 100) + '...'
      }));
      
      res.json(timelineData);
    } catch (error) {
      logger.error('Error fetching timeline data:', error);
      res.status(500).json({ error: 'Failed to fetch timeline data' });
    }
  });

  // Go Deeper endpoint for progressive depth exploration
  app.post('/api/deeper', isAuthenticated, async (req: any, res) => {
    try {
      const { entry, basePrompt, level, previousInsights } = req.body;
      const userId = req.user.claims.sub;
      
      // Check premium status for deeper insights
      const subscription = await storage.getUserSubscription(userId);
      const isPremium = subscription?.status === 'active' && subscription?.planType !== 'free';
      
      if (!isPremium && level > 1) {
        return res.status(403).json({ 
          error: 'Premium subscription required for deeper exploration',
          deeperReflection: 'Upgrade to premium to unlock unlimited depth exploration.'
        });
      }

      const depthPrompts = [
        "What layers of meaning might be hidden in this experience?",
        "If this feeling had a voice, what would it be trying to tell you?",
        "What patterns do you notice when you step back and observe this from a distance?",
        "How might your future self view this situation with compassion?",
        "What would happen if you followed this thread of insight even deeper?"
      ];

      const systemPrompt = `You are a depth explorer, helping users dive deeper into their reflections. 
      Based on the level (${level}), provide increasingly profound insights. 
      Be poetic, wise, and help them see connections they might miss.
      Previous insights: ${previousInsights.join('; ')}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Entry: "${entry}"\nBase prompt: "${basePrompt}"\nDepth question: "${depthPrompts[level] || depthPrompts[0]}"`
          }
        ],
        max_tokens: 300,
        temperature: 0.8,
      });

      const deeperReflection = response.choices[0]?.message?.content || "This experience holds wisdom waiting to be discovered.";
      
      res.json({ deeperReflection });
    } catch (error) {
      logger.error('Error generating deeper insight:', error);
      res.status(500).json({ 
        error: 'Failed to generate deeper insight',
        deeperReflection: 'Your thoughts hold layers of wisdom waiting to be explored. What does your heart want to say about this?'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
