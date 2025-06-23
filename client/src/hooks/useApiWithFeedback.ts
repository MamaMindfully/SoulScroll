import { useState, useCallback } from 'react';
import { fetchWithAuth } from '@/utils/api';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  slowLoading: boolean;
}

interface UseApiWithFeedbackOptions {
  slowThreshold?: number; // ms to show slow loading indicator
  retries?: number;
  onError?: (error: Error) => void;
}

export function useApiWithFeedback<T>(
  endpoint: string,
  options: UseApiWithFeedbackOptions = {}
) {
  const { slowThreshold = 2000, retries = 1, onError } = options;
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    slowLoading: false
  });

  const execute = useCallback(async (requestOptions?: RequestInit) => {
    setState(prev => ({ ...prev, loading: true, error: null, slowLoading: false }));
    
    // Set slow loading indicator after threshold
    const slowTimer = setTimeout(() => {
      setState(prev => ({ ...prev, slowLoading: true }));
    }, slowThreshold);

    try {
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const data = await fetchWithAuth(endpoint, requestOptions);
          
          clearTimeout(slowTimer);
          setState({
            data,
            loading: false,
            error: null,
            slowLoading: false
          });
          
          return data;
        } catch (error) {
          lastError = error as Error;
          
          // Don't retry on authentication errors
          if (error instanceof Error && error.message.includes('401')) {
            break;
          }
          
          // Wait before retry
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
      }
      
      throw lastError;
    } catch (error) {
      clearTimeout(slowTimer);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      setState({
        data: null,
        loading: false,
        error: errorMessage,
        slowLoading: false
      });
      
      if (onError && error instanceof Error) {
        onError(error);
      }
      
      throw error;
    }
  }, [endpoint, slowThreshold, retries, onError]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      slowLoading: false
    });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}