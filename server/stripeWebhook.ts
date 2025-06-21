import { Request, Response, Router } from 'express';
import Stripe from 'stripe';
import { storage } from './storage';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const router = Router();

router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  
  if (!sig) {
    console.error('Missing Stripe signature');
    return res.status(400).send('Missing Stripe signature');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received Stripe webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        
        if (!userId) {
          console.error('No userId in session metadata');
          break;
        }

        // Update user to premium status
        await storage.upsertUser({
          id: userId,
          isPremium: true
        });
        
        console.log(`User ${userId} upgraded to premium via Stripe checkout`);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Find user by Stripe customer ID
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;
        
        const userId = customer.metadata?.userId;
        if (!userId) {
          console.error('No userId in customer metadata');
          break;
        }

        const isActive = subscription.status === 'active';
        await storage.upsertUser({
          id: userId,
          isPremium: isActive
        });
        
        console.log(`User ${userId} subscription ${isActive ? 'activated' : 'deactivated'}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;
        
        const userId = customer.metadata?.userId;
        if (!userId) {
          console.error('No userId in customer metadata');
          break;
        }

        // Downgrade user to free
        await storage.upsertUser({
          id: userId,
          isPremium: false
        });
        
        console.log(`User ${userId} subscription cancelled - downgraded to free`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;
        
        const userId = customer.metadata?.userId;
        if (userId) {
          console.log(`Payment failed for user ${userId}`);
          // Could send notification email here
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).send('Webhook processing error');
  }

  res.status(200).json({ received: true });
});

export default router;