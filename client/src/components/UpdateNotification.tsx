import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

interface UpdateNotificationProps {
  onUpdate?: () => void;
  onDismiss?: () => void;
}

export default function UpdateNotification({ onUpdate, onDismiss }: UpdateNotificationProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Listen for service worker update events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
          setShowNotification(true);
        }
      });
    }
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Trigger service worker update
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
      
      onUpdate?.();
      
      // Reload will happen automatically via controllerchange event
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
    onDismiss?.();
  };

  if (!showNotification) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-start space-x-3">
        <RefreshCw className="h-5 w-5 text-blue-500 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Update Available
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            A new version of SoulScroll is ready. Update now for the latest features.
          </p>
          <div className="flex space-x-2 mt-3">
            <Button
              size="sm"
              onClick={handleUpdate}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Now'
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
              disabled={isUpdating}
            >
              Later
            </Button>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          disabled={isUpdating}
          className="p-1 h-6 w-6"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}