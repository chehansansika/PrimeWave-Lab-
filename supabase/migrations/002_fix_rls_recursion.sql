-- ============================================================================
-- FIX: Profile RLS recursion issue
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- Step 1: Create a SECURITY DEFINER function to check user role
-- This bypasses RLS to avoid infinite recursion when checking roles in policies
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 2: Drop the old recursive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Step 3: Recreate policies using the SECURITY DEFINER function
-- Users can always read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all profiles (now using the safe function)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'administrator');

-- Step 4: Also fix any other policies that reference profiles recursively
-- Fix resources policies
DROP POLICY IF EXISTS "Admins can manage resources" ON public.resources;
CREATE POLICY "Admins can manage resources"
  ON public.resources FOR ALL
  USING (public.get_user_role(auth.uid()) = 'administrator')
  WITH CHECK (public.get_user_role(auth.uid()) = 'administrator');

-- Fix reservations admin policy
DROP POLICY IF EXISTS "Admins can view all reservations" ON public.reservations;
CREATE POLICY "Admins can view all reservations"
  ON public.reservations FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'administrator');

DROP POLICY IF EXISTS "Admins can update reservation status" ON public.reservations;
CREATE POLICY "Admins can update reservation status"
  ON public.reservations FOR UPDATE
  USING (public.get_user_role(auth.uid()) = 'administrator');
