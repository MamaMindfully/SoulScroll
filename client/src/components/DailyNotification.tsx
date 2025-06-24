import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, BellOff, Clock, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettings {
  enabled: boolean;
  time: string;
  frequency: 'daily' | 'weekdays' | 'custom';
  customDays: number[];
  reminderType: 'gentle' | 'motivational' | 'streak';
}

const REMINDER_MESSAGES = {
  gentle: [
    "Time for a peaceful moment of reflection 🌸",
    "Your thoughts are waiting to be captured ✨",
    "Take a moment to check in with yourself 💝"
  ],
  motivational: [
    "Keep your streak alive! Time to journal 🔥",
    "Your future self will thank you for this entry 💪",
    "Another day, another opportunity to grow 🚀"
  ],
  streak: [
    "Don't break the chain! Journal today 📝",
    "Your {streak}-day streak is counting on you! ⚡",
    "Consistency is key - time for today's entry 🎯"
  ]
};

const DailyNotification: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    time: '19:00',
    frequency: 'daily',
    customDays: [1, 2, 3, 4, 5], // Monday to Friday
    reminderType: 'gentle'
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setNotificationPermission(Notification.permission);
      loadSettings();
    }
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    scheduleNotifications(newSettings);
  };

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Notifications are not supported in this browser",
        variant: "destructive"
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive daily journaling reminders"
        });
        
        // Enable notifications by default when permission is granted
        const newSettings = { ...settings, enabled: true };
        saveSettings(newSettings);
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive"
      });
    }
  };

  const scheduleNotifications = (notificationSettings: NotificationSettings) => {
    // Clear existing timeouts
    const existingTimeouts = JSON.parse(localStorage.getItem('notificationTimeouts') || '[]');
    existingTimeouts.forEach((timeoutId: number) => clearTimeout(timeoutId));
    
    if (!notificationSettings.enabled || notificationPermission !== 'granted') {
      localStorage.setItem('notificationTimeouts', '[]');
      return;
    }

    const timeouts: number[] = [];
    const [hours, minutes] = notificationSettings.time.split(':').map(Number);
    
    // Calculate next notification time
    const now = new Date();
    const nextNotification = new Date();
    nextNotification.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (nextNotification <= now) {
      nextNotification.setDate(nextNotification.getDate() + 1);
    }
    
    // Schedule notifications based on frequency
    const scheduleNext = (date: Date) => {
      const shouldNotify = shouldSendNotification(date, notificationSettings);
      
      if (shouldNotify) {
        const delay = date.getTime() - Date.now();
        
        if (delay > 0) {
          const timeoutId = window.setTimeout(() => {
            sendNotification(notificationSettings.reminderType);
            // Schedule next day
            const tomorrow = new Date(date);
            tomorrow.setDate(tomorrow.getDate() + 1);
            scheduleNext(tomorrow);
          }, delay);
          
          timeouts.push(timeoutId);
        }
      } else {
        // Check next day
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);
        scheduleNext(tomorrow);
      }
    };
    
    scheduleNext(nextNotification);
    localStorage.setItem('notificationTimeouts', JSON.stringify(timeouts));
  };

  const shouldSendNotification = (date: Date, settings: NotificationSettings): boolean => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    switch (settings.frequency) {
      case 'daily':
        return true;
      case 'weekdays':
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case 'custom':
        return settings.customDays.includes(dayOfWeek);
      default:
        return true;
    }
  };

  const sendNotification = (reminderType: string) => {
    if (notificationPermission !== 'granted') return;
    
    const messages = REMINDER_MESSAGES[reminderType] || REMINDER_MESSAGES.gentle;
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    // Get current streak for streak messages
    const streak = localStorage.getItem('journalStreak') || '0';
    const body = message.replace('{streak}', streak);
    
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Use service worker for push notifications
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        data: {
          title: 'SoulScroll Reminder',
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
          url: '/journal',
          requireInteraction: false,
          tag: 'daily-reminder'
        }
      });
    } else {
      // Fallback to regular notification
      new Notification('SoulScroll Reminder', {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        tag: 'daily-reminder'
      });
    }
  };

  const testNotification = () => {
    sendNotification(settings.reminderType);
    toast({
      title: "Test Sent",
      description: "Check your notifications!"
    });
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5" />
            Notifications Not Supported
          </CardTitle>
          <CardDescription>
            Your browser doesn't support push notifications
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Daily Journal Reminders
        </CardTitle>
        <CardDescription>
          Get gentle reminders to maintain your journaling habit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {notificationPermission === 'default' && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Enable Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Allow notifications to receive daily journaling reminders
                </p>
              </div>
              <Button onClick={requestPermission} size="sm">
                Enable
              </Button>
            </div>
          </div>
        )}

        {notificationPermission === 'denied' && (
          <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              Notifications are blocked. Please enable them in your browser settings to receive reminders.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications-enabled">Daily Reminders</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications to maintain your journaling streak
            </p>
          </div>
          <Switch
            id="notifications-enabled"
            checked={settings.enabled}
            onCheckedChange={(enabled) => {
              if (enabled && notificationPermission !== 'granted') {
                requestPermission();
              } else {
                saveSettings({ ...settings, enabled });
              }
            }}
            disabled={notificationPermission !== 'granted'}
          />
        </div>

        {settings.enabled && notificationPermission === 'granted' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="reminder-time">Reminder Time</Label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <input
                  id="reminder-time"
                  type="time"
                  value={settings.time}
                  onChange={(e) => saveSettings({ ...settings, time: e.target.value })}
                  className="px-3 py-2 border rounded-md bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={settings.frequency}
                onValueChange={(frequency: any) => saveSettings({ ...settings, frequency })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Every day</SelectItem>
                  <SelectItem value="weekdays">Weekdays only</SelectItem>
                  <SelectItem value="custom">Custom days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.frequency === 'custom' && (
              <div className="space-y-2">
                <Label>Custom Days</Label>
                <div className="flex gap-2">
                  {dayNames.map((day, index) => (
                    <Button
                      key={index}
                      variant={settings.customDays.includes(index) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const newDays = settings.customDays.includes(index)
                          ? settings.customDays.filter(d => d !== index)
                          : [...settings.customDays, index];
                        saveSettings({ ...settings, customDays: newDays });
                      }}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Reminder Style</Label>
              <Select
                value={settings.reminderType}
                onValueChange={(reminderType: any) => saveSettings({ ...settings, reminderType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gentle">Gentle & Peaceful</SelectItem>
                  <SelectItem value="motivational">Motivational</SelectItem>
                  <SelectItem value="streak">Streak Focused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={testNotification} variant="outline" className="w-full">
              Test Notification
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyNotification;