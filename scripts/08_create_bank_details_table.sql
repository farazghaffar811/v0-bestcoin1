-- Create bank_details table for storing user bank information
CREATE TABLE IF NOT EXISTS bank_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  binding_type VARCHAR(50) DEFAULT 'Bank Card',
  currency VARCHAR(10) DEFAULT 'ZAR',
  account_holder_name VARCHAR(255) NOT NULL,
  bind_bank VARCHAR(255) NOT NULL,
  bank_card_number VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bank_details ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own bank details" ON bank_details
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank details" ON bank_details
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank details" ON bank_details
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_bank_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bank_details_updated_at
  BEFORE UPDATE ON bank_details
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_details_updated_at();
