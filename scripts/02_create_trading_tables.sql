-- Create trading history table
CREATE TABLE IF NOT EXISTS public.trading_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('buy', 'sell')),
  price DECIMAL(20, 8) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  total_amount DECIMAL(20, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.trading_history ENABLE ROW LEVEL SECURITY;

-- Create policies for trading history
CREATE POLICY "Users can view own trading history" ON public.trading_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON public.trading_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferred_currency TEXT DEFAULT 'USDT',
  notifications_enabled BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
