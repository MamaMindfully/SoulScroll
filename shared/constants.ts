// SoulScroll AI - Shared Constants
// Application-wide constants used across frontend and backend

// Application metadata
export const APP_NAME = 'SoulScroll AI';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Emotionally intelligent journaling with AI insights';

// Feature flags
export const FEATURES = {
  VOICE_JOURNALING: true,
  COMMUNITY_FEATURES: true,
  PREMIUM_SUBSCRIPTIONS: true,
  HEALTH_INTEGRATION: true,
  PUSH_NOTIFICATIONS: true,
  ARC_AI_ASSISTANT: true,
  DREAM_INTERPRETATION: true,
  PROGRESSIVE_DEPTH: true,
  EXPORT_FUNCTIONALITY: true,
  OFFLINE_MODE: true,
} as const;

// User roles and permissions
export const USER_ROLES = {
  GUEST: 'guest',
  USER: 'user',
  PREMIUM: 'premium',
  ADMIN: 'admin',
} as const;

export const PERMISSIONS = {
  READ_ENTRIES: 'read_entries',
  WRITE_ENTRIES: 'write_entries',
  DELETE_ENTRIES: 'delete_entries',
  ACCESS_AI_INSIGHTS: 'access_ai_insights',
  UNLIMITED_VOICE: 'unlimited_voice',
  EXPORT_DATA: 'export_data',
  ADMIN_PANEL: 'admin_panel',
} as const;

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['basic_journaling', 'daily_prompts', 'basic_insights'],
    limits: {
      entriesPerDay: 3,
      voiceMinutesPerMonth: 5,
      aiInsightsPerWeek: 2,
    },
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 8.99,
    features: [
      'unlimited_journaling',
      'voice_journaling',
      'advanced_ai_insights',
      'emotion_tracking',
      'export_data',
      'community_features',
    ],
    limits: {
      entriesPerDay: Infinity,
      voiceMinutesPerMonth: 120,
      aiInsightsPerWeek: Infinity,
    },
  },
  PREMIUM_PLUS: {
    id: 'premium_plus',
    name: 'Premium Plus',
    price: 19.99,
    features: [
      'everything_premium',
      'dream_interpretation',
      'health_integration',
      'priority_support',
      'beta_features',
      'custom_ai_persona',
    ],
    limits: {
      entriesPerDay: Infinity,
      voiceMinutesPerMonth: Infinity,
      aiInsightsPerWeek: Infinity,
    },
  },
} as const;

// Emotion categories and analysis
export const EMOTIONS = {
  PRIMARY: [
    'joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'trust', 'anticipation'
  ],
  SECONDARY: [
    'gratitude', 'excitement', 'contentment', 'anxiety', 'frustration',
    'loneliness', 'hope', 'curiosity', 'pride', 'shame', 'guilt', 'love'
  ],
} as const;

export const EMOTION_INTENSITIES = {
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
  INTENSE: 4,
} as const;

// AI analysis types
export const AI_ANALYSIS_TYPES = {
  EMOTION: 'emotion',
  THEME: 'theme',
  INSIGHT: 'insight',
  REFLECTION: 'reflection',
  PATTERN: 'pattern',
  GROWTH: 'growth',
} as const;

// Arc AI personas
export const ARC_PERSONAS = {
  SAGE: {
    id: 'sage',
    name: 'The Sage',
    description: 'Wise and contemplative, offering profound insights',
    tone: 'wise',
    style: 'philosophical',
  },
  POET: {
    id: 'poet',
    name: 'The Poet',
    description: 'Creative and expressive, finding beauty in emotions',
    tone: 'lyrical',
    style: 'metaphorical',
  },
  COACH: {
    id: 'coach',
    name: 'The Coach',
    description: 'Encouraging and goal-oriented, focused on growth',
    tone: 'motivational',
    style: 'action-oriented',
  },
  FRIEND: {
    id: 'friend',
    name: 'The Friend',
    description: 'Warm and supportive, like talking to a close friend',
    tone: 'conversational',
    style: 'empathetic',
  },
} as const;

// Prompt categories
export const PROMPT_CATEGORIES = {
  REFLECTION: 'reflection',
  GRATITUDE: 'gratitude',
  GROWTH: 'growth',
  CREATIVITY: 'creativity',
  RELATIONSHIPS: 'relationships',
  GOALS: 'goals',
  MINDFULNESS: 'mindfulness',
  CHALLENGES: 'challenges',
} as const;

// Time periods for analytics
export const TIME_PERIODS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
  ALL_TIME: 'all_time',
} as const;

// Rate limiting configurations
export const RATE_LIMITS = {
  JOURNAL_ENTRIES: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // 5 entries per window
  },
  AI_ANALYSIS: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 analyses per window
  },
  STRIPE_OPERATIONS: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 operations per window
  },
  GENERAL_API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per window
  },
} as const;

// File upload limits
export const UPLOAD_LIMITS = {
  AUDIO: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/m4a'],
    maxDuration: 300, // 5 minutes
  },
  IMAGE: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
} as const;

// Export formats
export const EXPORT_FORMATS = {
  JSON: 'json',
  PDF: 'pdf',
  CSV: 'csv',
  ZIP: 'zip',
} as const;

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  ENTRY_SAVED: 'Journal entry saved successfully',
  INSIGHT_GENERATED: 'AI insight generated',
  SUBSCRIPTION_ACTIVATED: 'Premium subscription activated',
  DATA_EXPORTED: 'Data export completed',
  FEEDBACK_SUBMITTED: 'Feedback submitted successfully',
} as const;

// Default values
export const DEFAULTS = {
  WORDS_PER_MINUTE: 200,
  JOURNAL_ENTRY_MIN_LENGTH: 10,
  INSIGHT_CONFIDENCE_THRESHOLD: 0.7,
  EMOTION_SCORE_RANGE: [1, 10],
  STREAK_TIMEZONE: 'America/New_York',
} as const;