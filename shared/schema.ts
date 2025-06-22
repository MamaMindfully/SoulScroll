import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  real,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isPremium: boolean("is_premium").default(false),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  streakCount: integer("streak_count").default(0),
  lastEntryDate: timestamp("last_entry_date"),
  mentorPersona: varchar("mentor_persona").default("sage"), // Added for mentor personas
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Journal entries
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  wordCount: integer("word_count").default(0),
  emotionalTone: jsonb("emotional_tone"), // {rating: number, confidence: number, keywords: string[]}
  aiResponse: text("ai_response"),
  isVoiceEntry: boolean("is_voice_entry").default(false),
  voiceTranscription: text("voice_transcription"),
  promptId: integer("prompt_id").references(() => dailyPrompts.id),
  emotionScore: integer("emotion_score").default(0),
  insightDepth: integer("insight_depth").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily prompts
export const dailyPrompts = pgTable("daily_prompts", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  category: varchar("category"), // 'general', 'grief', 'creativity', 'relationships', etc.
  isPremium: boolean("is_premium").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Emotional insights and patterns
export const emotionalInsights = pgTable("emotional_insights", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  period: varchar("period").notNull(), // 'daily', 'weekly', 'monthly'
  moodData: jsonb("mood_data"), // Array of mood scores and dates
  topKeywords: jsonb("top_keywords"), // Array of frequently used emotional keywords
  insights: text("insights"), // AI-generated insights
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Monthly reflection letters
export const reflectionLetters = pgTable("reflection_letters", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Voice journaling and transcription
export const voiceEntries = pgTable("voice_entries", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").references(() => journalEntries.id),
  audioUrl: varchar("audio_url"),
  transcription: text("transcription"),
  duration: integer("duration"), // in seconds
  processingStatus: varchar("processing_status").default("pending"), // pending, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Community features
export const communityMoods = pgTable("community_moods", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  anonymousId: varchar("anonymous_id").notNull(),
  moodRating: integer("mood_rating").notNull(),
  keywords: text("keywords").array(),
  location: varchar("location"), // optional city/region
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communitySupport = pgTable("community_support", {
  id: serial("id").primaryKey(),
  fromUserId: varchar("from_user_id").notNull(),
  toUserId: varchar("to_user_id").notNull(),
  supportType: varchar("support_type").notNull(), // "encouragement", "tip", "resource"
  message: text("message"),
  isAnonymous: boolean("is_anonymous").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription and premium features
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  planType: varchar("plan_type").notNull(), // "free", "premium", "premium_plus"
  status: varchar("status").notNull(), // "active", "canceled", "past_due"
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Health and activity correlations
export const healthData = pgTable("health_data", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  date: timestamp("date").notNull(),
  sleepHours: real("sleep_hours"),
  stepsCount: integer("steps_count"),
  heartRate: integer("heart_rate"),
  weatherCondition: varchar("weather_condition"),
  exerciseMinutes: integer("exercise_minutes"),
  moodCorrelation: real("mood_correlation"), // calculated correlation
  syncedAt: timestamp("synced_at").defaultNow(),
});

// Advanced AI predictions and insights
export const moodPredictions = pgTable("mood_predictions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  predictedDate: timestamp("predicted_date").notNull(),
  predictedMood: real("predicted_mood"),
  confidence: real("confidence"),
  factors: text("factors").array(), // contributing factors
  recommendation: text("recommendation"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Backup and export logs
export const dataExports = pgTable("data_exports", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  exportType: varchar("export_type").notNull(), // "pdf", "json", "backup"
  status: varchar("status").notNull(), // "pending", "completed", "failed"
  downloadUrl: varchar("download_url"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Push notification subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dhKey: text("p256dh_key").notNull(),
  authKey: text("auth_key").notNull(),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Achievements and challenges tracking
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  achievementId: varchar("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  progress: integer("progress").default(0),
  maxProgress: integer("max_progress").notNull(),
});

export const userChallenges = pgTable("user_challenges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  challengeId: varchar("challenge_id").notNull(),
  status: varchar("status").default("active"), // active, completed, expired
  progress: integer("progress").default(0),
  target: integer("target").notNull(),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date").notNull(),
  completedAt: timestamp("completed_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  journalEntries: many(journalEntries),
  emotionalInsights: many(emotionalInsights),
  reflectionLetters: many(reflectionLetters),
  communityMoods: many(communityMoods),
  subscriptions: many(subscriptions),
  healthData: many(healthData),
  moodPredictions: many(moodPredictions),
  dataExports: many(dataExports),
  pushSubscriptions: many(pushSubscriptions),
  userAchievements: many(userAchievements),
  userChallenges: many(userChallenges),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  user: one(users, {
    fields: [journalEntries.userId],
    references: [users.id],
  }),
  prompt: one(dailyPrompts, {
    fields: [journalEntries.promptId],
    references: [dailyPrompts.id],
  }),
  voiceEntry: one(voiceEntries, {
    fields: [journalEntries.id],
    references: [voiceEntries.entryId],
  }),
}));

export const voiceEntriesRelations = relations(voiceEntries, ({ one }) => ({
  entry: one(journalEntries, {
    fields: [voiceEntries.entryId],
    references: [journalEntries.id],
  }),
}));

export const dailyPromptsRelations = relations(dailyPrompts, ({ many }) => ({
  journalEntries: many(journalEntries),
}));

export const emotionalInsightsRelations = relations(emotionalInsights, ({ one }) => ({
  user: one(users, {
    fields: [emotionalInsights.userId],
    references: [users.id],
  }),
}));

export const reflectionLettersRelations = relations(reflectionLetters, ({ one }) => ({
  user: one(users, {
    fields: [reflectionLetters.userId],
    references: [users.id],
  }),
}));

export const communityMoodsRelations = relations(communityMoods, ({ one }) => ({
  user: one(users, {
    fields: [communityMoods.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const healthDataRelations = relations(healthData, ({ one }) => ({
  user: one(users, {
    fields: [healthData.userId],
    references: [users.id],
  }),
}));

export const moodPredictionsRelations = relations(moodPredictions, ({ one }) => ({
  user: one(users, {
    fields: [moodPredictions.userId],
    references: [users.id],
  }),
}));

export const dataExportsRelations = relations(dataExports, ({ one }) => ({
  user: one(users, {
    fields: [dataExports.userId],
    references: [users.id],
  }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
}));

export const userChallengesRelations = relations(userChallenges, ({ one }) => ({
  user: one(users, {
    fields: [userChallenges.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDailyPromptSchema = createInsertSchema(dailyPrompts).omit({
  id: true,
  createdAt: true,
});

export const insertEmotionalInsightSchema = createInsertSchema(emotionalInsights).omit({
  id: true,
  userId: true,
  generatedAt: true,
});

export const insertReflectionLetterSchema = createInsertSchema(reflectionLetters).omit({
  id: true,
  userId: true,
  generatedAt: true,
});

// New insert schemas for advanced features
export const insertVoiceEntrySchema = createInsertSchema(voiceEntries).omit({
  id: true,
  createdAt: true,
});

export const insertCommunityMoodSchema = createInsertSchema(communityMoods).omit({
  id: true,
  createdAt: true,
});

export const insertCommunitySupportSchema = createInsertSchema(communitySupport).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHealthDataSchema = createInsertSchema(healthData).omit({
  id: true,
  syncedAt: true,
});

export const insertMoodPredictionSchema = createInsertSchema(moodPredictions).omit({
  id: true,
  createdAt: true,
});

export const insertDataExportSchema = createInsertSchema(dataExports).omit({
  id: true,
  createdAt: true,
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

export const insertUserChallengeSchema = createInsertSchema(userChallenges).omit({
  id: true,
  startDate: true,
  completedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertDailyPrompt = z.infer<typeof insertDailyPromptSchema>;
export type DailyPrompt = typeof dailyPrompts.$inferSelect;
export type InsertEmotionalInsight = z.infer<typeof insertEmotionalInsightSchema>;
export type EmotionalInsight = typeof emotionalInsights.$inferSelect;
export type InsertReflectionLetter = z.infer<typeof insertReflectionLetterSchema>;
export type ReflectionLetter = typeof reflectionLetters.$inferSelect;

export const echoArchive = pgTable("echo_archive", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  echo: text("echo").notNull(),
  sourceInsights: text("source_insights").array(), // JSON array of insights used
  createdAt: timestamp("created_at").defaultNow(),
});

export const promptFeedback = pgTable("prompt_feedback", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: text("date").notNull(), // Using text for date to avoid import issues
  type: text("type").notNull(), // 'affirmation' or 'reflection'
  feedback: text("feedback"), // 'liked', 'skipped', null
  createdAt: timestamp("created_at").defaultNow(),
});

export const userMemoryTags = pgTable("user_memory_tags", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  tag: text("tag").notNull(), // Theme like 'uncertainty', 'letting_go', 'acceptance'
  strength: real("strength").default(1.0), // Float 0-5 indicating theme importance
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lifeChapters = pgTable("life_chapters", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  emotions: text("emotions").array(), // Array of top emotions
  theme: text("theme").notNull(),
  summary: text("summary").notNull(), // One-sentence insight
  entryCount: integer("entry_count").default(0), // Number of entries analyzed
  createdAt: timestamp("created_at").defaultNow(),
});

export const arcDialogue = pgTable("arc_dialogue", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insightNodes = pgTable("insight_nodes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  entryId: integer("entry_id").references(() => journalEntries.id),
  label: text("label").notNull(),
  theme: text("theme"),
  emotion: text("emotion"),
  constellationId: integer("constellation_id").references(() => monthlyConstellations.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insightEdges = pgTable("insight_edges", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  source: integer("source").references(() => insightNodes.id),
  target: integer("target").references(() => insightNodes.id),
  type: text("type").notNull(), // "theme", "emotion", "time"
  createdAt: timestamp("created_at").defaultNow(),
});

export const monthlyConstellations = pgTable("monthly_constellations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  themes: text("themes").array(), // ['grief', 'surrender']
  summary: text("summary").notNull(), // "This was the month of letting go..."
  guidingQuestion: text("guiding_question"), // "What does it mean to release without regret?"
  entryCount: integer("entry_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Echo Archive schema
export const insertEchoArchiveSchema = createInsertSchema(echoArchive).omit({
  id: true,
  createdAt: true,
});

export type InsertEchoArchive = z.infer<typeof insertEchoArchiveSchema>;
export type EchoArchive = typeof echoArchive.$inferSelect;

// Prompt Feedback schema
export const insertPromptFeedbackSchema = createInsertSchema(promptFeedback).omit({
  id: true,
  createdAt: true,
});

export type InsertPromptFeedback = z.infer<typeof insertPromptFeedbackSchema>;
export type PromptFeedback = typeof promptFeedback.$inferSelect;

// User Memory Tags schema
export const insertUserMemoryTagSchema = createInsertSchema(userMemoryTags).omit({
  id: true,
  createdAt: true,
});

export type InsertUserMemoryTag = z.infer<typeof insertUserMemoryTagSchema>;
export type UserMemoryTag = typeof userMemoryTags.$inferSelect;

// Life Chapters schema
export const insertLifeChapterSchema = createInsertSchema(lifeChapters).omit({
  id: true,
  createdAt: true,
});

export type InsertLifeChapter = z.infer<typeof insertLifeChapterSchema>;
export type LifeChapter = typeof lifeChapters.$inferSelect;

// Arc Dialogue schema
export const insertArcDialogueSchema = createInsertSchema(arcDialogue).omit({
  id: true,
  createdAt: true,
});

export type InsertArcDialogue = z.infer<typeof insertArcDialogueSchema>;
export type ArcDialogue = typeof arcDialogue.$inferSelect;

// Insight Graph schemas
export const insertInsightNodeSchema = createInsertSchema(insightNodes).omit({
  id: true,
  createdAt: true,
});

export const insertInsightEdgeSchema = createInsertSchema(insightEdges).omit({
  id: true,
  createdAt: true,
});

export type InsertInsightNode = z.infer<typeof insertInsightNodeSchema>;
export type InsightNode = typeof insightNodes.$inferSelect;
export type InsertInsightEdge = z.infer<typeof insertInsightEdgeSchema>;
export type InsightEdge = typeof insightEdges.$inferSelect;

// Monthly Constellations schema
export const insertMonthlyConstellationSchema = createInsertSchema(monthlyConstellations).omit({
  id: true,
  createdAt: true,
});

export type InsertMonthlyConstellation = z.infer<typeof insertMonthlyConstellationSchema>;
export type MonthlyConstellation = typeof monthlyConstellations.$inferSelect;

// New types for advanced features
export type InsertVoiceEntry = z.infer<typeof insertVoiceEntrySchema>;
export type VoiceEntry = typeof voiceEntries.$inferSelect;
export type InsertCommunityMood = z.infer<typeof insertCommunityMoodSchema>;
export type CommunityMood = typeof communityMoods.$inferSelect;
export type InsertCommunitySupport = z.infer<typeof insertCommunitySupportSchema>;
export type CommunitySupport = typeof communitySupport.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertHealthData = z.infer<typeof insertHealthDataSchema>;
export type HealthData = typeof healthData.$inferSelect;
export type InsertMoodPrediction = z.infer<typeof insertMoodPredictionSchema>;
export type MoodPrediction = typeof moodPredictions.$inferSelect;
export type InsertDataExport = z.infer<typeof insertDataExportSchema>;
export type DataExport = typeof dataExports.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserChallenge = z.infer<typeof insertUserChallengeSchema>;
export type UserChallenge = typeof userChallenges.$inferSelect;

// Secret Scrolls table
export const secretScrolls = pgTable("secret_scrolls", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  scrollContent: text("scroll_content"),
  milestone: varchar("milestone", { length: 255 }),
  scrollType: varchar("scroll_type", { length: 100 }).default("wisdom"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved Reflections table
export const savedReflections = pgTable("saved_reflections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  reflectionContent: text("reflection_content"),
  source: varchar("source", { length: 100 }).default("ai"),
  savedAt: timestamp("saved_at").defaultNow(),
});

// Rituals table
export const rituals = pgTable("rituals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  ritualName: varchar("ritual_name", { length: 255 }),
  ritualType: varchar("ritual_type", { length: 100 }),
  status: varchar("status", { length: 50 }).default("pending"),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Schema exports for new tables
export const insertSecretScrollSchema = createInsertSchema(secretScrolls).omit({
  id: true,
  createdAt: true
});

export const insertSavedReflectionSchema = createInsertSchema(savedReflections).omit({
  id: true,
  savedAt: true
});

export const insertRitualSchema = createInsertSchema(rituals).omit({
  id: true,
  completedAt: true
});
export type InsertReflection = z.infer<typeof insertReflectionSchema>;
export type Reflection = typeof reflections.$inferSelect;

// New table types
export type InsertSecretScroll = z.infer<typeof insertSecretScrollSchema>;
export type SecretScroll = typeof secretScrolls.$inferSelect;
export type InsertSavedReflection = z.infer<typeof insertSavedReflectionSchema>;
export type SavedReflection = typeof savedReflections.$inferSelect;
export type InsertRitual = z.infer<typeof insertRitualSchema>;
export type Ritual = typeof rituals.$inferSelect;
