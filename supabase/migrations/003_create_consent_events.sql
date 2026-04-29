-- 003_create_consent_events.sql

CREATE TABLE IF NOT EXISTS consent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  event_type TEXT NOT NULL, -- '18+_confirmed', 'sms_opted_in', 'terms_agreed', 'opted_out'
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (phone_number) REFERENCES fan_contacts(phone_number) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consent_events_phone_number ON consent_events(phone_number);

-- RLS Policies
ALTER TABLE consent_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own consent events
CREATE POLICY "View own consent events" ON consent_events
  FOR SELECT
  USING (phone_number = auth.jwt()->>'phone_number');

-- Allow service role full access
CREATE POLICY "Service role can manage consent events" ON consent_events
  USING (true);
