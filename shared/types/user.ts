// SoulScroll AI - User Types
// Shared user-related types across frontend and backend

export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isPremium: boolean;
  subscriptionExpiresAt?: string;
  streakCount: number;
  lastEntryDate?: string;
  mentorPersona: 'sage' | 'poet' | 'coach' | 'friend';
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  userId: string;
  sessionToken: string;
  expiresAt: string;
  isActive: boolean;
}

export interface UserPreferences {
  mentorPersona: 'sage' | 'poet' | 'coach' | 'friend';
  notificationsEnabled: boolean;
  reminderTime?: string;
  darkMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  privacyLevel: 'public' | 'private' | 'anonymous';
}

export interface UserTraits {
  userId: string;
  writingStyle?: string;
  moodBaseline?: number;
  likesAffirmations?: boolean;
  likesQuestions?: boolean;
  peakHours?: string[];
  updatedAt: string;
}

export interface PremiumSubscription {
  id: number;
  userId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  planType: 'free' | 'premium' | 'premium_plus';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAchievement {
  id: number;
  userId: string;
  achievementId: string;
  unlockedAt: string;
  progress: number;
  maxProgress: number;
}

export interface UserChallenge {
  id: number;
  userId: string;
  challengeId: string;
  status: 'active' | 'completed' | 'failed';
  progress: number;
  target: number;
  startDate: string;
  endDate: string;
  completedAt?: string;
}

// Community features
export interface CommunityMood {
  id: number;
  userId: string;
  anonymousId: string;
  moodRating: number;
  keywords?: string[];
  location?: string;
  isPublic: boolean;
  createdAt: string;
}

export interface CommunitySupport {
  id: number;
  fromUserId: string;
  toUserId: string;
  supportType: string;
  message?: string;
  isAnonymous: boolean;
  createdAt: string;
}

// Health and wellness integration
export interface HealthData {
  id: number;
  userId: string;
  date: string;
  sleepHours?: number;
  stepsCount?: number;
  heartRate?: number;
  weatherCondition?: string;
  exerciseMinutes?: number;
  moodCorrelation?: number;
  syncedAt: string;
}

// Push notifications
export interface PushSubscription {
  id: number;
  userId: string;
  endpoint: string;
  p256dhKey: string;
  authKey: string;
  userAgent?: string;
  isActive: boolean;
  createdAt: string;
}

// Arc AI persona and dialogue
export interface ArcDialogue {
  id: number;
  userId: string;
  prompt: string;
  response: string;
  createdAt: string;
}

export interface ArcProfile {
  userId: string;
  tone: 'gentle' | 'direct' | 'poetic' | 'analytical';
  style: 'questions' | 'affirmations' | 'stories' | 'metaphors';
  depth: 'surface' | 'moderate' | 'deep' | 'profound';
}

// Streak and ritual tracking
export interface RitualStreak {
  userId: string;
  count: number;
  lastDay?: string;
}

export interface Ritual {
  id: number;
  userId: string;
  ritualName?: string;
  ritualType?: string;
  status?: string;
  completedAt?: string;
}

// Data export and privacy
export interface DataExport {
  id: number;
  userId: string;
  exportType: 'full' | 'entries' | 'insights' | 'analytics';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  expiresAt?: string;
  createdAt: string;
}

// Error logging and feedback
export interface UserFeedback {
  id: number;
  userId: string;
  type: 'bug' | 'feature' | 'general';
  message: string;
  rating?: number;
  metadata?: any;
  createdAt: string;
}

export interface UserActivity {
  userId: string;
  action: string;
  timestamp: string;
  metadata?: any;
  sessionId?: string;
}