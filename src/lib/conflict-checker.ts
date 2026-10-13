import type { Reservation, Resource } from '@/types';

export interface BookingSlot {
  resource_id: string;
  start_time: string;
  end_time: string;
}

/**
 * Checks whether two time ranges overlap.
 * Time ranges are treated as half-open intervals [start, end)
 * Therefore: Adjacent intervals like [10:00, 11:00) and [11:00, 12:00) do NOT overlap.
 */
export function doIntervalsOverlap(
  startA: string | Date,
  endA: string | Date,
  startB: string | Date,
  endB: string | Date
): boolean {
  const aStart = new Date(startA).getTime();
  const aEnd = new Date(endA).getTime();
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();

  return aStart < bEnd && aEnd > bStart;
}

/**
 * Evaluates whether a candidate reservation conflicts with existing bookings.
 * Cancelled bookings are ignored.
 * Different resources do not conflict.
 */
export function hasBookingConflict(
  candidate: BookingSlot,
  existingReservations: Reservation[]
): { hasConflict: boolean; conflictingWith?: Reservation } {
  for (const existing of existingReservations) {
    // Cancelled reservations never conflict
    if (existing.status === 'cancelled') {
      continue;
    }

    // Different resources never conflict with each other
    if (existing.resource_id !== candidate.resource_id) {
      continue;
    }

    // Check time interval overlap
    if (doIntervalsOverlap(candidate.start_time, candidate.end_time, existing.start_time, existing.end_time)) {
      return { hasConflict: true, conflictingWith: existing };
    }
  }

  return { hasConflict: false };
}

/**
 * Checks if a resource can be reserved based on active status.
 */
export function canResourceBeReserved(resource: Resource): { allowed: boolean; reason?: string } {
  if (resource.status !== 'active') {
    return {
      allowed: false,
      reason: 'This resource is currently inactive and cannot be reserved',
    };
  }
  return { allowed: true };
}
