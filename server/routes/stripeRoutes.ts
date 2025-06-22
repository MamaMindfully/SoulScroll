import { Router } from 'express';
import Stripe from 'stripe';
import { isAuthenticated } from '../replitAuth';
import { storage } from '../storage';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Create checkout session for API-based flow
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Luma Premium',
              description: 'Unlock AI-powered insights, voice journaling, and advanced features',
            },
            unit_amount: 899, // $8.99
          },
          quantity: 1,
        },
      ],
      success_url: `${req.protocol}://${req.get('host')}/premium-success`,
      cancel_url: `${req.protocol}://${req.get('host')}/premium`,
      metadata: {
        email: email,
        source: 'api_checkout'
      }
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

export default router;