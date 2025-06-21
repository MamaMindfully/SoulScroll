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

  // Multi-round deeper exploration with conversation threading
  app.post('/api/deeper-thread', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, level, isPremium, originalPrompt } = req.body;
      const userId = req.user.claims.sub;
      
      // Check premium status for deeper insights
      if (!isPremium && level > 0) {
        return res.status(403).json({ 
          error: 'Premium subscription required for deeper exploration',
          deeperReflection: 'Upgrade to premium to unlock unlimited depth exploration and multi-round conversations.'
        });
      }

      // Progressive depth system prompts
      const depthSystemPrompts = [
        `You are Arc, a gentle depth explorer. The user is beginning to explore their thoughts more deeply. 
        Ask questions that help them see patterns or emotions they might not have noticed. 
        Be curious and supportive. Keep responses 2-3 sentences.`,
        
        `You are Arc, guiding someone deeper into self-discovery. They're ready for more meaningful insights. 
        Help them connect this experience to broader themes in their life. 
        Use gentle metaphors and invite them to explore the "why" behind their feelings.`,
        
        `You are Arc, working with someone at a core level of reflection. They're touching something significant. 
        Help them understand the deeper meaning and how this connects to their values or fears. 
        Be profound but accessible.`,
        
        `You are Arc, supporting someone in soul-level exploration. They're accessing deep wisdom. 
        Help them see how this insight might transform their perspective or guide future decisions. 
        Honor the depth they've reached.`,
        
        `You are Arc, witnessing transcendent-level insight. This is sacred territory. 
        Help them integrate this wisdom and see how it connects to their larger journey. 
        Be reverent and deeply supportive.`
      ];

      const systemPrompt = depthSystemPrompts[level] || depthSystemPrompts[0];

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.7,
      });

      const deeperReflection = response.choices[0]?.message?.content || "There's something profound here waiting to be discovered. What feels most alive in this exploration for you?";
      
      res.json({ deeperReflection });
    } catch (error) {
      logger.error('Error generating threaded deeper insight:', error);
      res.status(500).json({ 
        error: 'Failed to generate deeper insight',
        deeperReflection: 'Your thoughts hold layers of wisdom waiting to be explored. What aspect of this feels most significant to you right now?'
      });
    }
  });

  // Stripe checkout session creation
  app.post('/api/stripe/create-checkout-session', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { planType, successUrl, cancelUrl } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Price IDs for different plans (these should match your Stripe dashboard)
      const priceIds = {
        monthly: process.env.STRIPE_PRICE_ID_MONTHLY || process.env.STRIPE_PRICE_ID,
        yearly: process.env.STRIPE_PRICE_ID_YEARLY || process.env.STRIPE_PRICE_ID
      };

      const session = await stripe.checkout.sessions.create({
        customer_email: user.email,
        line_items: [{
          price: priceIds[planType as keyof typeof priceIds],
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: userId,
          planType: planType
        },
        subscription_data: {
          trial_period_days: 7, // 7-day free trial
          metadata: {
            userId: userId,
            planType: planType
          }
        }
      });

      res.json({ 
        clientSecret: session.client_secret,
        sessionId: session.id,
        url: session.url 
      });
    } catch (error) {
      logger.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // Save reflection endpoint
  app.post('/api/reflections/save', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reflectionText, action, archived, dismissed } = req.body;

      // Use raw SQL since this table isn't in our Drizzle schema yet
      const result = await db.execute(sql`
        INSERT INTO saved_reflections (user_id, reflection_text, archived, dismissed)
        VALUES (${userId}, ${reflectionText}, ${archived || false}, ${dismissed || false})
        RETURNING *
      `);

      res.json({ success: true, reflection: result.rows[0] });
    } catch (error) {
      logger.error('Error saving reflection:', error);
      res.status(500).json({ error: 'Failed to save reflection' });
    }
  });

  // Get saved reflections
  app.get('/api/reflections/saved', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const result = await db.execute(sql`
        SELECT * FROM saved_reflections 
        WHERE user_id = ${userId} AND archived = true 
        ORDER BY created_at DESC 
        LIMIT 50
      `);

      res.json(result.rows);
    } catch (error) {
      logger.error('Error fetching saved reflections:', error);
      res.status(500).json({ error: 'Failed to fetch saved reflections' });
    }
  });

  // Embeddings endpoint for memory loop engine
  app.post('/api/embeddings', isAuthenticated, async (req: any, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });

      res.json({ embedding: response.data[0].embedding });
    } catch (error) {
      logger.error('Error creating embedding:', error);
      res.status(500).json({ error: 'Failed to create embedding' });
    }
  });

  // Ritual progress endpoints
  app.get('/api/ritual-progress/:weekId', isAuthenticated, async (req: any, res) => {
    try {
      const { weekId } = req.params;
      const userId = req.user.claims.sub;

      // For now, return mock data - in production this would query the database
      res.json({
        exists: false,
        completed_days: 0,
        reward_claimed: false
      });
    } catch (error) {
      logger.error('Error getting ritual progress:', error);
      res.status(500).json({ error: 'Failed to get ritual progress' });
    }
  });

  app.post('/api/ritual-progress', isAuthenticated, async (req: any, res) => {
    try {
      const { week_id, completed_days, reward_claimed } = req.body;
      const userId = req.user.claims.sub;

      // In production, this would create a database entry
      res.json({ success: true, id: Date.now() });
    } catch (error) {
      logger.error('Error creating ritual progress:', error);
      res.status(500).json({ error: 'Failed to create ritual progress' });
    }
  });

  app.patch('/api/ritual-progress/:weekId', isAuthenticated, async (req: any, res) => {
    try {
      const { weekId } = req.params;
      const updates = req.body;
      const userId = req.user.claims.sub;

      // In production, this would update the database
      res.json({ success: true, ...updates });
    } catch (error) {
      logger.error('Error updating ritual progress:', error);
      res.status(500).json({ error: 'Failed to update ritual progress' });
    }
  });

  // Affirmation to action endpoint
  app.post('/api/affirmation-to-action', isAuthenticated, async (req: any, res) => {
    try {
      const { affirmation } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a practical wisdom guide. Turn affirmations into concrete, doable actions for today. Be specific, actionable, and inspiring. Format: 'Today's soul-task: [specific action]'"
          },
          {
            role: "user",
            content: `Turn this affirmation into a practical, real-world challenge for today: "${affirmation}"`
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      const actionText = response.choices[0]?.message?.content || "Today's soul-task: Take one mindful breath and set a positive intention.";
      
      res.json({ action: actionText });
    } catch (error) {
      logger.error('Error generating action from affirmation:', error);
      res.status(500).json({ error: 'Failed to generate action' });
    }
  });

  // Daily affirmation endpoint
  app.get('/api/daily-affirmation', isAuthenticated, async (req: any, res) => {
    try {
      const affirmations = [
        "I am grounded and focused",
        "I trust my inner wisdom", 
        "I am worthy of love and respect",
        "I embrace growth and change",
        "I am grateful for this moment",
        "I radiate positive energy",
        "I am creative and resourceful",
        "I choose peace over worry",
        "I am strong and resilient",
        "I attract abundance in all forms"
      ];

      const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
      res.json({ affirmation: randomAffirmation });
    } catch (error) {
      logger.error('Error getting daily affirmation:', error);
      res.status(500).json({ error: 'Failed to get daily affirmation' });
    }
  });

  // Weekly theme generation
  app.post('/api/generate-weekly-theme', isAuthenticated, async (req: any, res) => {
    try {
      const { weekId } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a spiritual guide creating weekly themes for personal growth. Generate a beautiful, inspiring theme with title, description, color, and affirmation. Respond in JSON format."
          },
          {
            role: "user",
            content: `Generate a weekly theme for spiritual growth and journaling for week ${weekId}. Include: title, description, color, and affirmation.`
          }
        ],
        max_tokens: 200,
        temperature: 0.8,
      });

      try {
        const theme = JSON.parse(response.choices[0]?.message?.content || '{}');
        res.json({ theme });
      } catch (parseError) {
        // Fallback if JSON parsing fails
        res.json({
          theme: {
            title: "Inner Wisdom",
            description: "Trust the guidance that comes from within",
            color: "purple",
            affirmation: "I trust my inner wisdom to guide me"
          }
        });
      }
    } catch (error) {
      logger.error('Error generating weekly theme:', error);
      res.status(500).json({ error: 'Failed to generate weekly theme' });
    }
  });

  // Action completion tracking
  app.post('/api/action-completion', isAuthenticated, async (req: any, res) => {
    try {
      const { action, completed, completed_at } = req.body;
      const userId = req.user.claims.sub;

      // In production, this would store in database
      res.json({ success: true, id: Date.now() });
    } catch (error) {
      logger.error('Error tracking action completion:', error);
      res.status(500).json({ error: 'Failed to track action completion' });
    }
  });

  // Weekly action progress
  app.get('/api/weekly-action-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Mock data - in production this would query database
      res.json({
        completed_count: 5,
        total_count: 7,
        completion_rate: 0.71,
        streak_days: 3,
        favorite_type: 'mindfulness'
      });
    } catch (error) {
      logger.error('Error getting weekly action progress:', error);
      res.status(500).json({ error: 'Failed to get weekly action progress' });
    }
  });

  // Personalized action generation
  app.post('/api/personalized-action', isAuthenticated, async (req: any, res) => {
    try {
      const { profile, recent_entries } = req.body;

      const entriesText = recent_entries ? recent_entries.map((e: any) => e.content).join('\n') : '';
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Based on the user's recent journal entries, suggest a personalized action that addresses their current emotional state and growth areas. Be specific and actionable."
          },
          {
            role: "user",
            content: `Based on these recent journal entries, suggest a personalized action for today:\n\n${entriesText}`
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      const action = response.choices[0]?.message?.content || "Take time to reflect on your recent growth and celebrate your progress.";
      
      res.json({ action: `Today's soul-task: ${action}` });
    } catch (error) {
      logger.error('Error generating personalized action:', error);
      res.status(500).json({ error: 'Failed to generate personalized action' });
    }
  });

  // Secret Scroll endpoints
  app.post('/api/generate-secret-scroll', isAuthenticated, async (req: any, res) => {
    try {
      const { milestone, userId } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a mystical scroll generator. Create poetic, inspiring rewards for journaling milestones. Include a profound quote and practical wisdom. Be mystical but grounded, spiritual but accessible."
          },
          {
            role: "user",
            content: `Generate a mystical reward scroll for someone who has written ${milestone} journal entries. Include: a poetic title, an inspiring quote, and a piece of wisdom/advice for their continued journey.`
          }
        ],
        max_tokens: 300,
        temperature: 0.8,
      });

      const scrollText = response.choices[0]?.message?.content || "Your journey continues to unfold with wisdom and grace.";
      
      res.json({ scroll: scrollText });
    } catch (error) {
      logger.error('Error generating secret scroll:', error);
      res.status(500).json({ error: 'Failed to generate secret scroll' });
    }
  });

  app.post('/api/secret-scrolls', isAuthenticated, async (req: any, res) => {
    try {
      const { scroll_text, milestone } = req.body;
      const userId = req.user.claims.sub;

      // In production, this would save to database
      res.json({ success: true, id: Date.now(), scroll_text, milestone });
    } catch (error) {
      logger.error('Error saving secret scroll:', error);
      res.status(500).json({ error: 'Failed to save secret scroll' });
    }
  });

  app.get('/api/secret-scrolls', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit || 10;

      // Mock data - in production this would query database
      res.json([]);
    } catch (error) {
      logger.error('Error fetching secret scrolls:', error);
      res.status(500).json({ error: 'Failed to fetch secret scrolls' });
    }
  });

  app.get('/api/secret-scrolls/milestone/:milestone', isAuthenticated, async (req: any, res) => {
    try {
      const { milestone } = req.params;
      const userId = req.user.claims.sub;

      // Mock data - in production this would query database
      res.json(null);
    } catch (error) {
      logger.error('Error fetching scroll by milestone:', error);
      res.status(500).json({ error: 'Failed to fetch scroll by milestone' });
    }
  });

  // Emotional resonance endpoints
  app.post('/api/score-emotion', isAuthenticated, async (req: any, res) => {
    try {
      const { entry_text, entry_id } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Rate the emotional intensity of journal entries on a scale of 1-10, where 1 is flat/emotionless and 10 is extremely emotionally charged. Consider word choice, punctuation, capitalization, and overall emotional engagement. Return only a number."
          },
          {
            role: "user",
            content: `Rate the emotional intensity of this journal entry:\n\n"${entry_text}"`
          }
        ],
        max_tokens: 10,
        temperature: 0.3,
      });

      const scoreText = response.choices[0]?.message?.content?.trim() || "5";
      const emotion_score = Math.max(1, Math.min(10, parseInt(scoreText) || 5));

      // Update the journal entry with emotion score
      if (entry_id) {
        await storage.updateJournalEntry(entry_id, { emotion_score });
      }

      res.json({ emotion_score });
    } catch (error) {
      logger.error('Error scoring emotion:', error);
      res.status(500).json({ error: 'Failed to score emotion' });
    }
  });

  app.get('/api/emotional-trends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const days = parseInt(req.query.days as string) || 30;

      const entries = await storage.getJournalEntries(userId, 1000);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const recentEntries = entries.filter(entry => 
        new Date(entry.createdAt) >= cutoffDate && entry.emotion_score
      );

      const trends = recentEntries.map(entry => ({
        date: entry.createdAt,
        emotion_score: entry.emotion_score,
        word_count: entry.wordCount
      }));

      res.json(trends);
    } catch (error) {
      logger.error('Error fetching emotional trends:', error);
      res.status(500).json({ error: 'Failed to fetch emotional trends' });
    }
  });

  app.post('/api/generate-emotional-insight', isAuthenticated, async (req: any, res) => {
    try {
      const { pattern } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an emotional intelligence coach. Analyze emotional patterns and provide gentle, encouraging insights about the user's emotional journey. Be supportive and offer practical wisdom."
          },
          {
            role: "user",
            content: `Based on this emotional pattern analysis, provide an insight: Average intensity: ${pattern.average_intensity}, Trend: ${pattern.trend_direction}, Volatility: ${pattern.volatility}`
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const insight = response.choices[0]?.message?.content || "Your emotional journey shows growth and self-awareness.";
      
      res.json({ insight });
    } catch (error) {
      logger.error('Error generating emotional insight:', error);
      res.status(500).json({ error: 'Failed to generate emotional insight' });
    }
  });

  app.get('/api/high-intensity-entries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const threshold = parseInt(req.query.threshold as string) || 7;
      const limit = parseInt(req.query.limit as string) || 10;

      const entries = await storage.getJournalEntries(userId, 1000);
      const highIntensityEntries = entries
        .filter(entry => entry.emotion_score && entry.emotion_score >= threshold)
        .slice(0, limit);

      res.json(highIntensityEntries);
    } catch (error) {
      logger.error('Error fetching high intensity entries:', error);
      res.status(500).json({ error: 'Failed to fetch high intensity entries' });
    }
  });

  app.get('/api/emotional-milestones', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Mock milestones - in production this would be calculated from actual data
      res.json({
        total_entries_with_scores: 15,
        average_emotional_intensity: 6.2,
        highest_intensity_reached: 9,
        emotional_range_explored: 7,
        days_tracking_emotions: 12
      });
    } catch (error) {
      logger.error('Error fetching emotional milestones:', error);
      res.status(500).json({ error: 'Failed to fetch emotional milestones' });
    }
  });

  app.patch('/api/journal/entries/:entryId/emotion', isAuthenticated, async (req: any, res) => {
    try {
      const { entryId } = req.params;
      const { emotion_score } = req.body;
      const userId = req.user.claims.sub;

      const entry = await storage.getJournalEntryById(parseInt(entryId));
      if (!entry || entry.userId !== userId) {
        return res.status(404).json({ error: 'Entry not found' });
      }

      const updatedEntry = await storage.updateJournalEntry(parseInt(entryId), { emotion_score });
      res.json(updatedEntry);
    } catch (error) {
      logger.error('Error updating entry emotion score:', error);
      res.status(500).json({ error: 'Failed to update entry emotion score' });
    }
  });

  // Mentor persona endpoint
  app.patch('/api/user/mentor-persona', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { mentor_persona } = req.body;

      // Validate persona
      const validPersonas = ['sage', 'poet', 'coach', 'friend'];
      if (!validPersonas.includes(mentor_persona)) {
        return res.status(400).json({ error: 'Invalid mentor persona' });
      }

      // Update user mentor persona (would be done via storage interface in production)
      const updatedUser = await storage.upsertUser({ 
        id: userId,
        mentorPersona: mentor_persona 
      });

      res.json({ success: true, mentor_persona });
    } catch (error) {
      logger.error('Error updating mentor persona:', error);
      res.status(500).json({ error: 'Failed to update mentor persona' });
    }
  });

  // Generate insight with persona
  app.post('/api/generate-insight-with-persona', isAuthenticated, async (req: any, res) => {
    try {
      const { entry_text, persona_key, system_prompt, context } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: system_prompt
          },
          {
            role: "user",
            content: `The user has written: "${entry_text}"\n\nProvide a thoughtful response that matches your persona and offers meaningful insight. ${context}`
          }
        ],
        max_tokens: 400,
        temperature: 0.85,
      });

      const insight = response.choices[0]?.message?.content || "Your words reflect a journey of growth and self-discovery.";
      
      res.json({ insight });
    } catch (error) {
      logger.error('Error generating insight with persona:', error);
      res.status(500).json({ error: 'Failed to generate insight' });
    }
  });

  // Generate personalized response with persona
  app.post('/api/generate-personalized-response', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, persona_key, entry_text } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content: entry_text
          }
        ],
        max_tokens: 350,
        temperature: 0.8,
      });

      const personalizedResponse = response.choices[0]?.message?.content || "Thank you for sharing your thoughts with me.";
      
      res.json({ response: personalizedResponse });
    } catch (error) {
      logger.error('Error generating personalized response:', error);
      res.status(500).json({ error: 'Failed to generate personalized response' });
    }
  });

  // Generate deep insight with persona
  app.post('/api/generate-deep-insight', isAuthenticated, async (req: any, res) => {
    try {
      const { prompt, persona_key, depth_level, entry_text } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content: `At depth level ${depth_level}, help me explore: "${entry_text}"`
          }
        ],
        max_tokens: 450,
        temperature: 0.8,
      });

      const deepInsight = response.choices[0]?.message?.content || "There are deeper layers to explore in your experience.";
      
      res.json({ insight: deepInsight });
    } catch (error) {
      logger.error('Error generating deep insight:', error);
      res.status(500).json({ error: 'Failed to generate deep insight' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
