import webpush from 'web-push';
import { db } from '../db';
import { pushSubscriptions } from '../../shared/schema';
import { eq, and, gte } from 'drizzle-orm';
import { logger } from '../utils/logger';
import cron from 'node-cron';

// VAPID Keys - Generate once and store securely
// const vapidKeys = webpush.generateVAPIDKeys();
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  logger.warn('VAPID keys not configured - push notifications will be disabled');
} else {
  webpush.setVapidDetails(
    'mailto:support@soulscroll.ai',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  tag?: string;
  data?: any;
}

class WebPushService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
    
    if (this.isConfigured) {
      this.initializeScheduledReminders();
      logger.info('Web Push Service initialized with VAPID keys');
    } else {
      logger.warn('Web Push Service disabled - missing VAPID configuration');
    }
  }

  // Save user subscription to database
  async saveSubscription(userId: string, subscription: any, preferences?: any): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Web push not configured');
    }

    try {
      await db.insert(pushSubscriptions).values({
        userId,
        endpoint: subscription.endpoint,
        p256dhKey: subscription.keys.p256dh,
        authKey: subscription.keys.auth,
        reminderTime: preferences?.time || '19:00',
        frequency: preferences?.frequency || 'daily',
        enabled: true
      }).onConflictDoUpdate({
        target: pushSubscriptions.userId,
        set: {
          endpoint: subscription.endpoint,
          p256dhKey: subscription.keys.p256dh,
          authKey: subscription.keys.auth,
          reminderTime: preferences?.time || '19:00',
          frequency: preferences?.frequency || 'daily',
          enabled: true,
          updatedAt: new Date()
        }
      });

      logger.info('Push subscription saved', { userId, endpoint: subscription.endpoint });
    } catch (error) {
      logger.error('Failed to save push subscription', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  // Remove user subscription
  async removeSubscription(userId: string): Promise<void> {
    try {
      await db.update(pushSubscriptions)
        .set({ enabled: false, updatedAt: new Date() })
        .where(eq(pushSubscriptions.userId, userId));

      logger.info('Push subscription disabled', { userId });
    } catch (error) {
      logger.error('Failed to remove push subscription', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  // Send push notification to specific user
  async sendToUser(userId: string, payload: NotificationPayload): Promise<boolean> {
    if (!this.isConfigured) {
      logger.warn('Cannot send push notification - service not configured');
      return false;
    }

    try {
      const subscriptions = await db
        .select()
        .from(pushSubscriptions)
        .where(and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.enabled, true)
        ));

      if (subscriptions.length === 0) {
        logger.debug('No active push subscriptions found for user', { userId });
        return false;
      }

      const results = await Promise.allSettled(
        subscriptions.map(sub => this.sendNotification(sub, payload))
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.length - successful;

      if (failed > 0) {
        logger.warn('Some push notifications failed', { 
          userId, 
          successful, 
          failed 
        });
      }

      return successful > 0;
    } catch (error) {
      logger.error('Failed to send push notification to user', { 
        userId, 
        error: error.message 
      });
      return false;
    }
  }

  // Send notification to subscription
  private async sendNotification(subscription: any, payload: NotificationPayload): Promise<void> {
    const webPushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dhKey,
        auth: subscription.authKey
      }
    };

    const notificationData = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-96x96.png',
      image: payload.image,
      url: payload.url || '/',
      actions: payload.actions || [
        {
          action: 'open',
          title: 'Open SoulScroll',
          icon: '/icons/icon-96x96.png'
        },
        {
          action: 'snooze',
          title: 'Remind me later',
          icon: '/icons/icon-96x96.png'
        }
      ],
      requireInteraction: payload.requireInteraction || false,
      tag: payload.tag || 'journal-reminder',
      data: {
        url: payload.url || '/',
        timestamp: Date.now(),
        ...payload.data
      }
    };

    try {
      await webpush.sendNotification(
        webPushSubscription,
        JSON.stringify(notificationData),
        {
          TTL: 86400, // 24 hours
          urgency: 'normal'
        }
      );

      logger.debug('Push notification sent successfully', { 
        endpoint: subscription.endpoint,
        title: payload.title
      });
    } catch (error) {
      // Handle subscription errors (expired, invalid, etc.)
      if (error.statusCode === 410 || error.statusCode === 404) {
        logger.info('Push subscription expired, removing from database', { 
          endpoint: subscription.endpoint 
        });
        
        await db.update(pushSubscriptions)
          .set({ enabled: false, updatedAt: new Date() })
          .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
      } else {
        logger.error('Failed to send push notification', { 
          endpoint: subscription.endpoint,
          statusCode: error.statusCode,
          error: error.message 
        });
      }
      throw error;
    }
  }

  // Send daily reminder notifications
  async sendDailyReminders(): Promise<void> {
    if (!this.isConfigured) {
      logger.debug('Skipping daily reminders - web push not configured');
      return;
    }

    const timer = logger.withTimer('daily-reminders');
    
    try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

      // Get subscriptions that should receive reminders at this time
      const subscriptions = await db
        .select()
        .from(pushSubscriptions)
        .where(and(
          eq(pushSubscriptions.enabled, true),
          eq(pushSubscriptions.reminderTime, currentTime)
        ));

      const eligibleSubscriptions = subscriptions.filter(sub => {
        switch (sub.frequency) {
          case 'daily':
            return true;
          case 'weekdays':
            return currentDay >= 1 && currentDay <= 5;
          case 'weekends':
            return currentDay === 0 || currentDay === 6;
          default:
            return true;
        }
      });

      if (eligibleSubscriptions.length === 0) {
        logger.debug('No eligible subscriptions for daily reminders', { 
          currentTime,
          currentDay,
          totalSubscriptions: subscriptions.length
        });
        return;
      }

      const reminderMessages = [
        "Time for a peaceful moment of reflection",
        "Your thoughts are waiting to be captured",
        "Take a moment to check in with yourself",
        "Keep your streak alive with today's entry",
        "Another opportunity to grow and reflect"
      ];

      const message = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];

      const payload: NotificationPayload = {
        title: "SoulScroll Reminder",
        body: message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        url: '/journal',
        tag: 'daily-reminder',
        actions: [
          {
            action: 'write',
            title: 'Write Entry',
            icon: '/icons/icon-96x96.png'
          },
          {
            action: 'snooze',
            title: 'Remind me in 1 hour',
            icon: '/icons/icon-96x96.png'
          }
        ],
        data: {
          type: 'daily_reminder',
          scheduledTime: currentTime
        }
      };

      const results = await Promise.allSettled(
        eligibleSubscriptions.map(sub => this.sendNotification(sub, payload))
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.length - successful;

      logger.info('Daily reminders sent', {
        totalEligible: eligibleSubscriptions.length,
        successful,
        failed,
        currentTime,
        duration: timer.end()
      });

    } catch (error) {
      timer.end({ error: error.message });
      logger.error('Failed to send daily reminders', { error: error.message });
    }
  }

  // Send streak reminder for users approaching milestone
  async sendStreakReminders(): Promise<void> {
    if (!this.isConfigured) return;

    try {
      // Logic to find users with streaks at risk or approaching milestones
      // This would integrate with your streak tracking system
      logger.debug('Streak reminders feature placeholder');
    } catch (error) {
      logger.error('Failed to send streak reminders', { error: error.message });
    }
  }

  // Initialize scheduled reminder system
  private initializeScheduledReminders(): void {
    // Run every hour to check for reminder times
    cron.schedule('0 * * * *', async () => {
      await this.sendDailyReminders();
    }, {
      timezone: 'UTC'
    });

    // Run streak reminders every 4 hours
    cron.schedule('0 */4 * * *', async () => {
      await this.sendStreakReminders();
    }, {
      timezone: 'UTC'
    });

    logger.info('Scheduled push notification reminders initialized');
  }

  // Get service status
  getStatus(): { configured: boolean, vapidPublicKey?: string } {
    return {
      configured: this.isConfigured,
      vapidPublicKey: this.isConfigured ? VAPID_PUBLIC_KEY : undefined
    };
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    try {
      if (!this.isConfigured) {
        return { status: 'disabled' };
      }

      // Test database connectivity for subscriptions
      await db.select().from(pushSubscriptions).limit(1);
      
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }
}

export const webPushService = new WebPushService();