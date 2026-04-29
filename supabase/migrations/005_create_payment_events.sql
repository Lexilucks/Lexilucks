-- 005_create_payment_events.sql

CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_payment_intent_id TEXT,
  package_type TEXT,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  status TEXT, -- succeeded, failed, refunded
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_events_phone_number ON payment_events(phone_number);
CREATE INDEX IF NOT EXISTS idx_payment_events_stripe_event_id ON payment_events(stripe_event_id);

-- RLS Policies
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage payment events" ON payment_events
  USING (true);
