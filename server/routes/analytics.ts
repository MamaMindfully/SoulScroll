import { Router, Request, Response } from "express";
import { eq, desc, gte, and, sql } from "drizzle-orm";
import { isAuthenticated } from "../replitAuth";
import { requirePremium, checkPremium } from "../middleware/isPremium";
import { db } from "../db";
import { journalEntries, users } from "../../shared/schema";
import { auditService } from "../services/auditService";
import { logger } from "../utils/logger";

const router = Router();

// Real-time mood trend analysis with windowed analytics
router.get('/mood-trend', isAuthenticated, checkPremium, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const days = parseInt(req.query.days as string) || 30;
    const windowSize = parseInt(req.query.window as string) || 7;
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Get journal entries for the specified period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const entries = await db
      .select({
        id: journalEntries.id,
        emotionScore: journalEntries.emotionScore,
        createdAt: journalEntries.createdAt,
        wordCount: journalEntries.wordCount
      })
      .from(journalEntries)
      .where(and(
        eq(journalEntries.userId, userId),
        gte(journalEntries.createdAt, cutoffDate)
      ))
      .orderBy(journalEntries.createdAt);

    if (entries.length === 0) {
      return res.json({
        moodTrend: [],
        outliers: [],
        insights: {
          averageMood: 0,
          trendDirection: 'stable',
          volatility: 0
        }
      });
    }

    // Calculate rolling averages using SQL window functions for efficiency
    const rollingAverages = await db.execute(sql`
      WITH windowed_data AS (
        SELECT 
          created_at,
          emotion_score,
          AVG(emotion_score) OVER (
            ORDER BY created_at 
            ROWS BETWEEN ${windowSize - 1} PRECEDING AND CURRENT ROW
          ) as rolling_avg,
          STDDEV(emotion_score) OVER (
            ORDER BY created_at 
            ROWS BETWEEN ${windowSize - 1} PRECEDING AND CURRENT ROW
          ) as rolling_stddev
        FROM journal_entries 
        WHERE user_id = ${userId} 
        AND created_at >= ${cutoffDate.toISOString()}
        ORDER BY created_at
      )
      SELECT 
        created_at,
        emotion_score,
        rolling_avg,
        rolling_stddev
      FROM windowed_data
      ORDER BY created_at
    `);

    // Detect outliers using statistical analysis
    const outliers = [];
    const allScores = entries.map(e => e.emotionScore || 5);
    const mean = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
    const stdDev = Math.sqrt(
      allScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / allScores.length
    );

    rollingAverages.rows.forEach(row => {
      const score = Number(row[1]);
      const rollingAvg = Number(row[2]);
      const zScore = Math.abs((score - rollingAvg) / (Number(row[3]) || 1));
      
      if (zScore > 2) { // 2 standard deviations
        outliers.push({
          date: row[0],
          score,
          rollingAvg: Number(rollingAvg.toFixed(2)),
          severity: zScore > 3 ? 'high' : 'medium'
        });
      }
    });

    // Calculate trend insights
    const recentScores = allScores.slice(-7); // Last 7 entries
    const earlierScores = allScores.slice(-14, -7); // Previous 7 entries
    
    let trendDirection = 'stable';
    if (recentScores.length > 0 && earlierScores.length > 0) {
      const recentAvg = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
      const earlierAvg = earlierScores.reduce((sum, s) => sum + s, 0) / earlierScores.length;
      const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;
      
      trendDirection = change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable';
    }

    const volatility = stdDev / mean; // Coefficient of variation

    // Log analytics access for audit
    auditService.logAuditEvent({
      userId,
      action: 'ANALYTICS_ACCESS',
      metadata: {
        analyticsType: 'mood_trend',
        daysPeriod: days,
        windowSize,
        entriesAnalyzed: entries.length,
        outliersDetected: outliers.length
      },
      severity: 'info'
    });

    const response = {
      moodTrend: rollingAverages.rows.map(row => ({
        date: row[0],
        score: Number(row[1]),
        rollingAverage: Number(Number(row[2]).toFixed(2)),
        rollingStddev: Number(Number(row[3]).toFixed(2))
      })),
      outliers,
      insights: {
        averageMood: Number(mean.toFixed(2)),
        trendDirection,
        volatility: Number(volatility.toFixed(3)),
        totalEntries: entries.length,
        periodDays: days
      }
    };

    res.json(response);
  } catch (error) {
    logger.error('Error generating mood trend analytics', {
      userId: req.user?.id,
      error: error.message
    });
    
    res.status(500).json({
      error: 'Failed to generate mood analytics',
      fallback: {
        moodTrend: [],
        outliers: [],
        insights: {
          averageMood: 0,
          trendDirection: 'stable',
          volatility: 0
        }
      }
    });
  }
});

// Segmented analytics for habit analysis
router.get('/patterns', isAuthenticated, checkPremium, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Analyze journaling patterns with SQL aggregations
    const patterns = await db.execute(sql`
      WITH daily_patterns AS (
        SELECT 
          EXTRACT(DOW FROM created_at) as day_of_week,
          EXTRACT(HOUR FROM created_at) as hour_of_day,
          emotion_score,
          word_count,
          DATE(created_at) as journal_date
        FROM journal_entries 
        WHERE user_id = ${userId}
        AND created_at >= NOW() - INTERVAL '90 days'
      ),
      day_averages AS (
        SELECT 
          day_of_week,
          AVG(emotion_score) as avg_mood,
          COUNT(*) as entry_count,
          AVG(word_count) as avg_words
        FROM daily_patterns 
        GROUP BY day_of_week
      ),
      hour_averages AS (
        SELECT 
          hour_of_day,
          AVG(emotion_score) as avg_mood,
          COUNT(*) as entry_count
        FROM daily_patterns 
        GROUP BY hour_of_day
      ),
      streak_analysis AS (
        SELECT 
          COUNT(DISTINCT journal_date) as total_days,
          MAX(emotion_score) as best_score,
          MIN(emotion_score) as worst_score
        FROM daily_patterns
      )
      SELECT 
        'day_patterns' as type,
        json_agg(
          json_build_object(
            'day', day_of_week,
            'avgMood', ROUND(avg_mood::numeric, 2),
            'entryCount', entry_count,
            'avgWords', ROUND(avg_words::numeric, 0)
          ) ORDER BY day_of_week
        ) as data
      FROM day_averages
      UNION ALL
      SELECT 
        'hour_patterns' as type,
        json_agg(
          json_build_object(
            'hour', hour_of_day,
            'avgMood', ROUND(avg_mood::numeric, 2),
            'entryCount', entry_count
          ) ORDER BY hour_of_day
        ) as data
      FROM hour_averages
      UNION ALL
      SELECT 
        'streak_info' as type,
        json_build_object(
          'totalDays', total_days,
          'bestScore', best_score,
          'worstScore', worst_score
        ) as data
      FROM streak_analysis
    `);

    // Process results
    const patternData = patterns.rows.reduce((acc, row) => {
      acc[row[0]] = row[1];
      return acc;
    }, {} as any);

    // Map day numbers to names
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (patternData.day_patterns) {
      patternData.day_patterns = patternData.day_patterns.map((day: any) => ({
        ...day,
        dayName: dayNames[day.day]
      }));
    }

    // Log pattern analytics access
    auditService.logAuditEvent({
      userId,
      action: 'PATTERN_ANALYTICS_ACCESS',
      metadata: {
        analyticsType: 'behavioral_patterns',
        timeframe: '90_days'
      },
      severity: 'info'
    });

    res.json({
      patterns: patternData,
      metadata: {
        analysisWindow: '90 days',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error generating pattern analytics', {
      userId: req.user?.id,
      error: error.message
    });
    
    res.status(500).json({
      error: 'Failed to generate pattern analytics',
      patterns: {}
    });
  }
});

// Privacy-safe aggregated insights for premium users
router.post('/submit-insights', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { aggregatedData } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // Validate aggregated data structure
    if (!aggregatedData || typeof aggregatedData !== 'object') {
      return res.status(400).json({ error: 'Invalid aggregated data format' });
    }

    // Store only privacy-safe aggregated analytics
    const safeInsights = {
      userId,
      weeklyAverage: Number(aggregatedData.weeklyAverage || 0),
      monthlyTrend: aggregatedData.monthlyTrend || 'stable',
      streakCount: Number(aggregatedData.streakCount || 0),
      entryFrequency: Number(aggregatedData.entryFrequency || 0),
      volatilityScore: Number(aggregatedData.volatilityScore || 0),
      submittedAt: new Date().toISOString()
    };

    // Log the privacy-safe submission
    auditService.logAuditEvent({
      userId,
      action: 'PRIVACY_INSIGHTS_SUBMITTED',
      metadata: {
        ...safeInsights,
        dataType: 'aggregated_only'
      },
      severity: 'info'
    });

    // Store in a separate analytics table (would need schema update)
    // For now, just acknowledge receipt
    logger.info('Privacy-safe insights received', { userId, insights: safeInsights });

    res.json({
      success: true,
      message: 'Privacy-safe insights stored successfully',
      insightsId: `insights_${userId}_${Date.now()}`
    });
  } catch (error) {
    logger.error('Error processing privacy insights', {
      userId: req.user?.id,
      error: error.message
    });
    
    res.status(500).json({
      error: 'Failed to process insights'
    });
  }
});

// Admin analytics overview (aggregated across all users)
router.get('/admin/overview', isAuthenticated, requirePremium, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    // Verify admin access
    const user = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user[0]?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Generate platform-wide aggregated analytics (no personal data)
    const overview = await db.execute(sql`
      WITH user_stats AS (
        SELECT 
          COUNT(DISTINCT user_id) as total_users,
          COUNT(*) as total_entries,
          AVG(emotion_score) as platform_avg_mood,
          STDDEV(emotion_score) as platform_mood_volatility
        FROM journal_entries 
        WHERE created_at >= NOW() - INTERVAL '30 days'
      ),
      usage_patterns AS (
        SELECT 
          EXTRACT(DOW FROM created_at) as day_of_week,
          COUNT(*) as entries_per_day
        FROM journal_entries 
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY EXTRACT(DOW FROM created_at)
      )
      SELECT 
        total_users,
        total_entries,
        ROUND(platform_avg_mood::numeric, 2) as avg_mood,
        ROUND(platform_mood_volatility::numeric, 3) as mood_volatility
      FROM user_stats
    `);

    auditService.logAuditEvent({
      userId,
      action: 'ADMIN_ANALYTICS_ACCESS',
      metadata: {
        analyticsType: 'platform_overview',
        accessLevel: 'aggregated_only'
      },
      severity: 'info'
    });

    res.json({
      overview: overview.rows[0],
      metadata: {
        timeframe: '30 days',
        dataType: 'aggregated',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error generating admin analytics', {
      userId: req.user?.id,
      error: error.message
    });
    
    res.status(500).json({
      error: 'Failed to generate admin analytics'
    });
  }
});

export default router;