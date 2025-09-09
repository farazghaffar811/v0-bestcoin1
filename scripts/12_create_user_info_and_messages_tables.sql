-- Create user_info table for authentication page
CREATE TABLE IF NOT EXISTS user_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone_number TEXT,
  address TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_messages table for admin announcements
CREATE TABLE IF NOT EXISTS user_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_info
CREATE POLICY "Users can view own info" ON user_info FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own info" ON user_info FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own info" ON user_info FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for user_messages
CREATE POLICY "Users can view own messages" ON user_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can insert messages" ON user_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view all messages" ON user_messages FOR SELECT USING (true);
