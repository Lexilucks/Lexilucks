# SMS Flow Documentation

## Overview
The Text/Call Lexi funnel uses SMS (Twilio) to automate the entire customer journey:
1. **Age gate** (18+)
2. **Package selection** (8 options: text, fan drop, voice, video, VIP, OnlyFans)
3. **Checkout** (Stripe payment link)
4. **Post-payment** (Calendly scheduling for voice/video)
5. **Fulfillment** (SMS updates, completion)

---

## SMS Menu (User Replies 1-8)

After confirming 18+, users see:

```
1️⃣ Text List ($9)
   → 5 personalized AI texts over 7 days

2️⃣ Fan Drop ($19)
   → 1 exclusive photo/message surprise

3️⃣ Priority Text ($29)
   → 3 texts, answered within 12 hours

4️⃣ Real Lexi Text ($49)
   → Personal text from real Lexi (not AI)

5️⃣ 10-min Voice Call ($49)
   → Schedule a 10-minute voice call
   → Calendly link sent after payment

6️⃣ 20-min Video Call ($99)
   → Schedule a 20-minute video call
   → Calendly link sent after payment

7️⃣ VIP Experience ($199)
   → Premium 1-on-1 experience
   → Voice, video, or both (your choice)
   → Calendly link sent after payment

8️⃣ OnlyFans
   → Redirect to Lexi's OnlyFans for adult content
   → No payment required (external link)
```

---

## Reserved Keywords

| Keyword | Action | Response |
|---------|--------|----------|
| `STOP` | Opt-out from all SMS | "You've been unsubscribed. Reply UNSTOP to re-subscribe." |
| `UNSTOP` | Re-opt-in to SMS | "You're re-subscribed!" |
| `HELP` | Show menu again | Display all 8 options |
| `YES` | Confirm 18+ age | Show package menu |
| `1-8` | Select package | Send Stripe checkout link |

---

## State Machine

```
new
  ↓ [User replies YES to age gate]
consented
  ↓ [User selects 1-8]
package_selected
  ↓ [Stripe link sent via SMS]
checkout_sent
  ↓ [Stripe webhook: checkout.session.completed]
paid
  ↓ [Calendly link sent for voice/video packages]
scheduling_sent
  ↓ [User completes experience]
completed
```

---

## Flow Walkthrough

### Initial Contact (Inbound SMS)
```
USER:  "Hey, I want to book a call"
BOT:   "Hi! 👋 Welcome to Lexi's exclusive fan experiences. 
        This is Lexi AI Assistant. To continue, you must confirm 
        you're 18+. Reply "YES" to proceed."
```

### Age Gate
```
USER:  "YES"
BOT:   "✅ Thanks for confirming! Here are your options:
        1️⃣ Text List ($9)
        2️⃣ Fan Drop ($19)
        ...
        8️⃣ OnlyFans"
```

### Package Selection
```
USER:  "5"
BOT:   "🎁 You selected 10-min Voice Call ($49). 
        Schedule your call at checkout.
        💳 Click to pay: https://buy.stripe.com/..."
```

### Payment Confirmation (via Stripe webhook)
```
(Stripe webhook fires: checkout.session.completed)
BOT:   "✅ Payment received! Your Voice Call is confirmed.
        Book your 10-min call here: https://calendly.com/lexi/voice-10min
        Talk soon!"
```

### Scheduling
```
USER:  [Clicks Calendly link, selects time]
BOT:   [Reminder SMS 24 hours before call]
       "📅 Reminder: You have a voice call tomorrow at 2 PM!"
```

### Completion
```
(Call completed, admin marks as done in dashboard)
BOT:   [Optional SMS] "Thanks for the call! Check your email for the recording."
```

---

## Compliance Rules (ENFORCED)

### ✅ 18+ Age Gate
- **BEFORE** showing any package or taking payment, user MUST reply "YES"
- Only after 18+ confirmation can user see prices/packages
- Age confirmation logged in `consent_events` table
- No exceptions, no skipping

### ✅ SMS Opt-in
- Contact must have `sms_opted_in = true` in `fan_contacts` table
- Logged in `consent_events` as `sms_opted_in` event
- Timestamp recorded for compliance disputes

### ✅ STOP Handling
- User replies `STOP` → **immediately** set `opted_out_at` and `sms_opted_in = false`
- Confirm opt-out with: "You've been unsubscribed. Reply UNSTOP to re-subscribe."
- **Zero further messages** to this user
- Compliance: TCPA requires immediate handling (no delays)

### ✅ Clean SMS Copy
- No explicit sexual content via SMS
- Route adult content to OnlyFans (option 8)
- All templates reviewed for professionalism
- Label as "Lexi AI Assistant" (not real Lexi, except for option 4)

### ✅ Audit Trail
- All consent events logged: 18+, opt-in, opt-out, payment
- Immutable `consent_events` table (no updates/deletes)
- Phone number, event type, timestamp recorded
- Required for TCPA/GDPR compliance disputes

### ✅ No Secrets in Code
- Stripe, Twilio, Supabase keys → `.env.local` only
- Never in HTML, JavaScript, git history
- Use `process.env.*` in Node.js, `import.meta.env.*` in frontend

---

## SMS Pricing Tiers

| Package | Price | Type | Fulfillment |
|---------|-------|------|-------------|
| Text List | $9 | Text-only | 5 messages over 7 days |
| Fan Drop | $19 | Photo + text | Within 24 hours |
| Priority Text | $29 | Text-only | 3 messages within 12h |
| Real Lexi Text | $49 | Text-only | Personal from real Lexi |
| Voice Call | $49 | Voice | Calendly booking, 10 min |
| Video Call | $99 | Video | Calendly booking, 20 min |
| VIP Experience | $199 | Voice + Video | Calendly booking, flexible |

---

## Handling Errors

| Error | Response |
|-------|----------|
| Invalid input (not 1-8, YES, STOP, etc) | "❓ I didn't understand that. Reply 1-8, HELP, or STOP." |
| Payment failed | SMS: "⚠️ Your payment didn't go through. Try again: [link]" |
| Calendly link expired | SMS: "📅 Your scheduling link expired. Contact support." |
| User replies with question | "For support, email support@lexi.com" (don't auto-respond) |

---

## Testing SMS Flow Locally

### Mock Twilio Inbound
```bash
# POST to http://localhost:3000/api/twilio/inbound-sms
curl -X POST http://localhost:3000/api/twilio/inbound-sms \
  -d "From=%2B14155552671&Body=YES"
```

### Mock Stripe Webhook
```bash
# POST to http://localhost:3000/api/stripe/webhook
# See test/stripe-webhook.test.js for signature generation
```

### Database Queries
```sql
-- Check consent events
SELECT * FROM consent_events 
WHERE phone_number = '+14155552671' 
ORDER BY created_at DESC;

-- Check fan_contacts opt-out status
SELECT * FROM fan_contacts 
WHERE phone_number = '+14155552671';

-- Check request state
SELECT id, phone_number, package_type, status, created_at 
FROM fan_requests 
WHERE phone_number = '+14155552671' 
ORDER BY created_at DESC;
```

---

## Calendly Integration

After payment succeeds, send SMS with Calendly link:

```
✅ Payment received! Your Voice Call is confirmed.

Book your 10-min call here: [CALENDLY_VOICE_10_LINK]

Talk soon!
```

**Env vars:**
```
CALENDLY_VOICE_10_LINK=https://calendly.com/lexi/voice-10min
CALENDLY_VIDEO_20_LINK=https://calendly.com/lexi/video-20min
CALENDLY_VIP_LINK=https://calendly.com/lexi/vip-experience
```

---

## Escalation & Support

**When to NOT auto-respond:**
- Questions/requests outside SMS menu
- Payment issues
- Scheduling conflicts
- Custom requests

**Instead:**
- Log message in database
- Flag for human review in admin dashboard
- Respond: "Thanks for reaching out! A team member will respond soon."

---

## Metrics to Track

```
Total SMS sent
SMS opt-in rate (SMS opted in / Total contacts)
SMS response rate (Replied to first message / SMS sent)
Conversion rate (Paid / SMS responses)
Package breakdown (# of each type purchased)
Peak SMS times (when users most likely to reply)
STOP rate (Opt-outs / Total opted in)
```

All logged in `payment_events` + `consent_events` tables.
