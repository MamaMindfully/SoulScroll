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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  journalEntries: many(journalEntries),
  emotionalInsights: many(emotionalInsights),
  reflectionLetters: many(reflectionLetters),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  user: one(users, {
    fields: [journalEntries.userId],
    references: [users.id],
  }),
  prompt: one(dailyPrompts, {
    fields: [journalEntries.promptId],
    references: [dailyPrompts.id],
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
