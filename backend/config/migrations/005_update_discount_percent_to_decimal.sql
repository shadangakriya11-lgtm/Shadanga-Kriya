-- Update discount_percent to support decimal values like 52.8%

-- Drop the old constraint
ALTER TABLE discount_codes DROP CONSTRAINT IF EXISTS discount_codes_discount_percent_check;

-- Change column type to DECIMAL(5,2) to support values like 52.80
ALTER TABLE discount_codes 
ALTER COLUMN discount_percent TYPE DECIMAL(5,2);

-- Add new constraint for decimal values (0.01 to 100.00)
ALTER TABLE discount_codes 
ADD CONSTRAINT discount_codes_discount_percent_check 
CHECK (discount_percent > 0 AND discount_percent <= 100);
