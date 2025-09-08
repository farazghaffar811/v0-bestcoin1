-- Create orders table for trading system
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL DEFAULT 'BTC/USDT',
  direction TEXT NOT NULL CHECK (direction IN ('buy_up', 'buy_down')),
  entry_price DECIMAL(20, 8) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  trading_time INTEGER NOT NULL, -- in seconds (60, 120, 180)
  profit_percentage DECIMAL(5, 2) NOT NULL, -- 20.00, 30.00, 50.00
  expected_earnings DECIMAL(20, 8) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  result TEXT CHECK (result IN ('win', 'loss', 'pending')),
  close_price DECIMAL(20, 8),
  actual_earnings DECIMAL(20, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_expires_at ON orders(expires_at);
