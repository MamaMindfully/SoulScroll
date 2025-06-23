import {
  users,
  journalEntries,
  dailyPrompts,
  emotionalInsights,
  reflectionLetters,
  echoArchive,
  promptFeedback,
  userMemoryTags,
  lifeChapters,
  arcDialogue,
  insightNodes,
  insightEdges,
  monthlyConstellations,
  voiceEntries,
  communityMoods,
  communitySupport,
  subscriptions,
  healthData,
  moodPredictions,
  dataExports,
  pushSubscriptions,
  userAchievements,
  userChallenges,
  secretScrolls,
  savedReflections,
  rituals,
  memoryLoops,
  innerCompassPrompts,
  errorLogs,
  userTraits,
  journalEmbeddings,
  insightFeedback,
  ritualStreaks,
  lifeArcTags,
  emotionTrends,
  toneVectors,
  insightLogs,
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
  type EchoArchive,
  type InsertEchoArchive,
  type PromptFeedback,
  type InsertPromptFeedback,
  type UserMemoryTag,
  type InsertUserMemoryTag,
  type LifeChapter,
  type InsertLifeChapter,
  type ArcDialogue,
  type InsertArcDialogue,
  type InsightNode,
  type InsertInsightNode,
  type InsightEdge,
  type InsertInsightEdge,
  type MonthlyConstellation,
  type InsertMonthlyConstellation,
  type VoiceEntry,
  type InsertVoiceEntry,
  type CommunityMood,
  type InsertCommunityMood,
  type CommunitySupport,
  type InsertCommunitySupport,
  type Subscription,
  type InsertSubscription,
  type HealthData,
  type InsertHealthData,
  type MoodPrediction,
  type InsertMoodPrediction,
  type DataExport,
  type InsertDataExport,
  type PushSubscription,
  type InsertPushSubscription,
  type UserAchievement,
  type InsertUserAchievement,
  type UserChallenge,
  type InsertUserChallenge,
  type MemoryLoop,
  type InsertMemoryLoop,
  type InnerCompassPrompt,
  type InsertInnerCompassPrompt,
  type ErrorLog,
  type InsertErrorLog,
  type UserTraits,
  type InsertUserTraits,
  type JournalEmbedding,
  type InsertJournalEmbedding,
  type InsightFeedback,
  type InsertInsightFeedback,
  type RitualStreak,
  type InsertRitualStreak,
  type LifeArcTag,
  type InsertLifeArcTag,
  type EmotionTrend,
  type InsertEmotionTrend,
  type ToneVector,
  type InsertToneVector,
  type InsightLog,
  type InsertInsightLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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

  // Voice journaling operations
  createVoiceEntry(entryId: number, voiceData: InsertVoiceEntry): Promise<VoiceEntry>;
  getVoiceEntry(entryId: number): Promise<VoiceEntry | undefined>;
  updateVoiceEntry(id: number, updates: Partial<InsertVoiceEntry>): Promise<VoiceEntry>;

  // Community operations
  createCommunityMood(userId: string, moodData: InsertCommunityMood): Promise<CommunityMood>;
  getCommunityMoods(location?: string, limit?: number): Promise<CommunityMood[]>;
  createCommunitySupport(support: InsertCommunitySupport): Promise<CommunitySupport>;
  getCommunitySupportForUser(userId: string): Promise<CommunitySupport[]>;

  // Subscription operations
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(userId: string, updates: Partial<InsertSubscription>): Promise<Subscription>;

  // Health data operations
  createHealthData(userId: string, data: InsertHealthData): Promise<HealthData>;
  getHealthData(userId: string, dateRange?: { start: Date; end: Date }): Promise<HealthData[]>;

  // Mood prediction operations
  createMoodPrediction(userId: string, prediction: InsertMoodPrediction): Promise<MoodPrediction>;
  getMoodPredictions(userId: string, limit?: number): Promise<MoodPrediction[]>;

  // Data export operations
  createDataExport(userId: string, exportData: InsertDataExport): Promise<DataExport>;
  getDataExports(userId: string): Promise<DataExport[]>;
  updateDataExport(id: number, updates: Partial<InsertDataExport>): Promise<DataExport>;

  // Push notification operations
  createPushSubscription(userId: string, subscription: InsertPushSubscription): Promise<PushSubscription>;
  getPushSubscriptions(userId: string): Promise<PushSubscription[]>;
  updatePushSubscription(id: number, updates: Partial<InsertPushSubscription>): Promise<PushSubscription>;

  // Achievement operations
  createUserAchievement(userId: string, achievement: InsertUserAchievement): Promise<UserAchievement>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  updateUserAchievement(id: number, updates: Partial<InsertUserAchievement>): Promise<UserAchievement>;

  // Challenge operations
  createUserChallenge(userId: string, challenge: InsertUserChallenge): Promise<UserChallenge>;
  getUserChallenges(userId: string, status?: string): Promise<UserChallenge[]>;
  updateUserChallenge(id: number, updates: Partial<InsertUserChallenge>): Promise<UserChallenge>;

  // Secret scroll operations
  createSecretScroll(userId: string, scroll: any): Promise<any>;
  getSecretScrolls(userId: string): Promise<any[]>;
  
  // Saved reflection operations
  saveReflection(userId: string, reflection: any): Promise<any>;
  getSavedReflections(userId: string): Promise<any[]>;
  
  // Ritual operations
  createRitual(userId: string, ritual: any): Promise<any>;
  getUserRituals(userId: string): Promise<any[]>;

  // Echo archive operations
  createEcho(userId: string, echo: InsertEchoArchive): Promise<EchoArchive>;
  getLatestEcho(userId: string): Promise<EchoArchive | undefined>;
  getEchoHistory(userId: string, limit?: number): Promise<EchoArchive[]>;

  // Prompt feedback operations
  createPromptFeedback(userId: string, feedback: InsertPromptFeedback): Promise<PromptFeedback>;
  getPromptFeedback(userId: string, limit?: number): Promise<PromptFeedback[]>;
  updateUserPromptRatios(userId: string): Promise<User>;

  // Memory tag operations
  upsertMemoryTag(userId: string, tag: string, strength: number): Promise<UserMemoryTag>;
  getUserMemoryTags(userId: string, limit?: number): Promise<UserMemoryTag[]>;
  getTopUserThemes(userId: string, limit?: number): Promise<UserMemoryTag[]>;

  // Life chapter operations
  createLifeChapter(userId: string, chapter: InsertLifeChapter): Promise<LifeChapter>;
  getLifeChapters(userId: string, limit?: number): Promise<LifeChapter[]>;
  getLatestChapter(userId: string): Promise<LifeChapter | undefined>;

  // Arc persona operations
  getArcProfile(userId: string): Promise<{ arcTone: string; arcPromptStyle: string; arcDepth: string } | null>;
  updateArcProfile(userId: string, profile: { arcTone?: string; arcPromptStyle?: string; arcDepth?: string }): Promise<User>;

  // Arc dialogue operations
  createArcDialogue(userId: string, dialogue: InsertArcDialogue): Promise<ArcDialogue>;
  getArcDialogueHistory(userId: string, limit?: number): Promise<ArcDialogue[]>;

  // Insight graph operations
  createInsightNode(userId: string, node: InsertInsightNode): Promise<InsightNode>;
  createInsightEdge(userId: string, edge: InsertInsightEdge): Promise<InsightEdge>;
  getInsightGraph(userId: string): Promise<{ nodes: InsightNode[]; edges: InsightEdge[] }>;
  getRecentInsightNodes(userId: string, limit?: number): Promise<InsightNode[]>;

  // Monthly constellation operations
  createMonthlyConstellation(userId: string, constellation: InsertMonthlyConstellation): Promise<MonthlyConstellation>;
  getMonthlyConstellations(userId: string, limit?: number): Promise<MonthlyConstellation[]>;
  getLatestConstellation(userId: string): Promise<MonthlyConstellation | undefined>;

  // Memory loop operations
  createMemoryLoop(userId: string, memoryLoopData: InsertMemoryLoop): Promise<MemoryLoop>;
  getMemoryLoops(userId: string, limit?: number): Promise<MemoryLoop[]>;

  // Inner compass operations
  createInnerCompassPrompt(userId: string, promptData: InsertInnerCompassPrompt): Promise<InnerCompassPrompt>;
  getTodaysPrompt(userId: string): Promise<InnerCompassPrompt | undefined>;

  // Memory loop operations
  createMemoryLoop(userId: string, memoryLoop: InsertMemoryLoop): Promise<MemoryLoop>;
  getMemoryLoops(userId: string, limit?: number): Promise<MemoryLoop[]>;
  
  // Inner compass operations
  createInnerCompassPrompt(userId: string, prompt: InsertInnerCompassPrompt): Promise<InnerCompassPrompt>;
  getTodaysPrompt(userId: string): Promise<InnerCompassPrompt | undefined>;
  getInnerCompassPrompts(userId: string, limit?: number): Promise<InnerCompassPrompt[]>;

  // User traits operations
  getUserTraits(userId: string): Promise<UserTraits | undefined>;
  upsertUserTraits(userId: string, traits: Partial<InsertUserTraits>): Promise<UserTraits>;
  updateBehaviorMetrics(userId: string, event: string, data: any): Promise<void>;

  // Journal embeddings operations
  createJournalEmbedding(userId: string, embedding: InsertJournalEmbedding): Promise<JournalEmbedding>;
  getJournalEmbeddings(userId: string, limit?: number): Promise<JournalEmbedding[]>;

  // Insight feedback operations
  createInsightFeedback(userId: string, feedback: InsertInsightFeedback): Promise<InsightFeedback>;
  getInsightFeedback(insightId: string): Promise<InsightFeedback[]>;

  // Ritual streak operations
  getRitualStreak(userId: string): Promise<RitualStreak | undefined>;
  upsertRitualStreak(userId: string, streak: InsertRitualStreak): Promise<RitualStreak>;

  // Life arc tags operations
  createLifeArcTag(userId: string, tag: InsertLifeArcTag): Promise<LifeArcTag>;
  getLifeArcTags(userId: string, limit?: number): Promise<LifeArcTag[]>;
  getUserLifeArcSummary(userId: string): Promise<{ topThemes: Array<{ tag: string; count: number }>; recentTags: string[] }>;

  // Error logging operations
  createErrorLog(errorData: InsertErrorLog): Promise<ErrorLog>;
  getErrorLogs(limit?: number, type?: string): Promise<ErrorLog[]>;

  // Emotion trends operations
  upsertEmotionTrend(userId: string, trend: Omit<InsertEmotionTrend, 'userId'>): Promise<EmotionTrend>;
  getEmotionTrends(userId: string, days?: number): Promise<EmotionTrend[]>;

  // Tone vectors operations
  upsertToneVector(userId: string, vector: any): Promise<ToneVector>;
  getToneVector(userId: string): Promise<ToneVector | undefined>;

  // Insight logs operations
  createInsightLog(logData: InsertInsightLog): Promise<InsightLog>;
  getInsightLogCount(): Promise<number>;

  // Admin analytics operations
  getUserCount(): Promise<number>;
  getSavedReflectionCount(): Promise<number>;
  getJournalEntryCount(): Promise<number>;
  getPremiumUserCount(): Promise<number>;
  getEmotionTrendCount(): Promise<number>;
  getEmotionAnalytics(): Promise<{
    avgScore: number;
    scores: number[];
    dominantEmotions: Record<string, number>;
  }>;
  getRecentActivity(): Promise<Array<{
    date: string;
    users: number;
    entries: number;
    insights: number;
  }>>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  // Voice journaling operations
  async createVoiceEntry(entryId: number, voiceData: InsertVoiceEntry): Promise<VoiceEntry> {
    const [voiceEntry] = await db
      .insert(voiceEntries)
      .values({ ...voiceData, entryId })
      .returning();
    return voiceEntry;
  }

  async getVoiceEntry(entryId: number): Promise<VoiceEntry | undefined> {
    const [voiceEntry] = await db
      .select()
      .from(voiceEntries)
      .where(eq(voiceEntries.entryId, entryId));
    return voiceEntry;
  }

  async updateVoiceEntry(id: number, updates: Partial<InsertVoiceEntry>): Promise<VoiceEntry> {
    const [voiceEntry] = await db
      .update(voiceEntries)
      .set(updates)
      .where(eq(voiceEntries.id, id))
      .returning();
    return voiceEntry;
  }

  // Community operations
  async createCommunityMood(userId: string, moodData: InsertCommunityMood): Promise<CommunityMood> {
    const [communityMood] = await db
      .insert(communityMoods)
      .values({ ...moodData, userId })
      .returning();
    return communityMood;
  }

  async getCommunityMoods(location?: string, limit: number = 50): Promise<CommunityMood[]> {
    let query = db
      .select()
      .from(communityMoods)
      .where(eq(communityMoods.isPublic, true))
      .orderBy(desc(communityMoods.createdAt))
      .limit(limit);

    if (location) {
      query = query.where(and(eq(communityMoods.isPublic, true), eq(communityMoods.location, location)));
    }

    return await query;
  }

  async createCommunitySupport(support: InsertCommunitySupport): Promise<CommunitySupport> {
    const [communitySupport] = await db
      .insert(communitySupport)
      .values(support)
      .returning();
    return communitySupport;
  }

  async getCommunitySupportForUser(userId: string): Promise<CommunitySupport[]> {
    return await db
      .select()
      .from(communitySupport)
      .where(eq(communitySupport.toUserId, userId))
      .orderBy(desc(communitySupport.createdAt));
  }

  // Subscription operations
  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    return subscription;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();
    return newSubscription;
  }

  async updateSubscription(userId: string, updates: Partial<InsertSubscription>): Promise<Subscription> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.userId, userId))
      .returning();
    return subscription;
  }

  // Health data operations
  async createHealthData(userId: string, data: InsertHealthData): Promise<HealthData> {
    const [healthData] = await db
      .insert(healthData)
      .values({ ...data, userId })
      .returning();
    return healthData;
  }

  async getHealthData(userId: string, dateRange?: { start: Date; end: Date }): Promise<HealthData[]> {
    let query = db
      .select()
      .from(healthData)
      .where(eq(healthData.userId, userId))
      .orderBy(desc(healthData.date));

    if (dateRange) {
      query = query.where(
        and(
          eq(healthData.userId, userId),
          gte(healthData.date, dateRange.start),
          lte(healthData.date, dateRange.end)
        )
      );
    }

    return await query;
  }

  // Mood prediction operations
  async createMoodPrediction(userId: string, prediction: InsertMoodPrediction): Promise<MoodPrediction> {
    const [moodPrediction] = await db
      .insert(moodPredictions)
      .values({ ...prediction, userId })
      .returning();
    return moodPrediction;
  }

  async getMoodPredictions(userId: string, limit: number = 10): Promise<MoodPrediction[]> {
    return await db
      .select()
      .from(moodPredictions)
      .where(eq(moodPredictions.userId, userId))
      .orderBy(desc(moodPredictions.createdAt))
      .limit(limit);
  }

  // Data export operations
  async createDataExport(userId: string, exportData: InsertDataExport): Promise<DataExport> {
    const [dataExport] = await db
      .insert(dataExports)
      .values({ ...exportData, userId })
      .returning();
    return dataExport;
  }

  async getDataExports(userId: string): Promise<DataExport[]> {
    return await db
      .select()
      .from(dataExports)
      .where(eq(dataExports.userId, userId))
      .orderBy(desc(dataExports.createdAt));
  }

  async updateDataExport(id: number, updates: Partial<InsertDataExport>): Promise<DataExport> {
    const [dataExport] = await db
      .update(dataExports)
      .set(updates)
      .where(eq(dataExports.id, id))
      .returning();
    return dataExport;
  }

  // Push notification operations
  async createPushSubscription(userId: string, subscription: InsertPushSubscription): Promise<PushSubscription> {
    const [pushSubscription] = await db
      .insert(pushSubscriptions)
      .values({ ...subscription, userId })
      .returning();
    return pushSubscription;
  }

  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return await db
      .select()
      .from(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.isActive, true)));
  }

  async updatePushSubscription(id: number, updates: Partial<InsertPushSubscription>): Promise<PushSubscription> {
    const [pushSubscription] = await db
      .update(pushSubscriptions)
      .set(updates)
      .where(eq(pushSubscriptions.id, id))
      .returning();
    return pushSubscription;
  }

  // Achievement operations
  async createUserAchievement(userId: string, achievement: InsertUserAchievement): Promise<UserAchievement> {
    const [userAchievement] = await db
      .insert(userAchievements)
      .values({ ...achievement, userId })
      .returning();
    return userAchievement;
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.unlockedAt));
  }

  async updateUserAchievement(id: number, updates: Partial<InsertUserAchievement>): Promise<UserAchievement> {
    const [userAchievement] = await db
      .update(userAchievements)
      .set(updates)
      .where(eq(userAchievements.id, id))
      .returning();
    return userAchievement;
  }

  // Challenge operations
  async createUserChallenge(userId: string, challenge: InsertUserChallenge): Promise<UserChallenge> {
    const [userChallenge] = await db
      .insert(userChallenges)
      .values({ ...challenge, userId })
      .returning();
    return userChallenge;
  }

  async getUserChallenges(userId: string, status?: string): Promise<UserChallenge[]> {
    let query = db
      .select()
      .from(userChallenges)
      .where(eq(userChallenges.userId, userId))
      .orderBy(desc(userChallenges.startDate));

    if (status) {
      query = query.where(and(eq(userChallenges.userId, userId), eq(userChallenges.status, status)));
    }

    return await query;
  }

  async updateUserChallenge(id: number, updates: Partial<InsertUserChallenge>): Promise<UserChallenge> {
    const [userChallenge] = await db
      .update(userChallenges)
      .set(updates)
      .where(eq(userChallenges.id, id))
      .returning();
    return userChallenge;
  }

  // Secret scroll operations (simplified implementation)
  async createSecretScroll(userId: string, scroll: any): Promise<any> {
    // Placeholder implementation - would store in database
    return { id: Date.now(), userId, ...scroll, createdAt: new Date() };
  }

  async getSecretScrolls(userId: string): Promise<any[]> {
    // Placeholder implementation - would fetch from database
    return [];
  }
  
  // Saved reflection operations (simplified implementation)
  async saveReflection(userId: string, reflection: any): Promise<any> {
    // Placeholder implementation - would store in database
    return { id: Date.now(), userId, ...reflection, createdAt: new Date() };
  }

  async getSavedReflections(userId: string): Promise<any[]> {
    // Placeholder implementation - would fetch from database
    return [];
  }
  
  // Ritual operations (simplified implementation)
  async createRitual(userId: string, ritual: any): Promise<any> {
    // Placeholder implementation - would store in database
    return { id: Date.now(), userId, ...ritual, createdAt: new Date() };
  }

  async getUserRituals(userId: string): Promise<any[]> {
    // Placeholder implementation - would fetch from database
    return [];
  }

  // Echo archive operations
  async createEcho(userId: string, echoData: InsertEchoArchive): Promise<EchoArchive> {
    const [echo] = await this.db
      .insert(echoArchive)
      .values({
        ...echoData,
        userId,
      })
      .returning();
    return echo;
  }

  async getLatestEcho(userId: string): Promise<EchoArchive | undefined> {
    const [echo] = await this.db
      .select()
      .from(echoArchive)
      .where(eq(echoArchive.userId, userId))
      .orderBy(desc(echoArchive.createdAt))
      .limit(1);
    return echo;
  }

  async getEchoHistory(userId: string, limit: number = 10): Promise<EchoArchive[]> {
    return await this.db
      .select()
      .from(echoArchive)
      .where(eq(echoArchive.userId, userId))
      .orderBy(desc(echoArchive.createdAt))
      .limit(limit);
  }

  // Prompt feedback operations
  async createPromptFeedback(userId: string, feedbackData: InsertPromptFeedback): Promise<PromptFeedback> {
    const [feedback] = await this.db
      .insert(promptFeedback)
      .values({
        ...feedbackData,
        userId,
      })
      .returning();
    return feedback;
  }

  async getPromptFeedback(userId: string, limit: number = 30): Promise<PromptFeedback[]> {
    return await this.db
      .select()
      .from(promptFeedback)
      .where(eq(promptFeedback.userId, userId))
      .orderBy(desc(promptFeedback.createdAt))
      .limit(limit);
  }

  async updateUserPromptRatios(userId: string): Promise<User> {
    // Get recent feedback
    const recentFeedback = await this.getPromptFeedback(userId, 50);
    
    const likedFeedback = recentFeedback.filter(f => f.feedback === 'liked');
    const totalFeedback = recentFeedback.filter(f => f.feedback !== null);
    
    if (totalFeedback.length === 0) {
      // No feedback yet, keep defaults
      return await this.getUser(userId) as User;
    }
    
    const affirmationLiked = likedFeedback.filter(f => f.type === 'affirmation').length;
    const reflectionLiked = likedFeedback.filter(f => f.type === 'reflection').length;
    const totalLiked = likedFeedback.length;
    
    let affirmationRatio = 0.5;
    let reflectionRatio = 0.5;
    
    if (totalLiked > 0) {
      affirmationRatio = affirmationLiked / totalLiked;
      reflectionRatio = reflectionLiked / totalLiked;
    }
    
    const [updatedUser] = await this.db
      .update(users)
      .set({
        affirmationRatio,
        reflectionRatio,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }

  // Memory tag operations
  async upsertMemoryTag(userId: string, tag: string, strength: number): Promise<UserMemoryTag> {
    const existingTag = await this.db
      .select()
      .from(userMemoryTags)
      .where(and(eq(userMemoryTags.userId, userId), eq(userMemoryTags.tag, tag)))
      .limit(1);

    if (existingTag.length > 0) {
      // Update existing tag
      const [updatedTag] = await this.db
        .update(userMemoryTags)
        .set({
          strength,
          lastSeen: new Date(),
        })
        .where(eq(userMemoryTags.id, existingTag[0].id))
        .returning();
      return updatedTag;
    } else {
      // Insert new tag
      const [newTag] = await this.db
        .insert(userMemoryTags)
        .values({
          userId,
          tag,
          strength,
          lastSeen: new Date(),
        })
        .returning();
      return newTag;
    }
  }

  async getUserMemoryTags(userId: string, limit: number = 20): Promise<UserMemoryTag[]> {
    return await this.db
      .select()
      .from(userMemoryTags)
      .where(eq(userMemoryTags.userId, userId))
      .orderBy(desc(userMemoryTags.lastSeen))
      .limit(limit);
  }

  async getTopUserThemes(userId: string, limit: number = 5): Promise<UserMemoryTag[]> {
    return await this.db
      .select()
      .from(userMemoryTags)
      .where(eq(userMemoryTags.userId, userId))
      .orderBy(desc(userMemoryTags.strength))
      .limit(limit);
  }

  // Life chapter operations
  async createLifeChapter(userId: string, chapterData: InsertLifeChapter): Promise<LifeChapter> {
    const [chapter] = await this.db
      .insert(lifeChapters)
      .values({
        ...chapterData,
        userId,
      })
      .returning();
    return chapter;
  }

  async getLifeChapters(userId: string, limit: number = 20): Promise<LifeChapter[]> {
    return await this.db
      .select()
      .from(lifeChapters)
      .where(eq(lifeChapters.userId, userId))
      .orderBy(desc(lifeChapters.createdAt))
      .limit(limit);
  }

  async getLatestChapter(userId: string): Promise<LifeChapter | undefined> {
    const [chapter] = await this.db
      .select()
      .from(lifeChapters)
      .where(eq(lifeChapters.userId, userId))
      .orderBy(desc(lifeChapters.createdAt))
      .limit(1);
    return chapter;
  }

  // Arc persona operations
  async getArcProfile(userId: string): Promise<{ arcTone: string; arcPromptStyle: string; arcDepth: string } | null> {
    const [user] = await this.db
      .select({
        arcTone: users.arcTone,
        arcPromptStyle: users.arcPromptStyle,
        arcDepth: users.arcDepth,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return user || null;
  }

  async updateArcProfile(userId: string, profile: { arcTone?: string; arcPromptStyle?: string; arcDepth?: string }): Promise<User> {
    const [updatedUser] = await this.db
      .update(users)
      .set({
        ...profile,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
  }

  // Arc dialogue operations
  async createArcDialogue(userId: string, dialogueData: InsertArcDialogue): Promise<ArcDialogue> {
    const [dialogue] = await this.db
      .insert(arcDialogue)
      .values({
        ...dialogueData,
        userId,
      })
      .returning();
    return dialogue;
  }

  async getArcDialogueHistory(userId: string, limit: number = 20): Promise<ArcDialogue[]> {
    return await this.db
      .select()
      .from(arcDialogue)
      .where(eq(arcDialogue.userId, userId))
      .orderBy(desc(arcDialogue.createdAt))
      .limit(limit);
  }

  // Insight graph operations
  async createInsightNode(userId: string, nodeData: InsertInsightNode): Promise<InsightNode> {
    const [node] = await this.db
      .insert(insightNodes)
      .values({
        ...nodeData,
        userId,
      })
      .returning();
    return node;
  }

  async createInsightEdge(userId: string, edgeData: InsertInsightEdge): Promise<InsightEdge> {
    const [edge] = await this.db
      .insert(insightEdges)
      .values({
        ...edgeData,
        userId,
      })
      .returning();
    return edge;
  }

  async getInsightGraph(userId: string): Promise<{ nodes: InsightNode[]; edges: InsightEdge[] }> {
    const nodes = await this.db
      .select()
      .from(insightNodes)
      .where(eq(insightNodes.userId, userId))
      .orderBy(desc(insightNodes.createdAt));

    const edges = await this.db
      .select()
      .from(insightEdges)
      .where(eq(insightEdges.userId, userId));

    return { nodes, edges };
  }

  async getRecentInsightNodes(userId: string, limit: number = 10): Promise<InsightNode[]> {
    return await this.db
      .select()
      .from(insightNodes)
      .where(eq(insightNodes.userId, userId))
      .orderBy(desc(insightNodes.createdAt))
      .limit(limit);
  }

  // Monthly constellation operations
  async createMonthlyConstellation(userId: string, constellationData: InsertMonthlyConstellation): Promise<MonthlyConstellation> {
    const [constellation] = await this.db
      .insert(monthlyConstellations)
      .values({
        ...constellationData,
        userId,
      })
      .returning();
    return constellation;
  }

  async getMonthlyConstellations(userId: string, limit: number = 12): Promise<MonthlyConstellation[]> {
    return await this.db
      .select()
      .from(monthlyConstellations)
      .where(eq(monthlyConstellations.userId, userId))
      .orderBy(desc(monthlyConstellations.createdAt))
      .limit(limit);
  }

  async getLatestConstellation(userId: string): Promise<MonthlyConstellation | undefined> {
    const [constellation] = await db
      .select()
      .from(monthlyConstellations)
      .where(eq(monthlyConstellations.userId, userId))
      .orderBy(desc(monthlyConstellations.createdAt))
      .limit(1);
    return constellation;
  }

  // Memory loop operations
  async createMemoryLoop(userId: string, memoryLoopData: InsertMemoryLoop): Promise<MemoryLoop> {
    try {
      const [memoryLoop] = await db
        .insert(memoryLoops)
        .values({
          userId,
          ...memoryLoopData,
        })
        .returning();
      return memoryLoop;
    } catch (error) {
      console.error('Error creating memory loop:', error);
      throw error;
    }
  }

  async getMemoryLoops(userId: string, limit: number = 10): Promise<MemoryLoop[]> {
    try {
      return await db
        .select()
        .from(memoryLoops)
        .where(eq(memoryLoops.userId, userId))
        .orderBy(desc(memoryLoops.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Error getting memory loops:', error);
      return [];
    }
  }

  // Inner compass operations
  async createInnerCompassPrompt(userId: string, promptData: InsertInnerCompassPrompt): Promise<InnerCompassPrompt> {
    try {
      const [prompt] = await db
        .insert(innerCompassPrompts)
        .values({
          userId,
          ...promptData,
        })
        .returning();
      return prompt;
    } catch (error) {
      console.error('Error creating inner compass prompt:', error);
      throw error;
    }
  }

  async getTodaysPrompt(userId: string): Promise<InnerCompassPrompt | undefined> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [prompt] = await db
        .select()
        .from(innerCompassPrompts)
        .where(
          and(
            eq(innerCompassPrompts.userId, userId),
            gte(innerCompassPrompts.createdAt, today)
          )
        )
        .orderBy(desc(innerCompassPrompts.createdAt))
        .limit(1);
      
      return prompt;
    } catch (error) {
      console.error('Error getting today\'s prompt:', error);
      return undefined;
    }
  }

  async getInnerCompassPrompts(userId: string, limit: number = 20): Promise<InnerCompassPrompt[]> {
    return await db
      .select()
      .from(innerCompassPrompts)
      .where(eq(innerCompassPrompts.userId, userId))
      .orderBy(desc(innerCompassPrompts.createdAt))
      .limit(limit);
  }

  // User traits operations
  async getUserTraits(userId: string): Promise<UserTraits | undefined> {
    const [traits] = await db
      .select()
      .from(userTraits)
      .where(eq(userTraits.userId, userId));
    return traits;
  }

  async upsertUserTraits(userId: string, traitsData: Partial<InsertUserTraits>): Promise<UserTraits> {
    const [traits] = await db
      .insert(userTraits)
      .values({
        userId,
        ...traitsData,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: userTraits.userId,
        set: {
          ...traitsData,
          updatedAt: new Date()
        }
      })
      .returning();
    return traits;
  }

  async updateBehaviorMetrics(userId: string, event: string, data: any): Promise<void> {
    // Update user traits based on behavior patterns
    const currentTraits = await this.getUserTraits(userId);
    const updates: Partial<InsertUserTraits> = {};

    switch (event) {
      case 'tap_to_deepen':
        updates.likesQuestions = true;
        break;
      case 'skip_deeper_prompt':
        updates.likesAffirmations = true;
        updates.likesQuestions = false;
        break;
      case 'journal_entry_time':
        // Track writing times to determine peak hours
        const hour = new Date(data.timestamp).getHours();
        const hourString = `${hour.toString().padStart(2, '0')}:00`;
        const currentPeakHours = currentTraits?.peakHours || ['09:00', '21:00'];
        if (!currentPeakHours.includes(hourString)) {
          updates.peakHours = [...currentPeakHours.slice(-1), hourString];
        }
        break;
      case 'journal_word_count':
        // Update writing style based on word count patterns
        if (data.wordCount > 200) {
          updates.writingStyle = 'reflective';
        } else if (data.wordCount < 50) {
          updates.writingStyle = 'concise';
        }
        break;
      case 'emotion_score':
        // Update mood baseline based on recent entries
        if (currentTraits?.moodBaseline) {
          updates.moodBaseline = (currentTraits.moodBaseline * 0.8) + (data.score * 0.2);
        } else {
          updates.moodBaseline = data.score;
        }
        break;
    }

    if (Object.keys(updates).length > 0) {
      await this.upsertUserTraits(userId, updates);
    }
  }

  // Journal embeddings operations
  async createJournalEmbedding(userId: string, embeddingData: InsertJournalEmbedding): Promise<JournalEmbedding> {
    const [embedding] = await db
      .insert(journalEmbeddings)
      .values({
        userId,
        ...embeddingData,
      })
      .returning();
    return embedding;
  }

  async getJournalEmbeddings(userId: string, limit: number = 100): Promise<JournalEmbedding[]> {
    return await db
      .select()
      .from(journalEmbeddings)
      .where(eq(journalEmbeddings.userId, userId))
      .orderBy(desc(journalEmbeddings.createdAt))
      .limit(limit);
  }

  // Insight feedback operations
  async createInsightFeedback(userId: string, feedbackData: InsertInsightFeedback): Promise<InsightFeedback> {
    const [feedback] = await db
      .insert(insightFeedback)
      .values({
        userId,
        ...feedbackData,
      })
      .returning();
    return feedback;
  }

  async getInsightFeedback(insightId: string): Promise<InsightFeedback[]> {
    return await db
      .select()
      .from(insightFeedback)
      .where(eq(insightFeedback.insightId, insightId))
      .orderBy(desc(insightFeedback.createdAt));
  }

  // Ritual streak operations
  async getRitualStreak(userId: string): Promise<RitualStreak | undefined> {
    const [streak] = await db
      .select()
      .from(ritualStreaks)
      .where(eq(ritualStreaks.userId, userId));
    return streak;
  }

  async upsertRitualStreak(userId: string, streakData: InsertRitualStreak): Promise<RitualStreak> {
    const [streak] = await db
      .insert(ritualStreaks)
      .values(streakData)
      .onConflictDoUpdate({
        target: ritualStreaks.userId,
        set: streakData
      })
      .returning();
    return streak;
  }

  // Life arc tags operations
  async createLifeArcTag(userId: string, tagData: InsertLifeArcTag): Promise<LifeArcTag> {
    const [tag] = await db
      .insert(lifeArcTags)
      .values({
        userId,
        ...tagData,
      })
      .returning();
    return tag;
  }

  async getLifeArcTags(userId: string, limit: number = 100): Promise<LifeArcTag[]> {
    return await db
      .select()
      .from(lifeArcTags)
      .where(eq(lifeArcTags.userId, userId))
      .orderBy(desc(lifeArcTags.createdAt))
      .limit(limit);
  }

  async getUserLifeArcSummary(userId: string): Promise<{ topThemes: Array<{ tag: string; count: number }>; recentTags: string[] }> {
    const allTags = await this.getLifeArcTags(userId, 100);
    
    // Count tag frequencies
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag.tag] = (acc[tag.tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get top themes
    const topThemes = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get recent tags (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTags = allTags
      .filter(tag => new Date(tag.createdAt) >= thirtyDaysAgo)
      .map(tag => tag.tag)
      .slice(0, 10);

    return { topThemes, recentTags };
  }

  // Error logging operations
  async createErrorLog(errorData: InsertErrorLog): Promise<ErrorLog> {
    const [error] = await this.db
      .insert(errorLogs)
      .values(errorData)
      .returning();
    return error;
  }

  async getErrorLogs(limit: number = 50, type?: string): Promise<ErrorLog[]> {
    let query = this.db
      .select()
      .from(errorLogs)
      .orderBy(desc(errorLogs.createdAt))
      .limit(limit);

    if (type) {
      query = query.where(eq(errorLogs.type, type));
    }

    return await query;
  }

  // Emotion trends operations
  async upsertEmotionTrend(userId: string, trendData: Omit<InsertEmotionTrend, 'userId'>): Promise<EmotionTrend> {
    const [trend] = await db
      .insert(emotionTrends)
      .values({
        userId,
        ...trendData
      })
      .onConflictDoUpdate({
        target: [emotionTrends.userId, emotionTrends.date],
        set: {
          score: trendData.score,
          dominantEmotion: trendData.dominantEmotion
        }
      })
      .returning();
    return trend;
  }

  async getEmotionTrends(userId: string, days: number = 30): Promise<EmotionTrend[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await db
      .select()
      .from(emotionTrends)
      .where(eq(emotionTrends.userId, userId))
      .orderBy(desc(emotionTrends.date))
      .limit(days);
  }

  // Tone vectors operations
  async upsertToneVector(userId: string, vector: any): Promise<ToneVector> {
    const [toneVector] = await db
      .insert(toneVectors)
      .values({
        userId,
        vector: JSON.stringify(vector)
      })
      .onConflictDoUpdate({
        target: toneVectors.userId,
        set: {
          vector: JSON.stringify(vector),
          updatedAt: new Date()
        }
      })
      .returning();
    return toneVector;
  }

  async getToneVector(userId: string): Promise<ToneVector | undefined> {
    const [toneVector] = await db
      .select()
      .from(toneVectors)
      .where(eq(toneVectors.userId, userId));
    return toneVector;
  }

  // Insight logs operations
  async createInsightLog(logData: InsertInsightLog): Promise<InsightLog> {
    const [log] = await db
      .insert(insightLogs)
      .values(logData)
      .returning();
    return log;
  }

  async getInsightLogCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(insightLogs);
    return result[0]?.count || 0;
  }

  // Admin analytics operations
  async getUserCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(distinct ${users.id})` })
      .from(users);
    return result[0]?.count || 0;
  }

  async getSavedReflectionCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(reflections);
    return result[0]?.count || 0;
  }

  async getJournalEntryCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(journalEntries);
    return result[0]?.count || 0;
  }

  async getPremiumUserCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isPremium, true));
    return result[0]?.count || 0;
  }

  async getEmotionTrendCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(emotionTrends);
    return result[0]?.count || 0;
  }

  async getEmotionAnalytics(): Promise<{
    avgScore: number;
    scores: number[];
    dominantEmotions: Record<string, number>;
  }> {
    const trends = await db
      .select({
        score: emotionTrends.score,
        dominantEmotion: emotionTrends.dominantEmotion
      })
      .from(emotionTrends)
      .limit(1000); // Limit for performance

    const scores = trends.map(t => t.score);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const dominantEmotions = trends.reduce((acc, trend) => {
      if (trend.dominantEmotion) {
        acc[trend.dominantEmotion] = (acc[trend.dominantEmotion] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      avgScore,
      scores,
      dominantEmotions
    };
  }

  async getRecentActivity(): Promise<Array<{
    date: string;
    users: number;
    entries: number;
    insights: number;
  }>> {
    // Get activity for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activity = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Count users active on this date
      const usersResult = await db
        .select({ count: sql<number>`count(distinct ${journalEntries.userId})` })
        .from(journalEntries)
        .where(sql`date(${journalEntries.createdAt}) = ${dateStr}`);

      // Count entries created on this date
      const entriesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(journalEntries)
        .where(sql`date(${journalEntries.createdAt}) = ${dateStr}`);

      // Count insights generated on this date
      const insightsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(insightLogs)
        .where(sql`date(${insightLogs.timestamp}) = ${dateStr}`);

      activity.push({
        date: date.toLocaleDateString(),
        users: usersResult[0]?.count || 0,
        entries: entriesResult[0]?.count || 0,
        insights: insightsResult[0]?.count || 0
      });
    }

    return activity.reverse(); // Most recent first
  }

  // Error logging operations
  async createErrorLog(errorData: InsertErrorLog): Promise<ErrorLog> {
    const [errorLog] = await this.db
      .insert(errorLogs)
      .values(errorData)
      .returning();
    return errorLog;
  }

  async getErrorLogs(limit: number = 50, type?: string): Promise<ErrorLog[]> {
    let query = this.db
      .select()
      .from(errorLogs)
      .orderBy(desc(errorLogs.createdAt))
      .limit(limit);

    if (type) {
      query = query.where(eq(errorLogs.type, type));
    }

    return await query;
  }
}

export const storage = new DatabaseStorage();
