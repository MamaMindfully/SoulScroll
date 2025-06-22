import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { isAuthenticated } from "../replitAuth";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { z } from "zod";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Validation schema
const billingPortalSchema = z.object({
  stripeCustomerId: z.string().optional()
});

// POST /api/billing-portal
router.post('/api/billing-portal', isAuthenticated, async (req: Request, res: Response) => {
  try {
    let { stripeCustomerId } = billingPortalSchema.parse(req.body);
    const user = req.user;

    logger.info('Creating billing portal session', { 
      userId: user.id, 
      providedCustomerId: !!stripeCustomerId 
    });

    // If no customer ID provided, get it from user's subscription
    if (!stripeCustomerId) {
      const subscription = await storage.getUserSubscription(user.id);
      if (subscription?.stripeCustomerId) {
        stripeCustomerId = subscription.stripeCustomerId;
      } else {
        // Create a customer if none exists
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id }
        });
        stripeCustomerId = customer.id;

        // Save customer ID to subscription
        try {
          await storage.updateSubscription(user.id, {
            stripeCustomerId: customer.id
          });
        } catch (error) {
          // Create subscription record if it doesn't exist
          await storage.createSubscription({
            userId: user.id,
            stripeCustomerId: customer.id,
            stripeSubscriptionId: '',
            status: 'free',
            planType: 'monthly',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date()
          });
        }

        logger.info('Created new Stripe customer', { 
          userId: user.id, 
          customerId: customer.id 
        });
      }
    }

    if (!stripeCustomerId) {
      return res.status(400).json({ 
        error: 'No Stripe customer found. Please contact support.' 
      });
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${req.headers.origin || 'https://yourapp.com'}/settings`
    });

    logger.info('Billing portal session created', { 
      userId: user.id, 
      customerId: stripeCustomerId,
      sessionId: session.id 
    });

    res.json({ 
      url: session.url,
      customerId: stripeCustomerId
    });

  } catch (error: any) {
    logger.error('Billing portal error:', { 
      error: error.message,
      userId: req.user?.id 
    });
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid request data' });
    }
    
    res.status(500).json({ 
      error: 'Billing portal session failed',
      details: error.message 
    });
  }
});

// GET /api/billing-info - Get user's billing information
router.get('/api/billing-info', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    logger.info('Fetching billing info', { userId: user.id });

    const subscription = await storage.getUserSubscription(user.id);
    
    if (!subscription?.stripeCustomerId) {
      return res.json({
        hasPaymentMethod: false,
        subscription: null,
        customer: null
      });
    }

    // Get customer and subscription info from Stripe
    const [customer, stripeSubscriptions] = await Promise.all([
      stripe.customers.retrieve(subscription.stripeCustomerId),
      stripe.subscriptions.list({
        customer: subscription.stripeCustomerId,
        status: 'all',
        limit: 10
      })
    ]);

    const activeSubscription = stripeSubscriptions.data.find(sub => 
      ['active', 'trialing', 'past_due'].includes(sub.status)
    );

    const billingInfo = {
      hasPaymentMethod: customer.deleted ? false : !!(customer as Stripe.Customer).default_source || 
                        !!(customer as Stripe.Customer).invoice_settings?.default_payment_method,
      customer: customer.deleted ? null : {
        id: customer.id,
        email: (customer as Stripe.Customer).email,
        created: (customer as Stripe.Customer).created
      },
      subscription: activeSubscription ? {
        id: activeSubscription.id,
        status: activeSubscription.status,
        currentPeriodStart: new Date(activeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(activeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
        plan: activeSubscription.items.data[0]?.price ? {
          id: activeSubscription.items.data[0].price.id,
          amount: activeSubscription.items.data[0].price.unit_amount,
          currency: activeSubscription.items.data[0].price.currency,
          interval: activeSubscription.items.data[0].price.recurring?.interval
        } : null
      } : null
    };

    logger.info('Billing info retrieved', { 
      userId: user.id, 
      hasSubscription: !!activeSubscription 
    });

    res.json(billingInfo);

  } catch (error: any) {
    logger.error('Failed to fetch billing info:', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to fetch billing information' });
  }
});

// POST /api/cancel-subscription - Cancel user's subscription
router.post('/api/cancel-subscription', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    logger.info('Canceling subscription', { userId: user.id });

    const subscription = await storage.getUserSubscription(user.id);
    
    if (!subscription?.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel subscription at period end
    const canceledSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    // Update local subscription status
    await storage.updateSubscription(user.id, {
      status: 'canceled'
    });

    logger.info('Subscription canceled', { 
      userId: user.id, 
      subscriptionId: subscription.stripeSubscriptionId 
    });

    res.json({
      success: true,
      subscription: {
        id: canceledSubscription.id,
        cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
        currentPeriodEnd: new Date(canceledSubscription.current_period_end * 1000)
      }
    });

  } catch (error: any) {
    logger.error('Failed to cancel subscription:', { 
      error: error.message,
      userId: req.user?.id 
    });
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

export default router;