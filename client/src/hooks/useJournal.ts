import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

interface JournalEntry {
  id: number;
  content: string;
  wordCount: number;
  emotionalTone?: {
    rating: number;
    confidence: number;
    keywords: string[];
    insights: string;
  };
  aiResponse?: string;
  isVoiceEntry: boolean;
  voiceTranscription?: string;
  promptId?: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateEntryData {
  content: string;
  promptId?: number;
  isVoiceEntry?: boolean;
  voiceTranscription?: string;
}

interface UpdateEntryData {
  content?: string;
  emotionalTone?: any;
  aiResponse?: string;
}

export function useJournal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch journal entries
  const {
    data: entries,
    isLoading: entriesLoading,
    error: entriesError,
  } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal/entries"],
    retry: false,
  });

  // Handle unauthorized errors
  if (entriesError && isUnauthorizedError(entriesError as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
  }

  // Create new journal entry
  const createEntryMutation = useMutation({
    mutationFn: async (entryData: CreateEntryData) => {
      const response = await apiRequest("POST", "/api/journal/entries", entryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/insights/emotional"] });
      
      toast({
        title: "Entry saved",
        description: "Your thoughts have been captured with care.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Save failed",
        description: "We couldn't save your entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update existing journal entry
  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateEntryData }) => {
      const response = await apiRequest("PUT", `/api/journal/entries/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal/entries"] });
      
      toast({
        title: "Entry updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Update failed",
        description: "We couldn't update your entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete journal entry
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/journal/entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      
      toast({
        title: "Entry deleted",
        description: "Your journal entry has been removed.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Delete failed",
        description: "We couldn't delete your entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get today's entries
  const todayEntries = entries?.filter(entry => {
    const entryDate = new Date(entry.createdAt);
    const today = new Date();
    return entryDate.toDateString() === today.toDateString();
  }) || [];

  // Get recent entries (last 7 days)
  const recentEntries = entries?.filter(entry => {
    const entryDate = new Date(entry.createdAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate >= weekAgo;
  }) || [];

  // Calculate writing streak
  const calculateStreak = () => {
    if (!entries || entries.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) { // Check up to a year
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const hasEntryOnDate = entries.some(entry => {
        const entryDate = new Date(entry.createdAt);
        return entryDate.toDateString() === checkDate.toDateString();
      });
      
      if (hasEntryOnDate) {
        streak++;
      } else if (i === 0) {
        // If no entry today, check yesterday to start streak calculation
        continue;
      } else {
        break;
      }
    }
    
    return streak;
  };

  return {
    // Data
    entries: entries || [],
    todayEntries,
    recentEntries,
    isLoading: entriesLoading,
    error: entriesError,
    
    // Stats
    totalEntries: entries?.length || 0,
    writingStreak: calculateStreak(),
    
    // Mutations
    createEntry: createEntryMutation.mutate,
    updateEntry: updateEntryMutation.mutate,
    deleteEntry: deleteEntryMutation.mutate,
    
    // Loading states
    isCreating: createEntryMutation.isPending,
    isUpdating: updateEntryMutation.isPending,
    isDeleting: deleteEntryMutation.isPending,
  };
}
