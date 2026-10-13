import type { ResourceCategory, ReservationStatus, ResourceStatus } from '@/types';

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string to include time
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format time from a datetime string
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get a human-readable category label
 */
export function getCategoryLabel(category: ResourceCategory): string {
  const labels: Record<ResourceCategory, string> = {
    conference_room: 'Conference Room',
    meeting_room: 'Meeting Room',
    projector: 'Projector',
    laptop: 'Laptop',
    other: 'Other',
  };
  return labels[category] || category;
}

/**
 * Get a human-readable status label
 */
export function getStatusLabel(status: ResourceStatus | ReservationStatus): string {
  const labels: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

/**
 * Get status badge color classes
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-50 text-slate-600 border-slate-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
  };
  return colors[status] || 'bg-gray-50 text-gray-600 border-gray-200';
}

/**
 * Get category icon color
 */
export function getCategoryColor(category: ResourceCategory): string {
  const colors: Record<ResourceCategory, string> = {
    conference_room: 'bg-indigo-50 text-indigo-600',
    meeting_room: 'bg-sky-50 text-sky-600',
    projector: 'bg-amber-50 text-amber-600',
    laptop: 'bg-violet-50 text-violet-600',
    other: 'bg-slate-50 text-slate-600',
  };
  return colors[category] || 'bg-slate-50 text-slate-600';
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Combine date and time strings into an ISO datetime
 */
export function combineDateAndTime(date: string, time: string): string {
  return new Date(`${date}T${time}`).toISOString();
}

/**
 * Check if a reservation is cancellable (confirmed and in the future)
 */
export function isCancellable(status: ReservationStatus, startTime: string): boolean {
  return status === 'confirmed' && new Date(startTime) > new Date();
}

/**
 * Classify a reservation as upcoming, ongoing, or past
 */
export function getReservationTimeStatus(startTime: string, endTime: string): 'upcoming' | 'ongoing' | 'past' {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'ongoing';
  return 'past';
}

/**
 * Generate time slot options (30 min intervals)
 */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return slots;
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
