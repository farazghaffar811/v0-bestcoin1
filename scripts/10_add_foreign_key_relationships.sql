-- Add foreign key relationships for proper table joins

-- Add foreign key for orders.user_id -> profiles.id
ALTER TABLE orders 
ADD CONSTRAINT orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key for bank_details.user_id -> profiles.id  
ALTER TABLE bank_details
ADD CONSTRAINT bank_details_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key for withdrawals.user_id -> profiles.id
ALTER TABLE withdrawals
ADD CONSTRAINT withdrawals_user_id_fkey  
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
