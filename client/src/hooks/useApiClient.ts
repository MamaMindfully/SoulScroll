import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAppContext } from "@/context/AppContext";
import { addBreadcrumb, captureError } from "@/utils/sentry";
import { performanceMonitor } from "@/utils/performance";

interface CreateSubscriptionParams {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

interface JournalEntryParams {
  content: string;
  mood?: number;
  tags?: string[];
}

export const useApiClient = () => {
  const { state } = useAppContext();

  // Create subscription mutation
  const createSubscription = useMutation({
    mutationFn: async (params: CreateSubscriptionParams) => {
      performanceMonitor.startMark('create-subscription-api');
      addBreadcrumb('Creating subscription', 'api', { priceId: params.priceId });
      
      try {
        const response = await apiRequest("POST", "/api/create-subscription", params);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create subscription');
        }
        
        addBreadcrumb('Subscription created successfully', 'api', { sessionId: data.sessionId });
        return data;
      } catch (error) {
        captureError(error as Error, { context: 'create-subscription', params });
        throw error;
      } finally {
        performanceMonitor.endMark('create-subscription-api');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/premium-status'] });
    }
  });

  // User progress query
  const useUserProgress = (userId?: string) => {
    return useQuery({
      queryKey: ['/api/user', userId, 'progress'],
      queryFn: async () => {
        if (!userId) throw new Error('User ID required');
        
        performanceMonitor.startMark('fetch-user-progress');
        addBreadcrumb('Fetching user progress', 'api', { userId });
        
        try {
          const response = await apiRequest("GET", `/api/user/${userId}/progress`);
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch progress');
          }
          
          addBreadcrumb('User progress fetched', 'api', { 
            dataPoints: data.insights?.length || 0 
          });
          
          return data;
        } catch (error) {
          captureError(error as Error, { context: 'fetch-user-progress', userId });
          throw error;
        } finally {
          performanceMonitor.endMark('fetch-user-progress');
        }
      },
      enabled: !!userId && state.isLoggedIn,
      staleTime: 5 * 60 * 1000 // 5 minutes
    });
  };

  // Create journal entry mutation
  const createJournalEntry = useMutation({
    mutationFn: async (params: JournalEntryParams) => {
      performanceMonitor.startMark('create-journal-entry');
      addBreadcrumb('Creating journal entry', 'api', { 
        contentLength: params.content.length,
        mood: params.mood 
      });
      
      try {
        const response = await apiRequest("POST", "/api/journal", params);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to save journal entry');
        }
        
        addBreadcrumb('Journal entry created', 'api', { 
          entryId: data.entry?.id 
        });
        
        return data;
      } catch (error) {
        captureError(error as Error, { context: 'create-journal-entry', params });
        throw error;
      } finally {
        performanceMonitor.endMark('create-journal-entry');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/journal-entries'] });
    }
  });

  // Secret scrolls query
  const useSecretScrolls = () => {
    return useQuery({
      queryKey: ['/api/secret-scrolls'],
      queryFn: async () => {
        performanceMonitor.startMark('fetch-secret-scrolls');
        addBreadcrumb('Fetching secret scrolls', 'api');
        
        try {
          const response = await apiRequest("GET", "/api/secret-scrolls");
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch secret scrolls');
          }
          
          addBreadcrumb('Secret scrolls fetched', 'api', { 
            scrollCount: data.scrolls?.length || 0 
          });
          
          return data;
        } catch (error) {
          captureError(error as Error, { context: 'fetch-secret-scrolls' });
          throw error;
        } finally {
          performanceMonitor.endMark('fetch-secret-scrolls');
        }
      },
      enabled: state.isLoggedIn,
      staleTime: 10 * 60 * 1000 // 10 minutes
    });
  };

  // Emotions graph query
  const useEmotionsGraph = (period: string = '30', type: string = 'mood') => {
    return useQuery({
      queryKey: ['/api/emotions/graph', period, type],
      queryFn: async () => {
        performanceMonitor.startMark('fetch-emotions-graph');
        addBreadcrumb('Fetching emotions graph', 'api', { period, type });
        
        try {
          const response = await apiRequest(
            "GET", 
            `/api/emotions/graph?period=${period}&type=${type}`
          );
          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch emotion data');
          }
          
          addBreadcrumb('Emotions graph fetched', 'api', { 
            dataPoints: data.data?.length || 0 
          });
          
          return data;
        } catch (error) {
          captureError(error as Error, { context: 'fetch-emotions-graph', period, type });
          throw error;
        } finally {
          performanceMonitor.endMark('fetch-emotions-graph');
        }
      },
      enabled: state.isLoggedIn,
      staleTime: 2 * 60 * 1000 // 2 minutes
    });
  };

  return {
    createSubscription,
    useUserProgress,
    createJournalEntry,
    useSecretScrolls,
    useEmotionsGraph
  };
};