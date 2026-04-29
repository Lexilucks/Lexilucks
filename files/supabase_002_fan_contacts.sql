-- Migration: 002_create_fan_contacts
-- Purpose: SMS contact list with opt-in/opt-out tracking (compliance critical)

CREATE TABLE IF NOT EXISTS fan_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  sms_opted_in BOOLEAN DEFAULT FALSE,
  sms_opted_in_at TIMESTAMP,
  opted_out_at TIMESTAMP,
  -- Compliance: track when user said STOP
  last_contact_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookups and deduplication
CREATE INDEX IF NOT EXISTS idx_fan_contacts_phone ON fan_contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_fan_contacts_email ON fan_contacts(email);
CREATE INDEX IF NOT EXISTS idx_fan_contacts_sms_opted_in ON fan_contacts(sms_opted_in);

-- Prevent SMS to opted-out users (data integrity)
ALTER TABLE fan_contacts
ADD CONSTRAINT check_opted_out_consistency
  CHECK (
    (opted_out_at IS NULL AND sms_opted_in = TRUE) OR
    (opted_out_at IS NOT NULL AND sms_opted_in = FALSE)
  );
