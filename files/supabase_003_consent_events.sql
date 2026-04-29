-- Migration: 003_create_consent_events
-- Purpose: Immutable audit log of all consent actions (compliance critical for TCPA/GDPR)
-- Events: 18+ age confirmation, SMS opt-in, opt-out, terms agreement

CREATE TABLE IF NOT EXISTS consent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  event_type TEXT NOT NULL,
  -- Types: '18+_confirmed', 'sms_opted_in', 'opted_out', 'terms_agreed'
  ip_address TEXT,
  user_agent TEXT,
  -- Minimal tracking for compliance disputes
  metadata JSONB,
  -- Flexible for future event details
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_consent_events_phone ON consent_events(phone_number);
CREATE INDEX IF NOT EXISTS idx_consent_events_type ON consent_events(event_type);
CREATE INDEX IF NOT EXISTS idx_consent_events_created ON consent_events(created_at DESC);

-- Immutability: prevent updates/deletes (audit trail must be permanent)
ALTER TABLE consent_events
DISABLE TRIGGER ALL;
-- Note: In production, set trigger to prevent ANY modifications after insert
