-- Update bank_details table to use Indian bank fields
-- Rename account_holder_name to holder_name
-- Rename bind_bank to bank_name
-- Rename bank_card_number to account_number
-- Add ifsc_code field

-- Add new columns if they don't exist
ALTER TABLE bank_details ADD COLUMN IF NOT EXISTS holder_name VARCHAR(255);
ALTER TABLE bank_details ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);
ALTER TABLE bank_details ADD COLUMN IF NOT EXISTS account_number VARCHAR(20);
ALTER TABLE bank_details ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(20);

-- Copy data from old columns to new columns
UPDATE bank_details SET holder_name = account_holder_name WHERE holder_name IS NULL;
UPDATE bank_details SET bank_name = bind_bank WHERE bank_name IS NULL;
UPDATE bank_details SET account_number = bank_card_number WHERE account_number IS NULL;

-- Make new columns NOT NULL after data migration
ALTER TABLE bank_details ALTER COLUMN holder_name SET DEFAULT '';
ALTER TABLE bank_details ALTER COLUMN bank_name SET DEFAULT '';
ALTER TABLE bank_details ALTER COLUMN account_number SET DEFAULT '';
ALTER TABLE bank_details ALTER COLUMN ifsc_code SET DEFAULT '';
