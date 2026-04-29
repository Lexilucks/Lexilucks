/**
 * POST /api/stripe/webhook
 * 
 * Stripe event listener.
 * Listens for payment_intent.succeeded events to trigger post-payment workflows.
 */

import { verifyStripeSignature, extractMetadata } from '../../src/lib/stripe-helpers.js';
import { sendSms } from '../twilio/send-sms.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Verify Stripe signature
    const signature = req.headers['stripe-signature'];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // 2. Parse event payload using the helper
    const event = verifyStripeSignature(req.body, signature, secret);
    
    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    // 3. Handle specific event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const { phoneNumber, packageType } = extractMetadata(paymentIntent);
        
        console.log(`[Stripe Webhook] Payment succeeded for intent: ${paymentIntent.id}, Package: ${packageType}, Phone: ${phoneNumber}`);
        
        if (phoneNumber) {
          // Send SMS confirmation with next step
          await sendSms({ 
            to: phoneNumber, 
            body: `✅ Payment received for your ${packageType} request! Lexi's team will follow up soon.`, 
            type: "payment_confirmation" 
          });
        }
        
        // A full implementation would also:
        // - Update fan_requests table status='paid'
        // - Log to payment_events
        break;
      }
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook Error]', error);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
}
