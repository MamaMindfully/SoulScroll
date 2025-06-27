import { Router } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { aiJournalEngine } from "../engines/aiJournalEngine";
import { z } from "zod";
import Stripe from "stripe";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Validation schemas
const createSubscriptionSchema = z.object({
  priceId: z.string(),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional()
});

const journalEntrySchema = z.object({
  content: z.string().min(1),
  mood: z.number().min(1).max(10).optional(),
  tags: z.array(z.string()).optional()
});

// POST /api/create-subscription - Enhanced with proper trial and customer handling
router.post('/create-subscription', isAuthenticated, async (req, res) => {
  try {
    const { userId, email } = req.body;
    const user = req.user;

    logger.info('Creating subscription', { userId: user.id, email: user.email });

    // Create customer if not exists
    let customer;
    try {
      const existingSubscription = await storage.getUserSubscription(user.id);
      if (existingSubscription?.stripeCustomerId) {
        customer = await stripe.customers.retrieve(existingSubscription.stripeCustomerId);
      }
    } catch (error) {
      logger.debug('No existing customer found, creating new one');
    }

    if (!customer) {
      customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id }
      });
    }

    // Create subscription with trial
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: process.env.STRIPE_PRICE_ID }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      trial_period_days: 14,
      metadata: {
        userId: user.id
      }
    });

    // Save subscription data in database
    try {
      await storage.updateSubscription(user.id, {
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        status: 'trialing',
        planType: 'monthly',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
      });
    } catch (updateError) {
      // Create new subscription record if update fails
      await storage.createSubscription({
        userId: user.id,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        status: 'trialing',
        planType: 'monthly',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      });
    }

    logger.info('Subscription created successfully', { 
      subscriptionId: subscription.id,
      customerId: customer.id,
      status: subscription.status
    });

    // Send client secret to frontend for payment confirmation
    res.json({
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      subscriptionId: subscription.id,
      customerId: customer.id,
      status: subscription.status
    });

  } catch (error) {
    logger.error('Subscription creation failed', { error: error.message });
    res.status(500).json({ error: 'Subscription creation failed' });
  }
});

// GET /api/user/:id/progress
router.get('/user/:id/progress', isAuthenticated, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Verify user can access this data
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    logger.info('Fetching user progress', { userId });

    const [stats, insights, achievements] = await Promise.all([
      storage.getUserStats(userId),
      storage.getEmotionalInsights(userId, 'month'),
      storage.getUserAchievements(userId)
    ]);

    const progressData = {
      stats,
      insights: insights.slice(0, 5), // Last 5 insights
      achievements: achievements.slice(0, 10), // Recent achievements
      streakData: {
        current: stats.currentStreak,
        longest: stats.longestStreak,
        weeklyGoal: 7,
        monthlyGoal: 30
      },
      moodTrends: insights.map(insight => ({
        date: insight.createdAt,
        mood: insight.averageMood,
        insights: insight.insights
      }))
    };

    logger.info('Progress data fetched', { userId, dataPoints: insights.length });
    res.json(progressData);
  } catch (error) {
    logger.error('Error fetching progress', { error: error.message, userId: req.params.id });
    res.status(500).json({ error: 'Failed to fetch progress data' });
  }
});

// POST /api/journal
router.post('/journal', isAuthenticated, async (req, res) => {
  try {
    const { content, mood, tags } = journalEntrySchema.parse(req.body);
    const user = req.user;

    logger.info('Creating journal entry', { userId: user.id, contentLength: content.length });

    // Create journal entry
    const entry = await storage.createJournalEntry(user.id, {
      content,
      wordCount: content.split(/\s+/).length,
      mood: mood || 5,
      tags: tags || []
    });

    // Update user streak
    await storage.updateUserStreak(user.id);

    // Trigger AI analysis (async)
    setTimeout(async () => {
      try {
        logger.info('Starting AI analysis for journal entry', { entryId: entry.id });
        
        // Get recent entries for context
        const recentEntries = await storage.getJournalEntries(user.id, 5, 0);
        
        // Perform AI analysis
        const analysis = await aiJournalEngine.analyzeJournalEntry(content, user.id);
        const emotions = await aiJournalEngine.detectEmotions(content);
        const reflection = await aiJournalEngine.generatePersonalizedReflection(
          content, 
          user.id, 
          recentEntries
        );
        const insights = await aiJournalEngine.scoreInsightDepth(content);

        // Update entry with AI analysis
        await storage.updateJournalEntry(entry.id, {
          aiResponse: reflection,
          emotionScore: emotions.intensity,
          themes: analysis.themes,
          insights: analysis.insights
        });

        // Create emotional insight record
        await storage.createEmotionalInsight(user.id, {
          period: 'daily',
          averageMood: mood || 5,
          insights: analysis.insights,
          emotionalPatterns: analysis.themes,
          recommendations: analysis.suggestions
        });

        logger.info('AI analysis completed successfully', { 
          entryId: entry.id,
          emotionScore: emotions.intensity,
          insightDepth: insights.depth
        });

      } catch (error) {
        logger.error('AI analysis failed', { entryId: entry.id, error: error.message });
      }
    }, 1000);

    logger.info('Journal entry created', { entryId: entry.id });
    res.json({ 
      entry,
      message: 'Journal entry saved successfully',
      aiAnalyzing: true
    });
  } catch (error) {
    logger.error('Error creating journal entry', { error: error.message });
    res.status(500).json({ error: 'Failed to save journal entry' });
  }
});

// GET /api/secret-scrolls
router.get('/secret-scrolls', isAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    logger.info('Fetching secret scrolls', { userId: user.id });

    const userStats = await storage.getUserStats(user.id);
    const scrolls = await storage.getSecretScrolls(user.id);

    // Determine available scrolls based on user progress
    const availableScrolls = [];
    
    if (userStats.totalEntries >= 7) {
      availableScrolls.push({
        id: 'week_warrior',
        title: 'Week Warrior',
        description: 'You have journaled for 7 days',
        unlocked: true,
        content: 'The path of self-discovery begins with consistent steps...'
      });
    }

    if (userStats.currentStreak >= 30) {
      availableScrolls.push({
        id: 'moon_cycle',
        title: 'Moon Cycle Master',
        description: 'You have maintained a 30-day streak',
        unlocked: true,
        content: 'Like the moon, you have found your rhythm...'
      });
    }

    if (userStats.totalEntries >= 100) {
      availableScrolls.push({
        id: 'century_sage',
        title: 'Century Sage',
        description: 'You have written 100 journal entries',
        unlocked: true,
        content: 'Your wisdom has grown through countless reflections...'
      });
    }

    logger.info('Secret scrolls fetched', { 
      userId: user.id, 
      totalScrolls: availableScrolls.length 
    });

    res.json({
      scrolls: availableScrolls,
      userProgress: {
        totalEntries: userStats.totalEntries,
        currentStreak: userStats.currentStreak,
        nextMilestone: getNextMilestone(userStats.totalEntries)
      }
    });
  } catch (error) {
    logger.error('Error fetching secret scrolls', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch secret scrolls' });
  }
});

// GET /api/emotions/graph
router.get('/emotions/graph', isAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    const { period = '30', type = 'mood' } = req.query;
    
    logger.info('Fetching emotion graph data', { 
      userId: user.id, 
      period, 
      type 
    });

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period as string));

    // Get journal entries for the period
    const entries = await storage.getJournalEntries(user.id, 100, 0);
    const filteredEntries = entries.filter(entry => 
      entry.createdAt >= startDate && entry.createdAt <= endDate
    );

    // Get emotional insights
    const insights = await storage.getEmotionalInsights(user.id, 'month');

    // Build graph data
    const graphData = filteredEntries.map(entry => ({
      date: entry.createdAt.toISOString().split('T')[0],
      mood: entry.mood || 5,
      emotionScore: entry.emotionScore || 0,
      wordCount: entry.wordCount,
      hasReflection: !!entry.aiResponse
    }));

    // Group by date and calculate averages
    const dailyData = groupByDate(graphData);
    const trends = calculateTrends(dailyData);

    logger.info('Emotion graph data processed', { 
      userId: user.id, 
      dataPoints: dailyData.length 
    });

    res.json({
      data: dailyData,
      trends,
      insights: insights.slice(0, 3),
      summary: {
        averageMood: trends.averageMood,
        moodVariability: trends.moodVariability,
        totalEntries: filteredEntries.length,
        period: `${period} days`
      }
    });
  } catch (error) {
    logger.error('Error fetching emotion graph', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch emotion data' });
  }
});

// Helper functions
function getNextMilestone(totalEntries: number): { type: string; target: number; progress: number } {
  const milestones = [7, 30, 50, 100, 365, 1000];
  const nextTarget = milestones.find(m => m > totalEntries) || 2000;
  
  return {
    type: getMilestoneType(nextTarget),
    target: nextTarget,
    progress: (totalEntries / nextTarget) * 100
  };
}

function getMilestoneType(target: number): string {
  const types = {
    7: 'Week Warrior',
    30: 'Month Master',
    50: 'Dedication Badge',
    100: 'Century Sage',
    365: 'Year of Wisdom',
    1000: 'Enlightened One'
  };
  return types[target] || 'Legendary Status';
}

function groupByDate(data: any[]): any[] {
  const grouped = data.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) {
      acc[date] = {
        date,
        moods: [],
        emotionScores: [],
        wordCounts: [],
        reflectionCount: 0
      };
    }
    acc[date].moods.push(item.mood);
    acc[date].emotionScores.push(item.emotionScore);
    acc[date].wordCounts.push(item.wordCount);
    if (item.hasReflection) acc[date].reflectionCount++;
    return acc;
  }, {});

  return Object.values(grouped).map((day: any) => ({
    date: day.date,
    mood: day.moods.reduce((a, b) => a + b, 0) / day.moods.length,
    emotionScore: day.emotionScores.reduce((a, b) => a + b, 0) / day.emotionScores.length,
    avgWordCount: day.wordCounts.reduce((a, b) => a + b, 0) / day.wordCounts.length,
    entries: day.moods.length,
    reflections: day.reflectionCount
  }));
}

function calculateTrends(data: any[]): any {
  if (data.length === 0) return { averageMood: 5, moodVariability: 0 };
  
  const moods = data.map(d => d.mood);
  const averageMood = moods.reduce((a, b) => a + b, 0) / moods.length;
  const variance = moods.reduce((acc, mood) => acc + Math.pow(mood - averageMood, 2), 0) / moods.length;
  const moodVariability = Math.sqrt(variance);

  return {
    averageMood: Math.round(averageMood * 10) / 10,
    moodVariability: Math.round(moodVariability * 10) / 10,
    trend: data.length > 1 ? (data[data.length - 1].mood - data[0].mood) : 0
  };
}

export default router;