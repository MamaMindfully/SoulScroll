import { apiRequest } from '@/lib/queryClient';
import { addBreadcrumb, captureError } from '@/utils/sentry';
import { performanceMonitor } from '@/utils/performance';

export interface JournalEntry {
  id: number;
  content: string;
  mood?: number;
  wordCount: number;
  aiResponse?: string;
  emotionScore?: number;
  themes?: string[];
  insights?: string[];
  tags?: string[];
  primaryEmotion?: string;
  emotionIntensity?: number;
  valenceScore?: number;
  insightDepth?: number;
  complexityScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalEntryParams {
  content: string;
  mood?: number;
  tags?: string[];
}

export interface JournalApiResponse {
  entry: JournalEntry;
  message: string;
  aiAnalyzing: boolean;
}

export class JournalApi {
  
  /**
   * Create a new journal entry
   */
  static async createEntry(params: CreateJournalEntryParams): Promise<JournalApiResponse> {
    performanceMonitor.startMark('journal-api-create');
    addBreadcrumb('Creating journal entry', 'api', {
      contentLength: params.content.length,
      mood: params.mood,
      tags: params.tags?.length || 0
    });

    try {
      const response = await apiRequest('POST', '/api/journal', params);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create journal entry');
      }

      const data = await response.json();
      
      addBreadcrumb('Journal entry created successfully', 'api', {
        entryId: data.entry.id,
        aiAnalyzing: data.aiAnalyzing
      });

      return data;

    } catch (error) {
      captureError(error as Error, {
        context: 'journal-api-create',
        params
      });
      throw error;
    } finally {
      performanceMonitor.endMark('journal-api-create');
    }
  }

  /**
   * Get user's journal entries
   */
  static async getEntries(limit: number = 20, offset: number = 0): Promise<JournalEntry[]> {
    performanceMonitor.startMark('journal-api-get-entries');
    addBreadcrumb('Fetching journal entries', 'api', { limit, offset });

    try {
      const response = await apiRequest('GET', `/api/journal-entries?limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch journal entries');
      }

      const data = await response.json();
      
      addBreadcrumb('Journal entries fetched', 'api', {
        count: data.entries?.length || 0
      });

      return data.entries || [];

    } catch (error) {
      captureError(error as Error, {
        context: 'journal-api-get-entries',
        limit,
        offset
      });
      throw error;
    } finally {
      performanceMonitor.endMark('journal-api-get-entries');
    }
  }

  /**
   * Get specific journal entry
   */
  static async getEntry(id: number): Promise<JournalEntry> {
    performanceMonitor.startMark('journal-api-get-entry');
    addBreadcrumb('Fetching journal entry', 'api', { entryId: id });

    try {
      const response = await apiRequest('GET', `/api/journal-entries/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch journal entry');
      }

      const data = await response.json();
      
      addBreadcrumb('Journal entry fetched', 'api', { entryId: id });

      return data.entry;

    } catch (error) {
      captureError(error as Error, {
        context: 'journal-api-get-entry',
        entryId: id
      });
      throw error;
    } finally {
      performanceMonitor.endMark('journal-api-get-entry');
    }
  }

  /**
   * Update journal entry
   */
  static async updateEntry(id: number, updates: Partial<CreateJournalEntryParams>): Promise<JournalEntry> {
    performanceMonitor.startMark('journal-api-update');
    addBreadcrumb('Updating journal entry', 'api', { entryId: id, updates });

    try {
      const response = await apiRequest('PATCH', `/api/journal-entries/${id}`, updates);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update journal entry');
      }

      const data = await response.json();
      
      addBreadcrumb('Journal entry updated', 'api', { entryId: id });

      return data.entry;

    } catch (error) {
      captureError(error as Error, {
        context: 'journal-api-update',
        entryId: id,
        updates
      });
      throw error;
    } finally {
      performanceMonitor.endMark('journal-api-update');
    }
  }

  /**
   * Delete journal entry
   */
  static async deleteEntry(id: number): Promise<void> {
    performanceMonitor.startMark('journal-api-delete');
    addBreadcrumb('Deleting journal entry', 'api', { entryId: id });

    try {
      const response = await apiRequest('DELETE', `/api/journal-entries/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete journal entry');
      }

      addBreadcrumb('Journal entry deleted', 'api', { entryId: id });

    } catch (error) {
      captureError(error as Error, {
        context: 'journal-api-delete',
        entryId: id
      });
      throw error;
    } finally {
      performanceMonitor.endMark('journal-api-delete');
    }
  }

  /**
   * Search journal entries
   */
  static async searchEntries(query: string, filters?: {
    mood?: number;
    emotions?: string[];
    themes?: string[];
    dateRange?: { start: string; end: string };
  }): Promise<JournalEntry[]> {
    performanceMonitor.startMark('journal-api-search');
    addBreadcrumb('Searching journal entries', 'api', { query, filters });

    try {
      const searchParams = new URLSearchParams({
        q: query,
        ...(filters?.mood && { mood: filters.mood.toString() }),
        ...(filters?.emotions && { emotions: filters.emotions.join(',') }),
        ...(filters?.themes && { themes: filters.themes.join(',') }),
        ...(filters?.dateRange && { 
          startDate: filters.dateRange.start,
          endDate: filters.dateRange.end
        })
      });

      const response = await apiRequest('GET', `/api/journal-entries/search?${searchParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search journal entries');
      }

      const data = await response.json();
      
      addBreadcrumb('Journal search completed', 'api', {
        query,
        resultsCount: data.entries?.length || 0
      });

      return data.entries || [];

    } catch (error) {
      captureError(error as Error, {
        context: 'journal-api-search',
        query,
        filters
      });
      throw error;
    } finally {
      performanceMonitor.endMark('journal-api-search');
    }
  }
}