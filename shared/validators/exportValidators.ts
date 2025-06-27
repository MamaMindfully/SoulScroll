import { z } from 'zod';

// User export data schema
export const userExportSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    createdAt: z.string().datetime(),
    isPremium: z.boolean(),
    subscriptionStatus: z.string(),
    totalEntries: z.number().int().nonnegative(),
    currentStreak: z.number().int().nonnegative(),
    longestStreak: z.number().int().nonnegative()
  }),
  journalEntries: z.array(z.object({
    id: z.string().uuid(),
    content: z.string(),
    wordCount: z.number().int().nonnegative(),
    emotionScore: z.number().min(1).max(10),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    isPrivate: z.boolean(),
    tags: z.array(z.string())
  })),
  insights: z.array(z.object({
    id: z.string().uuid(),
    content: z.string(),
    type: z.string(),
    confidence: z.number().min(0).max(1),
    createdAt: z.string().datetime()
  })),
  emotionalInsights: z.array(z.object({
    id: z.string().uuid(),
    period: z.string(),
    averageScore: z.number().min(1).max(10),
    trendDirection: z.string(),
    insights: z.any(),
    createdAt: z.string().datetime()
  })),
  reflectionLetters: z.array(z.object({
    id: z.string().uuid(),
    title: z.string(),
    content: z.string(),
    period: z.string(),
    createdAt: z.string().datetime()
  })),
  subscriptions: z.array(z.object({
    id: z.string().uuid(),
    plan: z.string(),
    status: z.string(),
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime().nullable()
  })),
  pushSubscriptions: z.array(z.object({
    id: z.string().uuid(),
    reminderTime: z.string(),
    frequency: z.string(),
    enabled: z.boolean(),
    createdAt: z.string().datetime()
  })),
  metadata: z.object({
    exportDate: z.string().datetime(),
    exportVersion: z.string(),
    totalDataPoints: z.number().int().nonnegative(),
    privacyLevel: z.string(),
    retentionPolicy: z.string()
  }),
  auditLogs: z.array(z.object({
    id: z.string().uuid(),
    action: z.string(),
    metadata: z.any(),
    timestamp: z.string().datetime(),
    severity: z.string()
  })).optional()
});

// Import validation schema (subset for import preview)
export const importPreviewSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string()
  }),
  journalEntries: z.array(z.object({
    id: z.string().uuid(),
    content: z.string().min(1),
    wordCount: z.number().int().nonnegative(),
    emotionScore: z.number().min(1).max(10),
    createdAt: z.string().datetime()
  })),
  metadata: z.object({
    exportDate: z.string().datetime(),
    exportVersion: z.string(),
    totalDataPoints: z.number().int().nonnegative()
  })
});

// Export request schema
export const exportRequestSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  includeAuditLogs: z.boolean().default(false)
});

// Import request schema
export const importRequestSchema = z.object({
  importMode: z.enum(['merge', 'replace']),
  confirmDataLoss: z.boolean().optional(),
  selectedCategories: z.array(z.enum([
    'journalEntries',
    'insights', 
    'emotionalInsights',
    'reflectionLetters',
    'pushSubscriptions'
  ])).default(['journalEntries'])
});

export type UserExportData = z.infer<typeof userExportSchema>;
export type ImportPreviewData = z.infer<typeof importPreviewSchema>;
export type ExportRequest = z.infer<typeof exportRequestSchema>;
export type ImportRequest = z.infer<typeof importRequestSchema>;