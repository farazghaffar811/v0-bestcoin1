-- Create admin user programmatically
-- This script creates an admin user with specific credentials

-- First, add an admin role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Create admin user using Supabase Auth Admin API
-- Note: This needs to be run through the Supabase Admin API or dashboard
-- The user will be created with email: bestcoin1@gmail.com and password: bestcoinceo1

-- Update the profile to mark as admin (this will be done after user creation)
-- INSERT INTO profiles (id, email, role, credit_score, available_balance, uid, preferred_currency)
-- VALUES (
--   'admin-user-id-here', 
--   'bestcoin1@gmail.com', 
--   'admin', 
--   1000, 
--   0.0000, 
--   'ADMIN001', 
--   'USD'
-- );

-- For now, we'll handle admin creation through the API
