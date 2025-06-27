// SoulScroll AI - Shared Validation Schemas
// Zod schemas for consistent validation across frontend and backend

import { z } from 'zod';
import { EMOTIONS, PROMPT_CATEGORIES, ARC_PERSONAS, EXPORT_FORMATS } from './constants';

// Base validation patterns
const emailSchema = z.string().email('Invalid email address');
const nonEmptyString = z.string().min(1, 'This field is required');
const positiveInteger = z.number().int().positive();
const dateString = z.string().datetime('Invalid date format');

// User validation schemas
export const userSchema = z.object({
  id: nonEmptyString,
  email: emailSchema.optional(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  profileImageUrl: z.string().url().optional(),
  isPremium: z.boolean().default(false),
  mentorPersona: z.enum(['sage', 'poet', 'coach', 'friend']).default('sage'),
});

export const userPreferencesSchema = z.object({
  mentorPersona: z.enum(['sage', 'poet', 'coach', 'friend']),
  notificationsEnabled: z.boolean().default(true),
  reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  darkMode: z.boolean().default(false),
  fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
  privacyLevel: z.enum(['public', 'private', 'anonymous']).default('private'),
});

// Journal entry validation schemas
export const journalEntrySchema = z.object({
  content: z.string()
    .min(10, 'Journal entry must be at least 10 characters')
    .max(10000, 'Journal entry cannot exceed 10,000 characters'),
  isVoiceEntry: z.boolean().optional(),
  voiceTranscription: z.string().optional(),
  promptId: z.number().int().positive().optional(),
});

export const journalEntryUpdateSchema = journalEntrySchema.partial();

export const emotionalToneSchema = z.object({
  primary: z.enum(EMOTIONS.PRIMARY as [string, ...string[]]),
  secondary: z.enum(EMOTIONS.SECONDARY as [string, ...string[]]).optional(),
  intensity: z.number().min(1).max(4),
  confidence: z.number().min(0).max(1),
  emotions: z.record(z.string(), z.number().min(0).max(1)),
});

// AI analysis validation schemas
export const aiAnalysisRequestSchema = z.object({
  entryId: positiveInteger,
  analysisType: z.enum(['emotion', 'insight', 'reflection', 'theme']),
  context: z.any().optional(),
});

export const emotionScoreSchema = z.object({
  score: z.number().min(1).max(10),
  dominantEmotion: nonEmptyString,
  emotions: z.record(z.string(), z.number().min(0).max(1)),
});

// Prompt validation schemas
export const dailyPromptSchema = z.object({
  text: z.string().min(10).max(500),
  category: z.enum(Object.values(PROMPT_CATEGORIES) as [string, ...string[]]).optional(),
  isPremium: z.boolean().default(false),
});

// Voice entry validation schemas
export const voiceEntrySchema = z.object({
  entryId: positiveInteger,
  audioUrl: z.string().url().optional(),
  transcription: z.string().optional(),
  duration: z.number().positive().optional(),
  processingStatus: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
});

// Arc AI validation schemas
export const arcDialogueSchema = z.object({
  prompt: z.string().min(1).max(1000),
});

export const arcProfileSchema = z.object({
  tone: z.enum(['gentle', 'direct', 'poetic', 'analytical']).default('gentle'),
  style: z.enum(['questions', 'affirmations', 'stories', 'metaphors']).default('questions'),
  depth: z.enum(['surface', 'moderate', 'deep', 'profound']).default('moderate'),
});

// Search validation schemas
export const searchRequestSchema = z.object({
  query: z.string().min(1).max(200),
  type: z.enum(['entries', 'insights', 'themes']).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  dateRange: z.object({
    start: dateString,
    end: dateString,
  }).optional(),
});

// Export validation schemas
export const exportRequestSchema = z.object({
  format: z.enum(Object.values(EXPORT_FORMATS) as [string, ...string[]]),
  dateRange: z.object({
    start: dateString,
    end: dateString,
  }).optional(),
  includeInsights: z.boolean().default(true),
  includeVoice: z.boolean().default(false),
});

// Community features validation schemas
export const communityMoodSchema = z.object({
  moodRating: z.number().int().min(1).max(10),
  keywords: z.array(z.string()).max(5).optional(),
  location: z.string().max(100).optional(),
  isPublic: z.boolean().default(false),
});

export const communitySupportSchema = z.object({
  toUserId: nonEmptyString,
  supportType: z.enum(['encouragement', 'advice', 'empathy', 'celebration']),
  message: z.string().max(500).optional(),
  isAnonymous: z.boolean().default(true),
});

// Subscription validation schemas
export const subscriptionSchema = z.object({
  planType: z.enum(['free', 'premium', 'premium_plus']),
  paymentMethodId: z.string().optional(),
  billingInterval: z.enum(['month', 'year']).default('month'),
});

// Feedback validation schemas
export const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'general']),
  message: z.string().min(10).max(1000),
  rating: z.number().int().min(1).max(5).optional(),
  metadata: z.any().optional(),
});

// Health data validation schemas
export const healthDataSchema = z.object({
  date: dateString,
  sleepHours: z.number().min(0).max(24).optional(),
  stepsCount: z.number().int().min(0).optional(),
  heartRate: z.number().int().min(30).max(220).optional(),
  weatherCondition: z.string().max(50).optional(),
  exerciseMinutes: z.number().int().min(0).optional(),
});

// Push notification validation schemas
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: nonEmptyString,
    auth: nonEmptyString,
  }),
  userAgent: z.string().optional(),
});

// Achievement and challenge validation schemas
export const achievementSchema = z.object({
  achievementId: nonEmptyString,
  progress: z.number().int().min(0),
  maxProgress: positiveInteger,
});

export const challengeSchema = z.object({
  challengeId: nonEmptyString,
  target: positiveInteger,
  startDate: dateString,
  endDate: dateString,
});

// Pagination validation schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Date range validation schema
export const dateRangeSchema = z.object({
  start: dateString,
  end: dateString,
}).refine(
  (data) => new Date(data.start) <= new Date(data.end),
  {
    message: 'Start date must be before or equal to end date',
    path: ['end'],
  }
);

// Helper function to create API response schema
export function createAPIResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema,
    error: z.string().optional(),
    message: z.string().optional(),
    timestamp: z.string().optional(),
  });
}

// Helper function to create paginated response schema
export function createPaginatedResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().min(0),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
  });
}