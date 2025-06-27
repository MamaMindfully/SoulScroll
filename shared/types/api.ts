// SoulScroll AI - Shared API Types
// Consistent API response structure across frontend and backend

export interface APIResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

// Error response structure
export interface APIError {
  error: string;
  message?: string;
  details?: any;
  code?: string;
  timestamp: string;
}

// Pagination for list endpoints
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Health check response
export interface HealthResponse {
  healthy: boolean;
  services: {
    database: boolean;
    redis: boolean;
    cache: boolean;
    queue: boolean;
  };
  mode: 'full' | 'degraded';
  timestamp: string;
}

// Authentication responses
export interface AuthResponse {
  user: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    isPremium: boolean;
  };
  sessionToken?: string;
}

// Premium subscription status
export interface PremiumStatus {
  isPremium: boolean;
  subscriptionExpiresAt?: string;
  planType?: 'free' | 'premium' | 'premium_plus';
  features: string[];
}

// Journal entry API types
export interface JournalEntryRequest {
  content: string;
  isVoiceEntry?: boolean;
  voiceTranscription?: string;
  promptId?: number;
}

export interface JournalEntryResponse {
  id: number;
  content: string;
  wordCount: number;
  emotionalTone?: any;
  aiResponse?: string;
  emotionScore?: number;
  insightDepth?: number;
  createdAt: string;
  updatedAt: string;
}

// AI analysis types
export interface AIAnalysisRequest {
  entryId: number;
  analysisType: 'emotion' | 'insight' | 'reflection' | 'theme';
  context?: any;
}

export interface AIAnalysisResponse {
  analysisType: string;
  result: any;
  confidence?: number;
  timestamp: string;
}

// Emotion tracking types
export interface EmotionScoreResponse {
  score: number;
  dominantEmotion: string;
  emotions: {
    [key: string]: number;
  };
  timestamp: string;
}

// User status and analytics
export interface UserStatusResponse {
  streakCount: number;
  lastEntryDate?: string;
  totalEntries: number;
  weeklyInsights: number;
  unreadNotifications: number;
  emergentThemes: string[];
}

// Search and discovery
export interface SearchRequest {
  query: string;
  type?: 'entries' | 'insights' | 'themes';
  limit?: number;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SearchResponse {
  results: any[];
  total: number;
  suggestions?: string[];
}

// Export data types
export interface ExportRequest {
  format: 'json' | 'pdf' | 'csv';
  dateRange?: {
    start: string;
    end: string;
  };
  includeInsights?: boolean;
  includeVoice?: boolean;
}

export interface ExportResponse {
  downloadUrl: string;
  expiresAt: string;
  format: string;
  sizeBytes: number;
}