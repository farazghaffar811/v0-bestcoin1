CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  bank_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_notes TEXT
);

-- Enable RLS
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can only see their own withdrawals
CREATE POLICY "Users can view own withdrawals" ON withdrawals
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own withdrawals
CREATE POLICY "Users can insert own withdrawals" ON withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
