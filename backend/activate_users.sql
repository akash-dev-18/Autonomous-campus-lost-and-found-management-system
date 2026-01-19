-- Activate all users in the database
-- This fixes the 403 Forbidden error for existing users

UPDATE users SET is_active = TRUE WHERE is_active = FALSE;

-- Verify the update
SELECT id, email, full_name, is_active, created_at 
FROM users 
ORDER BY created_at DESC;
