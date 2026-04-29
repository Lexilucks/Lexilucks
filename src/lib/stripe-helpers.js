/**
 * Lexi Concierge Stripe Helpers
 * Utilities for verifying and parsing Stripe webhooks securely.
 */

// import stripe from 'stripe'; // Uncomment when Stripe package is installed

export function verifyStripeSignature(rawBody, signature, secret) {
  if (!signature || !secret) {
    throw new Error('Missing stripe signature or webhook secret');
  }

  // const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
  // return stripeClient.webhooks.constructEvent(rawBody, signature, secret);

  // Simulated validation for local dev without the real Stripe library
  console.log('[Stripe Helper] Simulating signature verification');
  try {
    return JSON.parse(rawBody.toString());
  } catch (err) {
    throw new Error('Invalid JSON payload');
  }
}

export function extractMetadata(paymentIntent) {
  // Payment Links pass metadata through to the Payment Intent
  return {
    phoneNumber: paymentIntent.metadata?.phone_number || null,
    packageType: paymentIntent.metadata?.package_type || null
  };
}
