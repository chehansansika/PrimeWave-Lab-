-- ============================================================================
-- Resource Reservation Management System - Database Schema
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('administrator', 'employee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on role for filtering
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- ============================================================================
-- 2. RESOURCES TABLE
-- ============================================================================

CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('conference_room', 'meeting_room', 'projector', 'laptop', 'other')),
  location TEXT NOT NULL DEFAULT '',
  capacity INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on status for filtering active resources
CREATE INDEX idx_resources_status ON public.resources(status);
CREATE INDEX idx_resources_category ON public.resources(category);

-- ============================================================================
-- 3. RESERVATIONS TABLE
-- ============================================================================

CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  purpose TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure end_time is after start_time
  CONSTRAINT check_time_order CHECK (end_time > start_time)
);

-- Exclusion constraint to prevent overlapping CONFIRMED reservations for the same resource
-- Cancelled reservations are excluded from conflict checks
ALTER TABLE public.reservations
  ADD CONSTRAINT no_overlapping_confirmed_reservations
  EXCLUDE USING gist (
    resource_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
  WHERE (status = 'confirmed');

-- Indexes for common queries
CREATE INDEX idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX idx_reservations_resource_id ON public.reservations(resource_id);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_reservations_times ON public.reservations(resource_id, start_time, end_time);

-- ============================================================================
-- 4. FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for resources
CREATE TRIGGER on_resource_updated
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for reservations
CREATE TRIGGER on_reservation_updated
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'employee'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to create a reservation atomically
-- This validates the resource is active, times are in the future,
-- and lets the exclusion constraint catch overlaps
CREATE OR REPLACE FUNCTION public.create_reservation(
  p_user_id UUID,
  p_resource_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_purpose TEXT
)
RETURNS JSON AS $$
DECLARE
  v_resource_status TEXT;
  v_reservation_id UUID;
BEGIN
  -- Validate time order
  IF p_end_time <= p_start_time THEN
    RETURN json_build_object('success', false, 'message', 'End time must be after start time');
  END IF;

  -- Validate not in the past
  IF p_start_time < NOW() THEN
    RETURN json_build_object('success', false, 'message', 'Cannot create reservations in the past');
  END IF;

  -- Check resource exists and is active
  SELECT status INTO v_resource_status
  FROM public.resources
  WHERE id = p_resource_id;

  IF v_resource_status IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Resource not found');
  END IF;

  IF v_resource_status != 'active' THEN
    RETURN json_build_object('success', false, 'message', 'This resource is currently inactive and cannot be reserved');
  END IF;

  -- Insert the reservation (exclusion constraint will reject overlaps)
  BEGIN
    INSERT INTO public.reservations (user_id, resource_id, start_time, end_time, purpose, status)
    VALUES (p_user_id, p_resource_id, p_start_time, p_end_time, p_purpose, 'confirmed')
    RETURNING id INTO v_reservation_id;

    RETURN json_build_object('success', true, 'message', 'Reservation created successfully', 'reservation_id', v_reservation_id);
  EXCEPTION
    WHEN exclusion_violation THEN
      RETURN json_build_object('success', false, 'message', 'This time slot conflicts with an existing reservation. Please choose a different time.');
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- ── Profiles RLS ──

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'administrator'
    )
  );

-- Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- ── Resources RLS ──

-- All authenticated users can view resources
CREATE POLICY "Authenticated users can view resources"
  ON public.resources FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can create resources
CREATE POLICY "Admins can create resources"
  ON public.resources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'administrator'
    )
  );

-- Only admins can update resources
CREATE POLICY "Admins can update resources"
  ON public.resources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'administrator'
    )
  );

-- ── Reservations RLS ──

-- Users can view their own reservations
CREATE POLICY "Users can view own reservations"
  ON public.reservations FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all reservations
CREATE POLICY "Admins can view all reservations"
  ON public.reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'administrator'
    )
  );

-- Authenticated users can create reservations (for themselves)
CREATE POLICY "Users can create own reservations"
  ON public.reservations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can cancel their own confirmed reservations
CREATE POLICY "Users can cancel own reservations"
  ON public.reservations FOR UPDATE
  USING (auth.uid() = user_id AND status = 'confirmed')
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- Admins can update any reservation
CREATE POLICY "Admins can update any reservation"
  ON public.reservations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'administrator'
    )
  );
