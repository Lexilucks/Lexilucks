# Stripe Webhook Setup

## Overview
The Stripe webhook endpoint listens for payment events (checkout.session.completed) and updates the database to trigger SMS confirmations and scheduling flows.

---

## Endpoint Setup

### 1. Webhook URL
Register this endpoint in Stripe Dashboard:

**Live URL:** `https://your-domain.com/api/stripe/webhook`  
**Test URL:** `http://localhost:3000/api/stripe/webhook`

**Steps:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Paste your endpoint URL
5. Select event: `checkout.session.completed`
6. Click **Add endpoint**

### 2. Get Webhook Secret
After creating the webhook:
1. Click the endpoint to view details
2. Copy **Signing secret** (starts with `whsec_`)
3. Add to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## Events Handled

### `checkout.session.completed`
Fired when customer completes payment.

**Payload:**
```json
{
  "id": "evt_1NnJ...",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_...",
      "payment_status": "paid",
      "customer_email": "fan@example.com",
      "amount_total": 4900,
      "metadata": {
        "phone_number": "+14155552671",
        "package_type": "voice10"
      }
    }
  }
}
```

**Handler Action:**
1. ✅ Verify webhook signature (prevent tampering)
2. ✅ Log to `payment_events` table (idempotent via `stripe_event_id`)
3. ✅ Update `fan_requests` status to `paid`
4. ✅ Add/update contact in `fan_contacts` with SMS opt-in
5. ✅ Send SMS with scheduling link (async, non-blocking)

---

## Signature Verification (CRITICAL)

**DO NOT skip signature verification.** Stripe requires this to prevent webhook spoofing.

### Verification Process

```javascript
import crypto from 'crypto';

function verifyWebhookSignature(body, signature, secret) {
  const [timestamp, hash] = signature.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    if (key === 't') acc[0] = value;
    if (key === 'v1') acc[1] = value;
    return acc;
  }, []);

  // Check timestamp freshness (reject >5 min old)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    throw new Error('Signature timestamp outside tolerance window');
  }

  // Compute expected hash
  const signedContent = `${timestamp}.${body}`;
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(signedContent)
    .digest('hex');

  // Constant-time comparison (prevents timing attacks)
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(expectedHash)
  );
}
```

### Key Points
- ⚠️ Use **raw request body**, not parsed JSON
- ✅ Check **timestamp freshness** (reject old events)
- ✅ Use **constant-time comparison** (prevent timing attacks)
- ✅ Return **200 OK** to acknowledge receipt

---

## Idempotency (CRITICAL)

Stripe may deliver the same event multiple times. Handle gracefully:

```javascript
// Insert payment event with UNIQUE constraint on stripe_event_id
const { error } = await supabase
  .from('payment_events')
  .insert({
    phone_number,
    stripe_event_id, // UNIQUE constraint
    ...
  })
  .onConflict('stripe_event_id')
  .ignoreColumns(['id']); // Skip if already inserted
```

---

## Testing Webhook Locally

### Option 1: Use Stripe CLI (Recommended)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test event
stripe trigger checkout.session.completed
```

### Option 2: Manual Testing
```bash
# 1. Generate test signature (see test/stripe-webhook.test.js)
# 2. POST to localhost
curl -X POST http://localhost:3000/api/stripe/webhook \
  -H "stripe-signature: t=1234567890,v1=..." \
  -H "Content-Type: application/json" \
  -d '{"id":"evt_test","type":"checkout.session.completed","data":{"object":{...}}}'
```

### Option 3: Create Test Checkout
1. Use Stripe Dashboard test mode
2. Create a payment link with test card: `4242 4242 4242 4242`
3. Complete payment → webhook should fire automatically

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid signature" | Verify `STRIPE_WEBHOOK_SECRET` in `.env.local`. Use raw body, not parsed JSON. |
| "Event already processed" | Expected behavior! Idempotency prevents duplicate payments. Check `payment_events` table. |
| "SMS not sending" | Check Twilio credentials. Verify `TWILIO_PHONE_NUMBER` format. See logs. |
| "fan_requests not updating" | Verify `stripe_session_id` matches between Stripe payload and fan_requests row. |
| Webhook not firing | Check Stripe Dashboard logs. Verify endpoint URL. Ensure webhook secret matches. |

---

## Production Checklist

- [ ] Endpoint URL is `https://` (not http)
- [ ] `STRIPE_WEBHOOK_SECRET` is set in `.env`
- [ ] Signature verification is enabled
- [ ] Idempotency check via `stripe_event_id` UNIQUE
- [ ] SMS sending doesn't block webhook response
- [ ] Database errors are logged, not silenced
- [ ] Webhook returns 200 OK to Stripe
- [ ] Monitoring alerts on failed payments
- [ ] Logs capture all webhook events for audit

---

## Monitoring & Alerts

### Stripe Dashboard
- **Endpoint details**: Shows delivery status, last 25 events
- **Failed deliveries**: Stripe retries 5 times over 1 hour

### Application Logs
```javascript
console.log(`Received Stripe event: ${event.type}`);
console.error('Webhook error:', err);
```

### Database Queries
```sql
-- Check latest payments
SELECT * FROM payment_events 
ORDER BY created_at DESC LIMIT 10;

-- Check failed payments
SELECT * FROM payment_events 
WHERE status = 'failed' 
ORDER BY created_at DESC;

-- Reconcile requests vs payments
SELECT 
  fr.id, fr.phone_number, fr.status, 
  pe.status as payment_status, 
  pe.created_at
FROM fan_requests fr
LEFT JOIN payment_events pe ON fr.stripe_event_id = pe.stripe_event_id
ORDER BY fr.created_at DESC;
```

---

## Support

- Stripe Docs: https://stripe.com/docs/webhooks
- Stripe CLI: https://stripe.com/docs/stripe-cli
- Webhook Events: https://stripe.com/docs/api/events/types
