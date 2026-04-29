# Stripe Webhook Setup

This document guides you through setting up Stripe webhooks for the Lexi Concierge system.

## 1. Register Webhook Endpoint

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/).
2. Navigate to **Developers -> Webhooks**.
3. Click **Add an endpoint**.
4. Set the **Endpoint URL** to your production API URL (e.g., `https://lexilucks.com/api/stripe/webhook`).
5. Select the events to listen for. The mandatory event is:
   - `payment_intent.succeeded`
6. Click **Add endpoint**.

## 2. Configure Secrets

Once the endpoint is created, reveal the **Signing Secret** (starts with `whsec_...`).

Add these to your `.env.local`:
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 3. Local Testing

You can use the Stripe CLI to test webhooks locally:

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Login to your account:
   ```bash
   stripe login
   ```
3. Forward events to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copy the webhook secret provided in the terminal output and add it to your local `.env.local` file.
5. Trigger a test event in another terminal:
   ```bash
   stripe trigger payment_intent.succeeded
   ```
