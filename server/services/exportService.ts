import { db } from '../db';
import { 
  users, 
  journalEntries, 
  insights, 
  dailyPrompts, 
  emotionalInsights,
  reflectionLetters,
  subscriptions,
  pushSubscriptions,
  auditLogs
} from '../../shared/schema';
import { eq, and, gte } from 'drizzle-orm';
import { logger } from '../utils/logger';
import auditService from './auditService';
import { fieldEncryption } from '../utils/encryption';

export interface UserExportData {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    isPremium: boolean;
    subscriptionStatus: string;
    totalEntries: number;
    currentStreak: number;
    longestStreak: number;
  };
  journalEntries: Array<{
    id: string;
    content: string;
    wordCount: number;
    emotionScore: number;
    createdAt: string;
    updatedAt: string;
    isPrivate: boolean;
    tags: string[];
  }>;
  insights: Array<{
    id: string;
    content: string;
    type: string;
    confidence: number;
    createdAt: string;
  }>;
  emotionalInsights: Array<{
    id: string;
    period: string;
    averageScore: number;
    trendDirection: string;
    insights: any;
    createdAt: string;
  }>;
  reflectionLetters: Array<{
    id: string;
    title: string;
    content: string;
    period: string;
    createdAt: string;
  }>;
  subscriptions: Array<{
    id: string;
    plan: string;
    status: string;
    createdAt: string;
    expiresAt: string | null;
  }>;
  pushSubscriptions: Array<{
    id: string;
    reminderTime: string;
    frequency: string;
    enabled: boolean;
    createdAt: string;
  }>;
  metadata: {
    exportDate: string;
    exportVersion: string;
    totalDataPoints: number;
    privacyLevel: string;
    retentionPolicy: string;
  };
}

export async function getUserAllData(userId: string, includeAuditLogs: boolean = false): Promise<UserExportData> {
  const timer = logger.withTimer('user-data-export');
  
  try {
    // Get user basic info
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .then(rows => rows[0]);

    if (!user) {
      throw new Error('User not found');
    }

    // Get all journal entries
    const userJournalEntries = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(journalEntries.createdAt);

    // Get insights
    const userInsights = await db
      .select()
      .from(insights)
      .where(eq(insights.userId, userId))
      .orderBy(insights.createdAt);

    // Get emotional insights
    const userEmotionalInsights = await db
      .select()
      .from(emotionalInsights)
      .where(eq(emotionalInsights.userId, userId))
      .orderBy(emotionalInsights.createdAt);

    // Get reflection letters
    const userReflectionLetters = await db
      .select()
      .from(reflectionLetters)
      .where(eq(reflectionLetters.userId, userId))
      .orderBy(reflectionLetters.createdAt);

    // Get subscriptions
    const userSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(subscriptions.createdAt);

    // Get push subscriptions (anonymized)
    const userPushSubscriptions = await db
      .select({
        id: pushSubscriptions.id,
        reminderTime: pushSubscriptions.reminderTime,
        frequency: pushSubscriptions.frequency,
        enabled: pushSubscriptions.enabled,
        createdAt: pushSubscriptions.createdAt
      })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId))
      .orderBy(pushSubscriptions.createdAt);

    // Optional: Get audit logs (for transparency)
    let userAuditLogs: any[] = [];
    if (includeAuditLogs) {
      userAuditLogs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.userId, userId))
        .orderBy(auditLogs.timestamp);
    }

    // Calculate statistics
    const totalEntries = userJournalEntries.length;
    const currentStreak = calculateCurrentStreak(userJournalEntries);
    const longestStreak = calculateLongestStreak(userJournalEntries);

    // Build export data
    const exportData: UserExportData = {
      user: {
        id: user.id,
        email: user.email || '',
        name: user.name || '',
        createdAt: user.createdAt.toISOString(),
        isPremium: user.isPremium || false,
        subscriptionStatus: user.subscriptionStatus || 'free',
        totalEntries,
        currentStreak,
        longestStreak
      },
      journalEntries: userJournalEntries.map(entry => ({
        id: entry.id,
        content: fieldEncryption.isEncryptionEnabled() 
          ? fieldEncryption.decryptField(entry.content || '')
          : entry.content || '',
        wordCount: entry.wordCount || 0,
        emotionScore: entry.emotionScore || 5,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt?.toISOString() || entry.createdAt.toISOString(),
        isPrivate: entry.isPrivate || false,
        tags: entry.tags || []
      })),
      insights: userInsights.map(insight => ({
        id: insight.id,
        content: insight.content || '',
        type: insight.type || 'general',
        confidence: insight.confidence || 0.5,
        createdAt: insight.createdAt.toISOString()
      })),
      emotionalInsights: userEmotionalInsights.map(insight => ({
        id: insight.id,
        period: insight.period || 'weekly',
        averageScore: insight.averageScore || 5,
        trendDirection: insight.trendDirection || 'stable',
        insights: insight.insights || {},
        createdAt: insight.createdAt.toISOString()
      })),
      reflectionLetters: userReflectionLetters.map(letter => ({
        id: letter.id,
        title: letter.title || '',
        content: letter.content || '',
        period: letter.period || 'monthly',
        createdAt: letter.createdAt.toISOString()
      })),
      subscriptions: userSubscriptions.map(sub => ({
        id: sub.id,
        plan: sub.plan || 'free',
        status: sub.status || 'inactive',
        createdAt: sub.createdAt.toISOString(),
        expiresAt: sub.expiresAt?.toISOString() || null
      })),
      pushSubscriptions: userPushSubscriptions.map(sub => ({
        id: sub.id,
        reminderTime: sub.reminderTime || '19:00',
        frequency: sub.frequency || 'daily',
        enabled: sub.enabled || false,
        createdAt: sub.createdAt.toISOString()
      })),
      metadata: {
        exportDate: new Date().toISOString(),
        exportVersion: '1.0.0',
        totalDataPoints: totalEntries + userInsights.length + userEmotionalInsights.length + userReflectionLetters.length,
        privacyLevel: 'complete',
        retentionPolicy: 'user-controlled'
      }
    };

    // Add audit logs if requested
    if (includeAuditLogs) {
      (exportData as any).auditLogs = userAuditLogs.map(log => ({
        id: log.id,
        action: log.action,
        metadata: log.metadata,
        timestamp: log.timestamp.toISOString(),
        severity: log.severity
      }));
    }

    // Log export activity
    auditService.logAuditEvent({
      userId,
      action: 'DATA_EXPORT_GENERATED',
      metadata: {
        totalEntries,
        totalInsights: userInsights.length,
        includeAuditLogs,
        exportSize: JSON.stringify(exportData).length
      },
      severity: 'info'
    });

    timer.end({ 
      totalEntries, 
      totalInsights: userInsights.length,
      exportSize: JSON.stringify(exportData).length 
    });

    return exportData;
  } catch (error) {
    timer.end({ error: error.message });
    logger.error('Failed to export user data', { 
      userId, 
      error: error.message 
    });
    throw error;
  }
}

// Calculate current streak
function calculateCurrentStreak(entries: any[]): number {
  if (entries.length === 0) return 0;

  const sortedEntries = entries
    .map(e => new Date(e.createdAt))
    .sort((a, b) => b.getTime() - a.getTime()); // Most recent first

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const entryDate of sortedEntries) {
    const entryDay = new Date(entryDate);
    entryDay.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((currentDate.getTime() - entryDay.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === streak) {
      streak++;
    } else if (diffDays === streak + 1 && streak === 0) {
      // Allow for today or yesterday for streak start
      streak = 1;
    } else {
      break;
    }
  }

  return streak;
}

// Calculate longest streak
function calculateLongestStreak(entries: any[]): number {
  if (entries.length === 0) return 0;

  const entryDates = entries
    .map(e => {
      const date = new Date(e.createdAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
    .filter((date, index, arr) => arr.indexOf(date) === index) // Remove duplicates
    .sort((a, b) => a - b); // Oldest first

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < entryDates.length; i++) {
    const prevDate = entryDates[i - 1];
    const currentDate = entryDates[i];
    const diffDays = (currentDate - prevDate) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

export default {
  getUserAllData
};