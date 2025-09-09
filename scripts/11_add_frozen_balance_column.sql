-- Add frozen_balance column to profiles table
ALTER TABLE profiles 
ADD COLUMN frozen_balance DECIMAL(20, 8) DEFAULT 0;

-- Update existing users to have 0 frozen balance
UPDATE profiles SET frozen_balance = 0 WHERE frozen_balance IS NULL;
