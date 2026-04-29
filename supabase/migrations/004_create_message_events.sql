-- 004_create_message_events.sql

CREATE TABLE IF NOT EXISTS message_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  message_sid TEXT UNIQUE,
  message_type TEXT, -- 'menu', 'confirmation', 'reminder', 'scheduling_link', 'inbound'
  message_body TEXT,
  status TEXT DEFAULT 'queued', -- queued, sent, delivered, failed, bounced, received
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_message_events_phone_number ON message_events(phone_number);
CREATE INDEX IF NOT EXISTS idx_message_events_message_sid ON message_events(message_sid);

-- RLS Policies
ALTER TABLE message_events ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage message events" ON message_events
  USING (true);
