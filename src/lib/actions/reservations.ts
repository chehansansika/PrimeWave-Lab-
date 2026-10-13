'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse, ReservationFormData, ResourceCategory } from '@/types';
import { validateReservationForm } from '@/lib/validations/schemas';
import { combineDateAndTime } from '@/lib/utils';

export async function createReservation(data: ReservationFormData): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: 'Not authenticated' };
    }

    // Server-side validation
    const errors = validateReservationForm(data);
    if (errors.length > 0) {
      return { success: false, message: errors[0].message };
    }

    const startTime = combineDateAndTime(data.date, data.start_time);
    const endTime = combineDateAndTime(data.date, data.end_time);

    // Call the database function for atomic reservation creation
    const { data: result, error } = await supabase.rpc('create_reservation', {
      p_user_id: user.id,
      p_resource_id: data.resource_id,
      p_start_time: startTime,
      p_end_time: endTime,
      p_purpose: data.purpose.trim(),
    });

    if (error) {
      return { success: false, message: error.message };
    }

    if (result && !result.success) {
      return { success: false, message: result.message };
    }

    return {
      success: true,
      message: 'Reservation created successfully!',
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create reservation',
    };
  }
}

export async function cancelReservation(reservationId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: 'Not authenticated' };
    }

    // Check if the reservation belongs to the user or if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const { data: reservation } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (!reservation) {
      return { success: false, message: 'Reservation not found' };
    }

    if (reservation.user_id !== user.id && profile?.role !== 'administrator') {
      return { success: false, message: 'You are not authorized to cancel this reservation' };
    }

    if (reservation.status === 'cancelled') {
      return { success: false, message: 'This reservation is already cancelled' };
    }

    if (new Date(reservation.start_time) < new Date() && profile?.role !== 'administrator') {
      return { success: false, message: 'Cannot cancel past reservations' };
    }

    const { error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Reservation cancelled successfully' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to cancel reservation',
    };
  }
}

export async function getMyReservations(filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('reservations')
    .select('*, resource:resources(*)')
    .eq('user_id', user.id)
    .order('start_time', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.dateFrom) {
    query = query.gte('start_time', `${filters.dateFrom}T00:00:00`);
  }

  if (filters?.dateTo) {
    query = query.lte('start_time', `${filters.dateTo}T23:59:59`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getAllReservations(filters?: {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const supabase = await createClient();

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'administrator') return [];

  let query = supabase
    .from('reservations')
    .select('*, resource:resources(*), profile:profiles(*)')
    .order('start_time', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.dateFrom) {
    query = query.gte('start_time', `${filters.dateFrom}T00:00:00`);
  }

  if (filters?.dateTo) {
    query = query.lte('start_time', `${filters.dateTo}T23:59:59`);
  }

  const { data, error } = await query;

  if (error) throw error;

  let results = data || [];

  // Client-side search filter for employee name or resource name
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter(
      (r) =>
        r.resource?.name?.toLowerCase().includes(searchLower) ||
        r.profile?.full_name?.toLowerCase().includes(searchLower)
    );
  }

  return results;
}

export async function getAvailableResources(date: string, startTime: string, endTime: string) {
  const supabase = await createClient();

  const startDateTime = combineDateAndTime(date, startTime);
  const endDateTime = combineDateAndTime(date, endTime);

  // Get all active resources
  const { data: resources, error: resourceError } = await supabase
    .from('resources')
    .select('*')
    .eq('status', 'active')
    .order('name');

  if (resourceError) throw resourceError;

  // Get confirmed reservations that overlap with the requested time
  const { data: conflicting, error: conflictError } = await supabase
    .from('reservations')
    .select('resource_id')
    .eq('status', 'confirmed')
    .lt('start_time', endDateTime)
    .gt('end_time', startDateTime);

  if (conflictError) throw conflictError;

  const conflictingIds = new Set((conflicting || []).map((r) => r.resource_id));

  return (resources || []).map((resource) => ({
    ...resource,
    is_available: !conflictingIds.has(resource.id),
  }));
}

export async function getResourceReservations(resourceId: string, date: string) {
  const supabase = await createClient();

  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  const { data, error } = await supabase
    .from('reservations')
    .select('*, profile:profiles(full_name)')
    .eq('resource_id', resourceId)
    .eq('status', 'confirmed')
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .order('start_time');

  if (error) throw error;
  return data || [];
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00';
  const todayEnd = new Date().toISOString().split('T')[0] + 'T23:59:59';

  // Total resources
  const { count: totalResources } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true });

  // Active resources
  const { count: activeResources } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Today's reservations
  const { count: todaysReservations } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed')
    .gte('start_time', todayStart)
    .lte('start_time', todayEnd);

  // Upcoming reservations
  const { count: upcomingReservations } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed')
    .gte('start_time', now);

  // Recent activity
  const { data: recentActivity } = await supabase
    .from('reservations')
    .select('*, resource:resources(name, category), profile:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(10);

  // Resource utilization (most booked resources in the last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: utilization } = await supabase
    .from('reservations')
    .select('resource_id, resource:resources(name, category), start_time, end_time')
    .eq('status', 'confirmed')
    .gte('start_time', thirtyDaysAgo.toISOString());

  // Aggregate utilization
  const utilizationMap = new Map<string, { name: string; category: ResourceCategory; count: number; hours: number }>();
  (utilization || []).forEach((r) => {
    const resObj = r.resource as unknown as { name?: string; category?: ResourceCategory } | null;
    const existing = utilizationMap.get(r.resource_id) || {
      name: resObj?.name || '',
      category: (resObj?.category as ResourceCategory) || 'other',
      count: 0,
      hours: 0,
    };
    const hours = (new Date(r.end_time).getTime() - new Date(r.start_time).getTime()) / (1000 * 60 * 60);
    existing.count += 1;
    existing.hours += hours;
    utilizationMap.set(r.resource_id, existing);
  });

  const topResources = Array.from(utilizationMap.entries())
    .map(([id, data]) => ({
      resource_id: id,
      resource_name: data.name,
      category: data.category,
      total_reservations: data.count,
      total_hours: Math.round(data.hours * 10) / 10,
    }))
    .sort((a, b) => b.total_reservations - a.total_reservations)
    .slice(0, 5);

  return {
    stats: {
      total_resources: totalResources || 0,
      active_resources: activeResources || 0,
      todays_reservations: todaysReservations || 0,
      upcoming_reservations: upcomingReservations || 0,
    },
    recentActivity: (recentActivity || []).map((a) => {
      const resObj = a.resource as unknown as { name?: string; category?: string } | null;
      const profObj = a.profile as unknown as { full_name?: string } | null;
      return {
        id: a.id,
        resource_name: resObj?.name || '',
        user_name: profObj?.full_name || '',
        start_time: a.start_time,
        end_time: a.end_time,
        status: a.status,
        created_at: a.created_at,
        purpose: a.purpose,
      };
    }),
    topResources,
  };
}
