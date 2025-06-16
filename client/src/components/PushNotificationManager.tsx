import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, Clock, Heart, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  reminderTime: string;
  weeklyInsights: boolean;
  encouragement: boolean;
}

export default function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    dailyReminder: true,
    reminderTime: '19:00',
    weeklyInsights: true,
    encouragement: true
  });
  const { toast } = useToast();

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Load saved settings
    const savedSettings = localStorage.getItem('luma_notification_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Not supported",
        description: "Push notifications aren't supported on this device.",
        variant: "destructive"
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        const newSettings = { ...settings, enabled: true };
        setSettings(newSettings);
        localStorage.setItem('luma_notification_settings', JSON.stringify(newSettings));
        
        // Subscribe to push notifications
        await subscribeToPushNotifications();
        
        toast({
          title: "Notifications enabled",
          description: "You'll receive gentle reminders and insights from Luma.",
        });
      } else {
        toast({
          title: "Notifications disabled",
          description: "You can enable them anytime in your browser settings.",
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Permission error",
        description: "There was an issue requesting notification permission.",
        variant: "destructive"
      });
    }
  };

  const subscribeToPushNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // In a real app, you'd get this from your server
      const vapidPublicKey = 'your-vapid-public-key';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('luma_notification_settings', JSON.stringify(newSettings));
  };

  const sendTestNotification = () => {
    if (permission === 'granted') {
      new Notification('Luma', {
        body: 'This is how your daily reflection reminders will look!',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png'
      });
    }
  };

  const scheduleNotification = (message: string, delay: number) => {
    setTimeout(() => {
      if (permission === 'granted') {
        new Notification('Luma', {
          body: message,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png'
        });
      }
    }, delay);
  };

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="p-5 text-center">
          <Bell className="w-8 h-8 text-wisdom/40 mx-auto mb-3" />
          <h3 className="font-medium text-wisdom mb-2">Notifications not supported</h3>
          <p className="text-sm text-wisdom/70">
            Your browser doesn't support push notifications.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-medium text-wisdom">Push Notifications</h3>
              <p className="text-sm text-wisdom/70">
                Gentle reminders for your journaling practice
              </p>
            </div>
          </div>
          {permission === 'granted' && (
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => updateSetting('enabled', checked)}
            />
          )}
        </div>

        {permission === 'default' && (
          <div className="mb-4">
            <Button onClick={requestPermission} className="w-full">
              Enable Notifications
            </Button>
          </div>
        )}

        {permission === 'denied' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-orange-700">
              Notifications are blocked. You can enable them in your browser settings.
            </p>
          </div>
        )}

        {permission === 'granted' && settings.enabled && (
          <div className="space-y-4">
            {/* Daily Reminder */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-wisdom/60" />
                <div>
                  <div className="text-sm font-medium text-wisdom">Daily Writing Reminder</div>
                  <div className="text-xs text-wisdom/70">Gentle nudge to reflect each day</div>
                </div>
              </div>
              <Switch
                checked={settings.dailyReminder}
                onCheckedChange={(checked) => updateSetting('dailyReminder', checked)}
              />
            </div>

            {settings.dailyReminder && (
              <div className="ml-7 mb-4">
                <label className="text-xs text-wisdom/70 block mb-1">Reminder time</label>
                <input
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => updateSetting('reminderTime', e.target.value)}
                  className="text-sm border border-gentle rounded px-2 py-1"
                />
              </div>
            )}

            {/* Weekly Insights */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-4 h-4 text-wisdom/60" />
                <div>
                  <div className="text-sm font-medium text-wisdom">Weekly Insights</div>
                  <div className="text-xs text-wisdom/70">Summary of your emotional patterns</div>
                </div>
              </div>
              <Switch
                checked={settings.weeklyInsights}
                onCheckedChange={(checked) => updateSetting('weeklyInsights', checked)}
              />
            </div>

            {/* Encouragement */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Heart className="w-4 h-4 text-wisdom/60" />
                <div>
                  <div className="text-sm font-medium text-wisdom">Encouraging Messages</div>
                  <div className="text-xs text-wisdom/70">Motivational support from Luma</div>
                </div>
              </div>
              <Switch
                checked={settings.encouragement}
                onCheckedChange={(checked) => updateSetting('encouragement', checked)}
              />
            </div>

            <div className="pt-3 border-t border-gentle">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={sendTestNotification}
                className="w-full"
              >
                Send Test Notification
              </Button>
            </div>
          </div>
        )}

        {/* Sample notification messages for demonstration */}
        <div className="mt-4 text-xs text-wisdom/60">
          <p className="mb-1">Sample notifications:</p>
          <ul className="space-y-1 pl-3">
            <li>• "Time for your evening reflection 🌙"</li>
            <li>• "You wrote about growth yesterday. Want to continue?"</li>
            <li>• "Your 7-day streak is amazing! Keep going ✨"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}