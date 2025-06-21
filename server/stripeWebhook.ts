import { Router } from 'express';
import Stripe from 'stripe';
import { storage } from './storage';
import { logger } from './utils/logger';
import { db } from './db';
import { sql } from 'drizzle-orm';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event: Stripe.Event;

  try {
    if (!endpointSecret) {
      throw new Error('Stripe webhook secret not configured');
    }
    
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err: any) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
        
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planType = session.metadata?.planType;
  
  if (!userId) {
    logger.error('No userId in checkout session metadata');
    return;
  }

  logger.info(`Checkout completed for user ${userId}, plan: ${planType}`);
  
  // Update user premium status
  await updateUserPremiumStatus(userId, 'active', planType || 'monthly');
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    logger.error('No userId in subscription metadata');
    return;
  }

  logger.info(`Subscription created for user ${userId}: ${subscription.id}`);
  
  // Store subscription info
  await storage.createSubscription({
    userId,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer as string,
    status: subscription.status,
    planType: subscription.metadata?.planType || 'monthly',
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    logger.error('No userId in subscription metadata');
    return;
  }

  logger.info(`Subscription updated for user ${userId}: ${subscription.status}`);
  
  // Update subscription status
  await storage.updateSubscription(userId, {
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });
  
  await updateUserPremiumStatus(userId, subscription.status, subscription.metadata?.planType || 'monthly');
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    logger.error('No userId in subscription metadata');
    return;
  }

  logger.info(`Subscription deleted for user ${userId}`);
  
  await updateUserPremiumStatus(userId, 'canceled');
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscription = invoice.subscription as string;
  
  if (subscription) {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription);
    const userId = stripeSubscription.metadata?.userId;
    
    if (userId) {
      logger.info(`Payment succeeded for user ${userId}`);
      await updateUserPremiumStatus(userId, 'active', stripeSubscription.metadata?.planType || 'monthly');
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscription = invoice.subscription as string;
  
  if (subscription) {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription);
    const userId = stripeSubscription.metadata?.userId;
    
    if (userId) {
      logger.warn(`Payment failed for user ${userId}`);
      // Don't immediately revoke access on first failure
      // Stripe will retry payments automatically
    }
  }
}

async function updateUserPremiumStatus(userId: string, status: string, planType?: string) {
  try {
    // Update user premium status in users table
    await db.execute(sql`
      UPDATE users 
      SET premium_status = ${status === 'active' ? 'active' : 'inactive'},
          updated_at = NOW()
      WHERE id = ${userId}
    `);
    
    logger.info(`Updated premium status for user ${userId}: ${status}`);
  } catch (error) {
    logger.error(`Failed to update premium status for user ${userId}:`, error);
  }
}

export default router;