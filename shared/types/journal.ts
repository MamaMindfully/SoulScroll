// SoulScroll AI - Journal Entry Types
// Shared types for journal functionality across frontend and backend

export interface JournalEntry {
  id: number;
  userId: string;
  content: string;
  wordCount?: number;
  emotionalTone?: EmotionalTone;
  aiResponse?: string;
  isVoiceEntry?: boolean;
  voiceTranscription?: string;
  promptId?: number;
  emotionScore?: number;
  insightDepth?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmotionalTone {
  primary: string;
  secondary?: string;
  intensity: number;
  confidence: number;
  emotions: {
    [emotion: string]: number;
  };
}

export interface JournalInsight {
  id: string;
  entryId: number;
  type: 'reflection' | 'pattern' | 'growth' | 'emotion';
  content: string;
  confidence: number;
  themes: string[];
  timestamp: string;
}

export interface VoiceEntry {
  id: number;
  entryId: number;
  audioUrl?: string;
  transcription?: string;
  duration?: number;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface DailyPrompt {
  id: number;
  text: string;
  category?: string;
  isPremium?: boolean;
  createdAt: string;
}

export interface JournalEmbedding {
  id: number;
  userId: string;
  entryId?: number;
  embedding: number[];
  createdAt: string;
}

// Emotion tracking and analytics
export interface EmotionTrend {
  id: number;
  userId: string;
  date: string;
  score: number;
  dominantEmotion?: string;
  createdAt: string;
}

export interface EmotionalInsight {
  id: number;
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  moodData?: any;
  topKeywords?: any;
  insights?: string;
  generatedAt: string;
}

// Memory and reflection systems
export interface MemoryLoop {
  id: number;
  userId: string;
  entryId?: number;
  insight: string;
  createdAt: string;
}

export interface SavedReflection {
  id: number;
  userId: string;
  reflectionContent?: string;
  source?: string;
  savedAt: string;
}

export interface EchoArchive {
  id: number;
  userId: string;
  echo: string;
  sourceInsights?: string[];
  createdAt: string;
}

// Theme and pattern recognition
export interface UserMemoryTag {
  id: number;
  userId: string;
  tag: string;
  strength?: number;
  lastSeen?: string;
  createdAt: string;
}

export interface LifeArcTag {
  id: number;
  userId: string;
  entryId?: number;
  tag: string;
  createdAt: string;
}

// Chapter and constellation systems
export interface LifeChapter {
  id: number;
  userId: string;
  title: string;
  emotions?: string[];
  theme: string;
  summary: string;
  entryCount?: number;
  createdAt: string;
}

export interface MonthlyConstellation {
  id: number;
  userId: string;
  title: string;
  themes?: string[];
  summary: string;
  guidingQuestion?: string;
  entryCount?: number;
  createdAt: string;
}

// Analytics and progress tracking
export interface JournalStats {
  totalEntries: number;
  wordsWritten: number;
  averageWordsPerEntry: number;
  longestStreak: number;
  currentStreak: number;
  emotionalGrowth: number;
  topThemes: string[];
  writingFrequency: {
    [day: string]: number;
  };
}

export interface WritingPattern {
  preferredTimes: string[];
  averageSessionLength: number;
  emotionalPatterns: {
    [emotion: string]: {
      frequency: number;
      triggers: string[];
    };
  };
  growthAreas: string[];
}