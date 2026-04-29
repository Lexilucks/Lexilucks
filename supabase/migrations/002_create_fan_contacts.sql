-- 002_create_fan_contacts.sql

CREATE TABLE IF NOT EXISTS fan_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  first_name TEXT,
  sms_opted_in BOOLEAN DEFAULT FALSE,
  sms_opted_in_at TIMESTAMP WITH TIME ZONE,
  email_opted_in BOOLEAN DEFAULT FALSE,
  email_opted_in_at TIMESTAMP WITH TIME ZONE,
  opted_out_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fan_contacts_phone_number ON fan_contacts(phone_number);

-- RLS Policies
ALTER TABLE fan_contacts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own contact info based on verified phone
CREATE POLICY "Users can view own contact" ON fan_contacts 
  FOR SELECT
  USING (phone_number = auth.jwt()->>'phone_number');

-- Allow service role to manage contacts
CREATE POLICY "Service role can manage contacts" ON fan_contacts
  USING (true);
