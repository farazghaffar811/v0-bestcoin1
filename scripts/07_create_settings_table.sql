-- Create settings table to store admin configurations like telegram link
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default telegram link setting
INSERT INTO settings (key, value) VALUES ('telegram_link', 'https://t.me/support') 
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admin access
CREATE POLICY "Admin can manage settings" ON settings
  FOR ALL USING (true);
