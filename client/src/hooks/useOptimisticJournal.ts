import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { addBreadcrumb } from '@/utils/sentry';

interface OptimisticEntry {
  id: string;
  content: string;
  wordCount: number;
  createdAt: Date;
  status: 'pending' | 'synced' | 'error';
  localId: string;
}

interface LoadingStates {
  reflecting: boolean;
  scoringEmotion: boolean;
  arcReviewing: boolean;
  updatingProgress: boolean;
  checkingRewards: boolean;
}

export const useOptimisticJournal = () => {
  const queryClient = useQueryClient();
  const [optimisticEntries, setOptimisticEntries] = useState<OptimisticEntry[]>([]);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    reflecting: false,
    scoringEmotion: false,
    arcReviewing: false,
    updatingProgress: false,
    checkingRewards: false
  });

  // Create journal entry with optimistic updates
  const createEntry = useMutation({
    mutationFn: async ({ content, wordCount }: { content: string; wordCount: number }) => {
      const response = await apiRequest('POST', '/api/journal', {
        content,
        wordCount,
        mood: 5, // Default mood
        tags: []
      });

      if (!response.ok) {
        throw new Error('Failed to create journal entry');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update optimistic entry with real data
      setOptimisticEntries(prev => 
        prev.map(entry => 
          entry.content === variables.content 
            ? { ...entry, id: data.id, status: 'synced' as const }
            : entry
        )
      );

      // Invalidate and refetch journal entries
      queryClient.invalidateQueries({ queryKey: ['/api/journal/entries'] });
      
      addBreadcrumb('Journal entry synced', 'journal', { entryId: data.id });
    },
    onError: (error, variables) => {
      // Mark optimistic entry as error
      setOptimisticEntries(prev => 
        prev.map(entry => 
          entry.content === variables.content 
            ? { ...entry, status: 'error' as const }
            : entry
        )
      );
      
      console.error('Failed to sync journal entry:', error);
    }
  });

  // Handle journal submission with optimistic UI
  const handleJournalSubmit = useCallback(async (entryText: string) => {
    const localId = `temp_${Date.now()}`;
    const wordCount = entryText.split(/\s+/).filter(word => word.length > 0).length;

    // 1. Immediate optimistic update
    const optimisticEntry: OptimisticEntry = {
      id: localId,
      content: entryText,
      wordCount,
      createdAt: new Date(),
      status: 'pending',
      localId
    };

    setOptimisticEntries(prev => [optimisticEntry, ...prev]);

    // 2. Show progressive loading states
    setLoadingStates({
      reflecting: true,
      scoringEmotion: false,
      arcReviewing: false,
      updatingProgress: false,
      checkingRewards: false
    });

    try {
      // 3. Submit to backend (non-blocking for UI)
      const journalEntry = await createEntry.mutateAsync({ content: entryText, wordCount });

      // 4. Trigger background processing with progressive updates
      await triggerBackgroundProcessing(entryText, journalEntry.id);

    } catch (error) {
      console.error('Journal submission failed:', error);
      
      // Reset loading states on error
      setLoadingStates({
        reflecting: false,
        scoringEmotion: false,
        arcReviewing: false,
        updatingProgress: false,
        checkingRewards: false
      });
    }
  }, [createEntry]);

  // Trigger background processing with loading state updates
  const triggerBackgroundProcessing = async (entryText: string, entryId: string) => {
    try {
      // Step 1: Emotion scoring
      setLoadingStates(prev => ({ ...prev, reflecting: false, scoringEmotion: true }));
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time

      // Step 2: Arc reviewing
      setLoadingStates(prev => ({ ...prev, scoringEmotion: false, arcReviewing: true }));
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Progress updates
      setLoadingStates(prev => ({ ...prev, arcReviewing: false, updatingProgress: true }));
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Reward checking
      setLoadingStates(prev => ({ ...prev, updatingProgress: false, checkingRewards: true }));
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Submit to unified queue for actual processing (simplified endpoint)
      await apiRequest('POST', '/api/journal', {
        entryText
      });

      // Complete loading
      setLoadingStates({
        reflecting: false,
        scoringEmotion: false,
        arcReviewing: false,
        updatingProgress: false,
        checkingRewards: false
      });

      addBreadcrumb('Background processing completed', 'journal', { entryId });

    } catch (error) {
      console.error('Background processing failed:', error);
      
      // Reset all loading states
      setLoadingStates({
        reflecting: false,
        scoringEmotion: false,
        arcReviewing: false,
        updatingProgress: false,
        checkingRewards: false
      });
    }
  };

  // Get loading message based on current state
  const getLoadingMessage = () => {
    if (loadingStates.reflecting) return "Reflecting on your thoughts...";
    if (loadingStates.scoringEmotion) return "Scoring emotional resonance...";
    if (loadingStates.arcReviewing) return "Arc is reviewing your entry...";
    if (loadingStates.updatingProgress) return "Updating your progress...";
    if (loadingStates.checkingRewards) return "Checking for new rewards...";
    return null;
  };

  // Check if any processing is active
  const isProcessing = Object.values(loadingStates).some(state => state);

  // Retry failed entries
  const retryEntry = useCallback((localId: string) => {
    const entry = optimisticEntries.find(e => e.localId === localId);
    if (entry && entry.status === 'error') {
      handleJournalSubmit(entry.content);
    }
  }, [optimisticEntries, handleJournalSubmit]);

  // Remove optimistic entry
  const removeOptimisticEntry = useCallback((localId: string) => {
    setOptimisticEntries(prev => prev.filter(e => e.localId !== localId));
  }, []);

  return {
    optimisticEntries,
    loadingStates,
    isProcessing,
    loadingMessage: getLoadingMessage(),
    handleJournalSubmit,
    retryEntry,
    removeOptimisticEntry,
    isSubmitting: createEntry.isPending
  };
};