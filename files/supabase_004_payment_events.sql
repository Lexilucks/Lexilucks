-- Migration: 004_create_payment_events
-- Purpose: Log of all Stripe payment events for reconciliation and dispute tracking

CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE NOT NULL,
  -- Links back to Stripe event for idempotency
  stripe_session_id TEXT,
  -- Links to fan_requests
  package_type TEXT,
  amount_cents INTEGER NOT NULL,
  -- Store as cents to avoid float precision issues
  status TEXT NOT NULL,
  -- 'succeeded', 'failed', 'canceled'
  stripe_customer_id TEXT,
  raw_stripe_event JSONB,
  -- Store complete event for debugging
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for payment queries and reconciliation
CREATE INDEX IF NOT EXISTS idx_payment_events_phone ON payment_events(phone_number);
CREATE INDEX IF NOT EXISTS idx_payment_events_status ON payment_events(status);
CREATE INDEX IF NOT EXISTS idx_payment_events_created ON payment_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_events_stripe_session ON payment_events(stripe_session_id);

-- Constraints
ALTER TABLE payment_events
ADD CONSTRAINT check_amount_positive CHECK (amount_cents > 0),
ADD CONSTRAINT check_valid_status CHECK (status IN ('succeeded', 'failed', 'canceled'));
