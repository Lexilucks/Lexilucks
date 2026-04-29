-- Migration: 001_create_fan_requests
-- Purpose: Store all incoming fan requests (text, voice, video, VIP packages)
-- Status tracking through the funnel: new → consented → package_selected → checkout_sent → paid → scheduling_sent → completed

CREATE TABLE IF NOT EXISTS fan_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  email TEXT,
  package_type TEXT,
  -- Options: 'textList', 'fanDrop', 'priorityText', 'realLexiText', 'voice10', 'video20', 'vip'
  request_message TEXT,
  status TEXT DEFAULT 'new',
  -- State machine: new → consented → package_selected → checkout_sent → paid → scheduling_sent → completed
  stripe_event_id TEXT UNIQUE,
  stripe_session_id TEXT UNIQUE,
  paid_at TIMESTAMP,
  scheduling_sent_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_fan_requests_phone ON fan_requests(phone_number);
CREATE INDEX IF NOT EXISTS idx_fan_requests_status ON fan_requests(status);
CREATE INDEX IF NOT EXISTS idx_fan_requests_created_at ON fan_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fan_requests_stripe_session ON fan_requests(stripe_session_id);

-- Row-level security (if using Supabase auth)
-- ALTER TABLE fan_requests ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Admin only" ON fan_requests
--   FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (
--     SELECT 1 FROM admin_users WHERE user_id = auth.uid()
--   ));
