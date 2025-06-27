import { useState, useCallback } from 'react';

interface ReflectionData {
  insight: string;
  followUpPrompt: string;
}

interface UseReflectionReturn {
  reflection: ReflectionData | null;
  isLoading: boolean;
  error: string | null;
  generateReflection: (entry: string) => Promise<void>;
  clearReflection: () => void;
}

export const useReflection = (): UseReflectionReturn => {
  const [reflection, setReflection] = useState<ReflectionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReflection = useCallback(async (entry: string) => {
    if (!entry.trim()) {
      setError('Journal entry is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to get AI reflections');
        }
        throw new Error(`Failed to generate reflection: ${response.statusText}`);
      }

      const data = await response.json();
      setReflection(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate reflection';
      setError(errorMessage);
      
      // Provide fallback reflection on error
      setReflection({
        insight: "Your willingness to reflect shows wisdom and self-awareness. Every moment of introspection is valuable for your growth.",
        followUpPrompt: "What emotion or thought from your entry feels most important to explore further?"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearReflection = useCallback(() => {
    setReflection(null);
    setError(null);
  }, []);

  return {
    reflection,
    isLoading,
    error,
    generateReflection,
    clearReflection
  };
};