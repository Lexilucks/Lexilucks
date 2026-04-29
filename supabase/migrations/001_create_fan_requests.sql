-- 001_create_fan_requests.sql

CREATE TABLE IF NOT EXISTS fan_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  email TEXT,
  package_type TEXT NOT NULL, -- 'textList', 'fanDrop', 'priorityText', 'realLexiText', 'voice10', 'video20', 'vip'
  request_message TEXT,
  entry_path TEXT, -- 'website', 'sms', 'instagram', 'tiktok'
  status TEXT DEFAULT 'new', -- new, consented, package_selected, checkout_sent, paid, scheduling_sent, scheduled, completed
  stripe_checkout_id TEXT,
  payment_link_opened_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fan_requests_phone_number ON fan_requests(phone_number);
CREATE INDEX IF NOT EXISTS idx_fan_requests_user_id ON fan_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_fan_requests_status ON fan_requests(status);

-- RLS Policies
ALTER TABLE fan_requests ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own requests
CREATE POLICY "Users can view own requests" ON fan_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role (backend) to manage all requests
CREATE POLICY "Service role can manage all requests" ON fan_requests
  USING (true);
