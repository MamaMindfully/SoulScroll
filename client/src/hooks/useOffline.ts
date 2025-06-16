import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface OfflineEntry {
  id: string;
  content: string;
  timestamp: string;
  synced: boolean;
}

const OFFLINE_STORAGE_KEY = "luma_offline_entries";

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineEntries, setOfflineEntries] = useState<OfflineEntry[]>([]);
  const { toast } = useToast();

  // Load offline entries from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
    if (stored) {
      try {
        const entries = JSON.parse(stored);
        setOfflineEntries(entries);
      } catch (error) {
        console.error("Failed to parse offline entries:", error);
      }
    }
  }, []);

  // Save offline entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(offlineEntries));
  }, [offlineEntries]);

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back online",
        description: "Your offline entries will be synchronized.",
      });
      syncOfflineEntries();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline mode",
        description: "Your entries will be saved locally and synced when you're back online.",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  // Save entry offline
  const saveOfflineEntry = (content: string) => {
    const entry: OfflineEntry = {
      id: `offline_${Date.now()}`,
      content,
      timestamp: new Date().toISOString(),
      synced: false,
    };

    setOfflineEntries(prev => [...prev, entry]);

    toast({
      title: "Saved offline",
      description: "Your entry has been saved locally and will sync when you're back online.",
    });

    return entry;
  };

  // Sync offline entries when back online
  const syncOfflineEntries = async () => {
    const unsyncedEntries = offlineEntries.filter(entry => !entry.synced);
    
    if (unsyncedEntries.length === 0) return;

    try {
      for (const entry of unsyncedEntries) {
        const response = await fetch("/api/journal/entries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: entry.content,
            // Include timestamp from offline entry
            createdAt: entry.timestamp,
          }),
          credentials: "include",
        });

        if (response.ok) {
          // Mark as synced
          setOfflineEntries(prev => 
            prev.map(e => 
              e.id === entry.id 
                ? { ...e, synced: true }
                : e
            )
          );
        }
      }

      // Remove synced entries after successful sync
      setOfflineEntries(prev => prev.filter(entry => !entry.synced));

      if (unsyncedEntries.length > 0) {
        toast({
          title: "Entries synchronized",
          description: `${unsyncedEntries.length} offline entries have been synced to the cloud.`,
        });
      }
    } catch (error) {
      console.error("Failed to sync offline entries:", error);
      toast({
        title: "Sync failed",
        description: "Some offline entries couldn't be synchronized. They'll be retried next time you're online.",
        variant: "destructive",
      });
    }
  };

  // Clear all offline entries
  const clearOfflineEntries = () => {
    setOfflineEntries([]);
    localStorage.removeItem(OFFLINE_STORAGE_KEY);
  };

  // Get unsynced entries count
  const unsyncedCount = offlineEntries.filter(entry => !entry.synced).length;

  return {
    isOnline,
    offlineEntries,
    unsyncedCount,
    saveOfflineEntry,
    syncOfflineEntries,
    clearOfflineEntries,
  };
}
