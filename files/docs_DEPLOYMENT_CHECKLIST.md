# Deployment Checklist

**Before launching to production, verify every item below.**

---

## Compliance & Legal

### 18+ Age Gate
- [ ] Age confirmation ("YES" required) enforced before any package selection
- [ ] Age confirmation logged in `consent_events` table
- [ ] Cannot access packages without 18+ confirmation
- [ ] Test: SMS "HELP" before confirming age → receives "You must be 18+"

### SMS Opt-In
- [ ] Contact created in `fan_contacts` with `sms_opted_in = true` after age confirmation
- [ ] SMS opt-in logged in `consent_events` with timestamp
- [ ] Cannot send SMS to users with `sms_opted_in = false`
- [ ] Test: New user → age gate → opt-in logged

### STOP Handling
- [ ] STOP keyword immediately sets `opted_out_at` and `sms_opted_in = false`
- [ ] Logged in `consent_events` as `opted_out`
- [ ] No future SMS to opted-out users (even errors)
- [ ] UNSTOP allows re-opt-in
- [ ] Test: Send STOP → receive confirmation → send SMS → no response

### Clean SMS Copy
- [ ] No explicit sexual content in SMS templates
- [ ] Adult content routed to OnlyFans (option 8)
- [ ] All SMS templates reviewed for professionalism
- [ ] AI labeled as "Lexi AI Assistant" (not "Lexi" or "real Lexi")
- [ ] Check: `src/lib/sms-copy.js` for all templates

### Audit Trail
- [ ] `consent_events` table has all age/opt-in/opt-out events
- [ ] Timestamps accurate (use NOW() in SQL)
- [ ] Phone numbers recorded (for TCPA disputes)
- [ ] Immutable: no updates/deletes to consent_events

---

## Data Security

### Environment Variables
- [ ] `.env.local` exists and is in `.gitignore`
- [ ] All secrets in `.env.local`: Stripe, Twilio, Supabase keys
- [ ] No secrets hardcoded in HTML/JS/API code
- [ ] Test: `grep -r "sk_" src/ api/` returns nothing
- [ ] Test: `grep -r "whsec_" .` returns only `.env.local`

### Database Security
- [ ] Supabase RLS (Row-Level Security) enabled on all tables
- [ ] Admin-only policies on `fan_requests`, `payment_events`
- [ ] Service role key used only in backend (never in frontend)
- [ ] Anon key used in frontend (read-only for admin dashboard)

### API Keys & Tokens
- [ ] Stripe webhook secret verified on every request
- [ ] Twilio SMS signature not checked (Twilio uses HTTP POST, not signed)
- [ ] Supabase JWT tokens validated on protected endpoints
- [ ] No API keys exposed in error messages

### HTTPS Only
- [ ] All endpoints use HTTPS (not HTTP)
- [ ] Admin dashboard accessible only over HTTPS
- [ ] Webhook endpoints accept POST only
- [ ] CORS headers configured correctly

---

## Testing

### Unit Tests
- [ ] `npm test` passes all tests
- [ ] Stripe webhook signature verification works
- [ ] SMS state machine transitions validated
- [ ] Phone number validation (E.164 format)
- [ ] Test coverage >80%

### Integration Tests (Manual)
- [ ] Age gate → package menu → checkout → payment → SMS confirmation
- [ ] STOP keyword → opt-out → no future SMS
- [ ] UNSTOP keyword → re-opt-in → receives SMS
- [ ] Stripe webhook fires → `fan_requests` updated to `paid`
- [ ] Calendly link sent in post-payment SMS

### Database Tests
- [ ] Schema migrations run without error
- [ ] Indexes created (fast lookups)
- [ ] Constraints enforced (e.g., opted_out consistency)
- [ ] Sample data loads correctly

### SMS Tests (Twilio)
- [ ] Inbound SMS received and parsed correctly
- [ ] Outbound SMS sent with correct formatting
- [ ] Phone numbers in E.164 format (+1234567890)
- [ ] SMS templates render without errors
- [ ] Bulk SMS handles failures gracefully

### Webhook Tests
- [ ] Stripe webhook signature verified
- [ ] Idempotent on duplicate events
- [ ] Non-blocking SMS send (webhook returns 200 immediately)
- [ ] Payment events logged even if SMS fails
- [ ] Database errors logged, webhook still returns 200

---

## Code Quality

### No Secrets in Git
- [ ] `.env.local` in `.gitignore`
- [ ] No `sk_`, `whsec_`, or other keys in commits
- [ ] Check: `git log -p | grep "sk_"` returns nothing
- [ ] Clean commit history before launch

### Error Handling
- [ ] No sensitive errors exposed to users (e.g., full stack traces)
- [ ] Errors logged server-side for debugging
- [ ] User-friendly error messages ("Something went wrong")
- [ ] SMS not sent if DB update fails

### Logging
- [ ] All inbound SMS logged
- [ ] All payments logged
- [ ] All consent events logged
- [ ] Errors logged with context (phone, request ID)
- [ ] No secrets in logs

### Code Review
- [ ] API endpoints reviewed for injection vulnerabilities
- [ ] SQL queries use parameterized queries (Supabase ORM)
- [ ] No `eval()` or dynamic code execution
- [ ] Dependencies up-to-date (`npm audit` clean)

---

## Performance

### Database
- [ ] Indexes on `phone_number`, `status`, `created_at`
- [ ] Query performance <200ms for admin dashboard
- [ ] Pagination implemented (20 items per page)
- [ ] No N+1 queries

### SMS Sending
- [ ] Non-blocking (webhook returns 200 before SMS sent)
- [ ] Retry logic for failed sends
- [ ] Rate limiting on bulk SMS
- [ ] SMS queue if >100 concurrent sends

### Stripe Webhook
- [ ] Webhook returns 200 within 5 seconds
- [ ] Heavy lifting (SMS) done asynchronously
- [ ] Timeout handling (if SMS service down)

---

## Admin Dashboard

### Functionality
- [ ] Dashboard loads requests from Supabase
- [ ] Filters work (status, package, search)
- [ ] Edit modal opens and saves
- [ ] Mark complete button works
- [ ] Stats update correctly
- [ ] Pagination functional

### Security
- [ ] Admin auth required (not visible to public)
- [ ] User cannot modify other users' requests
- [ ] Admin token/session expires
- [ ] Logout clears all data

### UX
- [ ] Dashboard loads in <2 seconds
- [ ] Table displays correctly on mobile
- [ ] No console errors (F12)
- [ ] Loading spinner shown while fetching

---

## Monitoring & Alerts

### Alerts (Set Up Before Launch)
- [ ] Email on payment failures
- [ ] Email on SMS delivery failures
- [ ] Database connection errors
- [ ] Webhook delivery failures (Stripe)
- [ ] High error rate (>5% of requests failing)

### Metrics to Track
- [ ] Total requests/day
- [ ] Conversion rate (paid / viewed)
- [ ] Revenue/day
- [ ] SMS response rate
- [ ] Completion rate
- [ ] STOP rate (opt-outs)

### Logging
- [ ] Inbound SMS logged to `sms_logs` or database
- [ ] Payment events logged to `payment_events`
- [ ] Consent events logged to `consent_events`
- [ ] Errors logged to external service (e.g., Sentry)

---

## Deployment Steps

### 1. Final Build
```bash
npm run build
npm test
git log --oneline -5  # Verify clean history
```

### 2. Environment
```bash
# Verify .env.local exists and is in .gitignore
cat .env.local  # Confirm all vars set
grep "env.local" .gitignore  # Confirm it's ignored
```

### 3. Database
```bash
# Run migrations in order
psql -f supabase/migrations/001_create_fan_requests.sql
psql -f supabase/migrations/002_create_fan_contacts.sql
psql -f supabase/migrations/003_create_consent_events.sql
psql -f supabase/migrations/004_create_payment_events.sql

# Verify tables created
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public';
```

### 4. Webhooks
```bash
# Register Stripe webhook
# See: docs/STRIPE_SETUP.md

# Verify Stripe webhook secret in .env.local
echo $STRIPE_WEBHOOK_SECRET
```

### 5. Domain & SSL
```bash
# Ensure HTTPS enabled
curl -I https://your-domain.com/api/stripe/webhook
# Should return 405 (POST only) or 200, not error
```

### 6. Admin Dashboard
```bash
# Copy files
cp admin/dashboard.html /web-root/admin/
cp admin/login.html /web-root/admin/

# Verify accessible
curl https://your-domain.com/admin/dashboard.html
```

### 7. Test Full Flow
```bash
# 1. Send test SMS
# 2. Confirm age gate
# 3. Select package
# 4. Complete payment (Stripe test card)
# 5. Verify SMS received
# 6. Check admin dashboard
# 7. Mark request complete
```

### 8. Go Live
```bash
git tag -a v1.0.0 -m "Initial production launch"
git push origin main
git push origin v1.0.0
```

---

## Post-Launch (First 48 Hours)

### Monitor
- [ ] Check error logs every hour
- [ ] Monitor SMS delivery (Twilio dashboard)
- [ ] Monitor payment processing (Stripe dashboard)
- [ ] Check database performance (Supabase dashboard)

### Verify
- [ ] At least one real customer request completed
- [ ] Payment processed end-to-end
- [ ] SMS received by customer
- [ ] Request visible in admin dashboard

### Feedback
- [ ] Test SMS flow from real phone
- [ ] Try edge cases (invalid input, STOP/UNSTOP)
- [ ] Check SMS formatting on iPhone & Android
- [ ] Verify Calendly links work

---

## Troubleshooting (If Issues Found)

### SMS not sending
1. Check Twilio account balance (need $0.01+ per SMS)
2. Verify phone number format: `+14155552671`
3. Check TWILIO_PHONE_NUMBER is registered
4. Verify inbound SMS handling is correct

### Webhook not firing
1. Check Stripe webhook endpoint URL
2. Verify webhook secret matches `.env.local`
3. Check logs for signature verification errors
4. Test with Stripe CLI: `stripe trigger checkout.session.completed`

### Database errors
1. Check Supabase connection string
2. Verify migrations ran (`\dt` in psql)
3. Check RLS policies (if enabled)
4. Verify service role key has permissions

### Admin dashboard blank
1. Check Supabase URL & key in HTML
2. Open browser console (F12) for errors
3. Verify user is authenticated
4. Check RLS policies allow read access

---

## Success Criteria

✅ **You're ready to launch when:**
- [ ] All compliance checks pass
- [ ] All tests pass (`npm test`)
- [ ] No secrets in code
- [ ] Full end-to-end flow tested
- [ ] Admin dashboard functional
- [ ] Monitoring alerts set up
- [ ] At least one real payment processed
- [ ] All docs completed & accurate

🚀 **Ship it!**

---

## Post-Launch Handoff

Once live, provide to client:
1. **Admin Dashboard URL** (with login)
2. **Admin Credentials** (secure method)
3. **Monitoring Dashboard** (error logs, SMS status)
4. **Support Contact** (who to call if something breaks)
5. **Runbook** (how to handle common issues)

Document SLAs:
- SMS delivery: 99% within 5 minutes
- Payment processing: <1 second
- Admin dashboard: <2 seconds to load
- Uptime: 99.9%
