import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { realtimeServer } from "../realtime/socketServer";
import bodyParser from "body-parser";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Stripe requires raw body for signature verification
router.post('/webhook/stripe', bodyParser.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    logger.error('Webhook signature verification failed:', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const data = event.data.object as any;
    let metadata: any = {};
    
    // Get customer metadata to find userId
    if (data.customer) {
      const customer = await stripe.customers.retrieve(data.customer);
      metadata = customer.metadata;
    }

    const userId = metadata?.userId || null;

    logger.info('Processing Stripe webhook', { 
      eventType: event.type, 
      userId,
      customerId: data.customer 
    });

    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        if (userId) {
          await updateSubscriptionStatusInDB(userId, 'active');
          
          // Send real-time notification
          if (realtimeServer) {
            realtimeServer.sendAnnouncement(
              `🎉 Premium features unlocked! Welcome to the full Luma experience!`
            );
          }

          // Create welcome Secret Scroll for new premium users
          await storage.createSecretScroll(userId, {
            title: 'Premium Gateway',
            content: 'You have crossed the threshold into deeper wisdom. Your premium journey begins now, with infinite possibilities for growth and discovery.',
            type: 'premium_welcome',
            unlocked: true
          });

          logger.info('Subscription activated successfully', { userId });
        }
        break;

      case 'customer.subscription.deleted':
        if (userId) {
          await updateSubscriptionStatusInDB(userId, 'canceled');
          logger.info('Subscription canceled', { userId });
        }
        break;

      case 'invoice.payment_succeeded':
        if (userId) {
          await updateSubscriptionStatusInDB(userId, 'active');
          logger.info('Payment succeeded, subscription active', { userId });
        }
        break;

      case 'invoice.payment_failed':
        if (userId) {
          await updateSubscriptionStatusInDB(userId, 'paused');
          logger.info('Payment failed, subscription paused', { userId });
        }
        break;

      case 'customer.subscription.trial_will_end':
        if (userId) {
          // Send trial ending notification
          if (realtimeServer) {
            realtimeServer.sendAnnouncement(
              `⏰ Your free trial ends soon. Continue your mindful journey with Premium!`
            );
          }
          logger.info('Trial ending notification sent', { userId });
        }
        break;

      default:
        logger.info('Unhandled webhook event type', { eventType: event.type });
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    logger.error('Webhook handling failed:', { error: err.message, eventType: event.type });
    res.status(500).send('Internal error');
  }
});

// Helper function to update subscription status in database
async function updateSubscriptionStatusInDB(userId: string, status: 'active' | 'canceled' | 'paused') {
  try {
    // Try to find user by email first (in case userId is email)
    let user = await storage.getUserByEmail(userId);
    
    // If not found by email, try by ID
    if (!user) {
      user = await storage.getUser(userId);
    }
    
    if (!user) {
      logger.warn('User not found for subscription update', { userId });
      return;
    }

    // Update subscription status
    const subscriptionData = {
      status: status as any,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };

    try {
      await storage.updateSubscription(user.id, subscriptionData);
    } catch (updateError) {
      // If no subscription exists, create one
      await storage.createSubscription({
        userId: user.id,
        stripeCustomerId: '',
        stripeSubscriptionId: '',
        planType: 'monthly',
        ...subscriptionData
      });
    }

    logger.info('Subscription status updated in database', { 
      userId: user.id, 
      status 
    });

  } catch (error: any) {
    logger.error('Failed to update subscription status in DB', { 
      userId, 
      status, 
      error: error.message 
    });
    throw error;
  }
}

export default router;