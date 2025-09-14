-- Ensure settings table exists with proper structure and permissions
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default telegram link setting if it doesn't exist
INSERT INTO settings (key, value) VALUES ('telegram_link', 'https://t.me/support') 
ON CONFLICT (key) DO NOTHING;

-- Ensure RLS is properly configured
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can manage settings" ON settings;

-- Create policy to allow admin access (more permissive for troubleshooting)
CREATE POLICY "Admin can manage settings" ON settings
  FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON settings TO postgres;
GRANT ALL ON settings TO anon;
GRANT ALL ON settings TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE settings_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE settings_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE settings_id_seq TO authenticated;
