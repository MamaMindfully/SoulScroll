import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { useHasMounted } from "@/utils/useHasMounted";

const OfflineIndicator: React.FC = () => {
  const hasMounted = useHasMounted();
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!hasMounted) return;
    // Initialize online status
    setIsOnline(navigator.onLine);
    setShowOfflineBanner(!navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
      setLastSyncTime(new Date());
      // Trigger sync of offline data
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync time
    if (isOnline) {
      setLastSyncTime(new Date());
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  const syncOfflineData = async () => {
    try {
      // Get offline entries
      const offlineEntries = JSON.parse(localStorage.getItem('soulscroll-offline-entries') || '[]');
      
      if (offlineEntries.length > 0) {
        // Sync each entry
        for (const entry of offlineEntries) {
          try {
            await fetch('/api/journal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(entry)
            });
          } catch (error) {
            console.error('Failed to sync entry:', error);
          }
        }
        
        // Clear offline entries after successful sync
        localStorage.removeItem('soulscroll-offline-entries');
      }
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  };

  const retryConnection = () => {
    // Force a network check
    fetch('/api/health', { method: 'HEAD' })
      .then(() => {
        setIsOnline(true);
        setShowOfflineBanner(false);
      })
      .catch(() => {
        setIsOnline(false);
      });
  };

  if (!showOfflineBanner && isOnline) {
    return null;
  }

  return (
    <div className="fixed top-16 left-4 right-4 z-50">
      <Card className={`${
        isOnline 
          ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' 
          : 'border-orange-200 bg-gradient-to-r from-orange-50 to-red-50'
      }`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-orange-600" />
              )}
              <div>
                <div className={`text-sm font-medium ${
                  isOnline ? 'text-green-800' : 'text-orange-800'
                }`}>
                  {isOnline ? 'Back Online' : 'No Internet Connection'}
                </div>
                <div className={`text-xs ${
                  isOnline ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {isOnline 
                    ? lastSyncTime 
                      ? `Synced at ${lastSyncTime.toLocaleTimeString()}`
                      : 'Data synced'
                    : 'Your entries are saved locally'
                  }
                </div>
              </div>
            </div>
            
            {!isOnline && (
              <Button
                onClick={retryConnection}
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
            
            {isOnline && (
              <Button
                onClick={() => setShowOfflineBanner(false)}
                variant="ghost"
                size="sm"
                className="text-green-700 hover:bg-green-100"
              >
                ✕
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineIndicator;