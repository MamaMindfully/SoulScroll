// Redirect users to Stripe checkout using the buy button
export const redirectToCheckout = async (email) => {
  // Use the provided Stripe buy button URL
  const checkoutUrl = 'https://buy.stripe.com/test_bJe14peccgQ8dxS7Gyffy00';
  
  // Store user email in session storage for webhook processing
  if (email) {
    sessionStorage.setItem('stripe_user_email', email);
  }
  
  // Redirect to Stripe checkout
  window.location.href = checkoutUrl;
};

// Alternative: Create checkout session via API (keeping existing functionality)
export const redirectToApiCheckout = async (email) => {
  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { url } = await res.json();
    window.location.href = url;
  } catch (error) {
    console.error('Checkout error:', error);
    throw error;
  }
};