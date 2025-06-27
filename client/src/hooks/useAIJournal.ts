import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { addBreadcrumb, captureError } from '@/utils/sentry';
import { performanceMonitor } from '@/utils/performance';

interface JournalAnalysisResult {
  insight: string;
  emotionScore: number;
  emotionLabels: string[];
  wordCount: number;
  insightDepth: number;
  timestamp: string;
  fallbackInsight?: string;
}

interface BatchAnalysisResult {
  results: Array<{
    text: string;
    emotionScore: number;
    emotionLabels: string[];
    wordCount: number;
    insightDepth: number;
    error?: string;
  }>;
  summary: {
    totalEntries: number;
    averageEmotionScore: number;
    totalWords: number;
  };
}

export const useAIJournal = () => {
  // Single journal entry analysis
  const analyzeJournalEntry = useMutation({
    mutationFn: async (entryText: string): Promise<JournalAnalysisResult> => {
      performanceMonitor.startMark('ai-journal-analysis');
      addBreadcrumb('Starting AI journal analysis', 'ai', { 
        textLength: entryText.length 
      });

      try {
        const response = await apiRequest('POST', '/api/ai/journal', {
          entryText
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'AI analysis failed');
        }

        const result = await response.json();
        
        addBreadcrumb('AI journal analysis completed', 'ai', {
          emotionScore: result.emotionScore,
          wordCount: result.wordCount,
          insightDepth: result.insightDepth
        });

        return result;

      } catch (error) {
        captureError(error as Error, {
          context: 'ai-journal-analysis',
          textLength: entryText.length
        });
        throw error;
      } finally {
        performanceMonitor.endMark('ai-journal-analysis');
      }
    },
    onSuccess: (data) => {
      console.log('AI analysis completed:', {
        emotionScore: data.emotionScore,
        emotions: data.emotionLabels,
        wordCount: data.wordCount
      });
    },
    onError: (error: Error) => {
      console.error('AI analysis failed:', error.message);
    }
  });

  // Batch analysis for multiple entries
  const analyzeBatchEntries = useMutation({
    mutationFn: async (entries: string[]): Promise<BatchAnalysisResult> => {
      performanceMonitor.startMark('ai-batch-analysis');
      addBreadcrumb('Starting AI batch analysis', 'ai', { 
        entriesCount: entries.length 
      });

      try {
        const response = await apiRequest('POST', '/api/ai/journal/batch', {
          entries
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Batch analysis failed');
        }

        const result = await response.json();
        
        addBreadcrumb('AI batch analysis completed', 'ai', {
          totalEntries: result.summary.totalEntries,
          averageEmotion: result.summary.averageEmotionScore
        });

        return result;

      } catch (error) {
        captureError(error as Error, {
          context: 'ai-batch-analysis',
          entriesCount: entries.length
        });
        throw error;
      } finally {
        performanceMonitor.endMark('ai-batch-analysis');
      }
    },
    onSuccess: (data) => {
      console.log('Batch AI analysis completed:', {
        entriesAnalyzed: data.summary.totalEntries,
        averageEmotion: data.summary.averageEmotionScore,
        totalWords: data.summary.totalWords
      });
    },
    onError: (error: Error) => {
      console.error('Batch AI analysis failed:', error.message);
    }
  });

  return {
    analyzeJournalEntry,
    analyzeBatchEntries,
    isAnalyzing: analyzeJournalEntry.isPending,
    isBatchAnalyzing: analyzeBatchEntries.isPending,
    analysisError: analyzeJournalEntry.error,
    batchError: analyzeBatchEntries.error
  };
};