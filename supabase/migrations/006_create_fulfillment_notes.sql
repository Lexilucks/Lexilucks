-- 006_create_fulfillment_notes.sql

CREATE TABLE IF NOT EXISTS fulfillment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES fan_requests(id) ON DELETE CASCADE,
  note_type TEXT, -- 'status_update', 'scheduling_link', 'reminder', 'completion', 'cancellation'
  note_body TEXT,
  created_by TEXT, -- 'system', 'lexi', 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fulfillment_notes_request_id ON fulfillment_notes(request_id);

-- RLS Policies
ALTER TABLE fulfillment_notes ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage fulfillment notes" ON fulfillment_notes
  USING (true);
