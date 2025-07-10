-- Add email field to hire table
ALTER TABLE hire ADD COLUMN email TEXT;

-- Add comment for the new column
COMMENT ON COLUMN hire.email IS 'Email address of the new hire'; 