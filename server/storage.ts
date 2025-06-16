import {
  users,
  journalEntries,
  dailyPrompts,
  emotionalInsights,
  reflectionLetters,
  type User,
  type UpsertUser,
  type JournalEntry,
  type InsertJournalEntry,
  type DailyPrompt,
  type InsertDailyPrompt,
  type EmotionalInsight,
  type InsertEmotionalInsight,
  type ReflectionLetter,
  type InsertReflectionLetter,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Journal operations
  createJournalEntry(userId: string, entry: InsertJournalEntry): Promise<JournalEntry>;
  getJournalEntries(userId: string, limit?: number, offset?: number): Promise<JournalEntry[]>;
  getJournalEntryById(id: number): Promise<JournalEntry | undefined>;
  updateJournalEntry(id: number, updates: Partial<InsertJournalEntry>): Promise<JournalEntry>;
  deleteJournalEntry(id: number): Promise<void>;
  
  // Prompt operations
  getDailyPrompt(date: Date, isPremium: boolean): Promise<DailyPrompt | undefined>;
  createDailyPrompt(prompt: InsertDailyPrompt): Promise<DailyPrompt>;
  
  // Insights operations
  createEmotionalInsight(userId: string, insight: InsertEmotionalInsight): Promise<EmotionalInsight>;
  getEmotionalInsights(userId: string, period: string): Promise<EmotionalInsight[]>;
  
  // Reflection letters
  createReflectionLetter(userId: string, letter: InsertReflectionLetter): Promise<ReflectionLetter>;
  getReflectionLetters(userId: string): Promise<ReflectionLetter[]>;
  
  // User stats
  updateUserStreak(userId: string): Promise<User>;
  getUserStats(userId: string): Promise<{
    totalEntries: number;
    currentStreak: number;
    longestStreak: number;
    averageMood: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createJournalEntry(userId: string, entry: InsertJournalEntry): Promise<JournalEntry> {
    const [journalEntry] = await db
      .insert(journalEntries)
      .values({
        ...entry,
        userId,
      })
      .returning();
    return journalEntry;
  }

  async getJournalEntries(userId: string, limit: number = 20, offset: number = 0): Promise<JournalEntry[]> {
    return await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getJournalEntryById(id: number): Promise<JournalEntry | undefined> {
    const [entry] = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.id, id));
    return entry;
  }

  async updateJournalEntry(id: number, updates: Partial<InsertJournalEntry>): Promise<JournalEntry> {
    const [entry] = await db
      .update(journalEntries)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(journalEntries.id, id))
      .returning();
    return entry;
  }

  async deleteJournalEntry(id: number): Promise<void> {
    await db.delete(journalEntries).where(eq(journalEntries.id, id));
  }

  async getDailyPrompt(date: Date, isPremium: boolean): Promise<DailyPrompt | undefined> {
    const prompts = await db
      .select()
      .from(dailyPrompts)
      .where(
        isPremium 
          ? sql`true` 
          : eq(dailyPrompts.isPremium, false)
      )
      .orderBy(sql`RANDOM()`)
      .limit(1);
    
    return prompts[0];
  }

  async createDailyPrompt(prompt: InsertDailyPrompt): Promise<DailyPrompt> {
    const [dailyPrompt] = await db
      .insert(dailyPrompts)
      .values(prompt)
      .returning();
    return dailyPrompt;
  }

  async createEmotionalInsight(userId: string, insight: InsertEmotionalInsight): Promise<EmotionalInsight> {
    const [emotionalInsight] = await db
      .insert(emotionalInsights)
      .values({
        ...insight,
        userId,
      })
      .returning();
    return emotionalInsight;
  }

  async getEmotionalInsights(userId: string, period: string): Promise<EmotionalInsight[]> {
    return await db
      .select()
      .from(emotionalInsights)
      .where(
        and(
          eq(emotionalInsights.userId, userId),
          eq(emotionalInsights.period, period)
        )
      )
      .orderBy(desc(emotionalInsights.generatedAt));
  }

  async createReflectionLetter(userId: string, letter: InsertReflectionLetter): Promise<ReflectionLetter> {
    const [reflectionLetter] = await db
      .insert(reflectionLetters)
      .values({
        ...letter,
        userId,
      })
      .returning();
    return reflectionLetter;
  }

  async getReflectionLetters(userId: string): Promise<ReflectionLetter[]> {
    return await db
      .select()
      .from(reflectionLetters)
      .where(eq(reflectionLetters.userId, userId))
      .orderBy(desc(reflectionLetters.generatedAt));
  }

  async updateUserStreak(userId: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const today = new Date();
    const lastEntryDate = user.lastEntryDate;
    
    let newStreakCount = user.streakCount || 0;
    
    if (lastEntryDate) {
      const daysDiff = Math.floor((today.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day - increment streak
        newStreakCount += 1;
      } else if (daysDiff > 1) {
        // Streak broken - reset to 1
        newStreakCount = 1;
      }
      // Same day - keep current streak
    } else {
      // First entry
      newStreakCount = 1;
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        streakCount: newStreakCount,
        lastEntryDate: today,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  async getUserStats(userId: string): Promise<{
    totalEntries: number;
    currentStreak: number;
    longestStreak: number;
    averageMood: number;
  }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const [totalEntriesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId));

    const entriesWithMood = await db
      .select({ emotionalTone: journalEntries.emotionalTone })
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, userId),
          sql`emotional_tone IS NOT NULL`
        )
      );

    const moodRatings = entriesWithMood
      .map(entry => (entry.emotionalTone as any)?.rating)
      .filter(rating => typeof rating === 'number');

    const averageMood = moodRatings.length > 0 
      ? moodRatings.reduce((sum, rating) => sum + rating, 0) / moodRatings.length
      : 0;

    return {
      totalEntries: totalEntriesResult.count,
      currentStreak: user.streakCount || 0,
      longestStreak: user.streakCount || 0, // TODO: Track separately
      averageMood,
    };
  }
}

export const storage = new DatabaseStorage();
