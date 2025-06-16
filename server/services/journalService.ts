import { storage } from "../storage";
import { openaiService } from "./openai";

class JournalService {
  async generateAIResponse(entryId: number): Promise<void> {
    try {
      const entry = await storage.getJournalEntryById(entryId);
      if (!entry) return;

      // Get recent entries for context
      const recentEntries = await storage.getJournalEntries(entry.userId, 5);
      const previousTexts = recentEntries
        .filter(e => e.id !== entryId)
        .map(e => e.content)
        .slice(0, 3); // Last 3 entries for context

      // Analyze emotional tone
      const emotionalAnalysis = await openaiService.analyzeEmotionalTone(entry.content);

      // Generate compassionate response
      const aiReflection = await openaiService.generateCompassionateResponse(
        entry.content,
        previousTexts,
        emotionalAnalysis
      );

      // Update entry with AI response and emotional analysis
      await storage.updateJournalEntry(entryId, {
        aiResponse: aiReflection.content,
        emotionalTone: emotionalAnalysis,
      });

      console.log(`Generated AI response for entry ${entryId}`);
    } catch (error) {
      console.error(`Failed to generate AI response for entry ${entryId}:`, error);
    }
  }

  async generateWeeklyInsights(userId: string): Promise<void> {
    try {
      const entries = await storage.getJournalEntries(userId, 50); // Last 50 entries
      const thisWeekEntries = entries.filter(entry => {
        const entryDate = new Date(entry.createdAt!);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return entryDate >= weekAgo;
      });

      if (thisWeekEntries.length === 0) return;

      // Extract mood data
      const moodData = thisWeekEntries
        .filter(entry => entry.emotionalTone)
        .map(entry => ({
          date: entry.createdAt,
          rating: (entry.emotionalTone as any).rating,
          keywords: (entry.emotionalTone as any).keywords || [],
        }));

      // Extract top keywords
      const allKeywords = moodData.flatMap(data => data.keywords);
      const keywordCounts = allKeywords.reduce((acc, keyword) => {
        acc[keyword] = (acc[keyword] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topKeywords = Object.entries(keywordCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([keyword]) => keyword);

      // Generate insights
      const insights = `This week you explored themes around ${topKeywords.slice(0, 3).join(", ")}. Your emotional journey shows ${
        moodData.length > 0 
          ? `an average mood rating of ${(moodData.reduce((sum, data) => sum + data.rating, 0) / moodData.length).toFixed(1)}/5`
          : "thoughtful reflection"
      }.`;

      // Store insights
      await storage.createEmotionalInsight(userId, {
        period: 'weekly',
        moodData: moodData,
        topKeywords: topKeywords,
        insights,
      });

      console.log(`Generated weekly insights for user ${userId}`);
    } catch (error) {
      console.error(`Failed to generate weekly insights for user ${userId}:`, error);
    }
  }

  async generateMonthlyReflectionLetter(userId: string): Promise<void> {
    try {
      const user = await storage.getUser(userId);
      if (!user) return;

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get last month's entries
      const entries = await storage.getJournalEntries(userId, 100);
      const lastMonthEntries = entries.filter(entry => {
        const entryDate = new Date(entry.createdAt!);
        return entryDate >= lastMonth && entryDate < thisMonth;
      });

      if (lastMonthEntries.length === 0) return;

      // Generate reflection letter
      const entryTexts = lastMonthEntries.map(entry => entry.content);
      const letterContent = await openaiService.generateMonthlyReflectionLetter(
        entryTexts,
        user.firstName || undefined
      );

      // Store letter
      await storage.createReflectionLetter(userId, {
        content: letterContent,
        month: lastMonth.getMonth() + 1,
        year: lastMonth.getFullYear(),
      });

      console.log(`Generated monthly reflection letter for user ${userId}`);
    } catch (error) {
      console.error(`Failed to generate monthly reflection letter for user ${userId}:`, error);
    }
  }
}

export const journalService = new JournalService();
