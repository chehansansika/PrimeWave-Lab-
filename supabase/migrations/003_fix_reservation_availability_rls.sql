-- ============================================================================
-- FIX: Allow authenticated users to view confirmed reservations
-- This ensures all users see real-time availability and schedules for resources
-- ============================================================================

-- Drop the old restricted policy
DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;

-- Allow all authenticated users to view confirmed reservations (for availability checks & schedule inspector)
-- while allowing users to still view their own reservations regardless of status (e.g., cancelled)
CREATE POLICY "Users can view reservations for availability"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (
    status = 'confirmed' 
    OR auth.uid() = user_id 
    OR public.get_user_role(auth.uid()) = 'administrator'
  );
