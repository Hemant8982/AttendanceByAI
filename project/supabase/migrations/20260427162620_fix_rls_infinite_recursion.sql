/*
  # Fix infinite recursion in RLS policies

  1. Problem
    - The "Admins can read all profiles" policy on `profiles` table
      queries `profiles` inside a policy that's evaluating on `profiles`,
      causing infinite recursion (error 42P17).

  2. Solution
    - Drop the recursive policies on `profiles`
    - Replace with a security definer function `is_admin()` that checks
      the role without triggering RLS recursion
    - Recreate policies using the helper function

  3. Security
    - The `is_admin()` function is SECURITY DEFINER so it bypasses RLS
      when checking the role, breaking the recursion
    - All other policies remain unchanged
*/

-- Create a security definer function to check admin role without RLS recursion
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

-- Drop the recursive policies on profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Recreate profiles SELECT policies using the helper function
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Also fix attendance and overtime policies that have the same recursion risk
DROP POLICY IF EXISTS "Admins can read all attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can read all overtime" ON overtime_requests;

CREATE POLICY "Admins can read all attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can read all overtime"
  ON overtime_requests FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Fix the overtime update policy too
DROP POLICY IF EXISTS "Admins can update overtime status" ON overtime_requests;

CREATE POLICY "Admins can update overtime status"
  ON overtime_requests FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
