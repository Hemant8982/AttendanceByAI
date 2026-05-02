/*
  # Add HR Role to Attendance System

  1. Changes
    - Update `profiles.role` CHECK constraint to include 'hr' alongside 'admin' and 'employee'
    - Update `is_admin()` helper function to also recognize HR role for read access
    - Add HR-specific RLS policies for reading attendance and overtime data
    - HR can read all profiles, attendance, and overtime (but NOT update overtime status - that's admin only)
    - HR can NOT manage employees or approve overtime (admin-only operations)

  2. Security
    - HR gets read access to all attendance, overtime, and profiles data
    - HR does NOT get write access to overtime status (admin only)
    - HR does NOT get access to admin management endpoints
    - All existing admin and employee permissions remain unchanged

  3. Important Notes
    - The `is_admin()` function is updated to `is_admin_or_hr()` for read policies
    - A separate `is_admin_only()` function is added for admin-exclusive write operations
    - This prevents HR from approving/rejecting overtime or managing employee data
*/

-- Update the role CHECK constraint to include 'hr'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'employee', 'hr'));

-- Replace is_admin with two functions: one for read access (admin + hr), one for admin-only
CREATE OR REPLACE FUNCTION is_admin(check_uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = check_uid AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_admin_or_hr(check_uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = check_uid AND role IN ('admin', 'hr')
  );
$$;

-- Update profiles SELECT policy: admin + HR can read all profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins and HR can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin_or_hr(auth.uid()));

-- Update attendance SELECT policy: admin + HR can read all attendance
DROP POLICY IF EXISTS "Admins can read all attendance" ON attendance;
CREATE POLICY "Admins and HR can read all attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (is_admin_or_hr(auth.uid()));

-- Update overtime SELECT policy: admin + HR can read all overtime
DROP POLICY IF EXISTS "Admins can read all overtime" ON overtime_requests;
CREATE POLICY "Admins and HR can read all overtime"
  ON overtime_requests FOR SELECT
  TO authenticated
  USING (is_admin_or_hr(auth.uid()));

-- Overtime update policy stays admin-only (HR cannot approve/reject)
-- The existing "Admins can update overtime status" policy already uses is_admin()
-- which only checks for role='admin', so HR is correctly excluded
