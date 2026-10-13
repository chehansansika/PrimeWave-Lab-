import type { ReservationFormData, ResourceFormData } from '@/types';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateResourceForm(data: ResourceFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name.trim()) {
    errors.push({ field: 'name', message: 'Resource name is required' });
  }

  if (!data.category) {
    errors.push({ field: 'category', message: 'Category is required' });
  }

  if (!data.location.trim()) {
    errors.push({ field: 'location', message: 'Location is required' });
  }

  if (data.capacity !== null && data.capacity !== undefined && data.capacity < 0) {
    errors.push({ field: 'capacity', message: 'Capacity must be a positive number' });
  }

  return errors;
}

export function validateReservationForm(data: ReservationFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.resource_id) {
    errors.push({ field: 'resource_id', message: 'Please select a resource' });
  }

  if (!data.date) {
    errors.push({ field: 'date', message: 'Date is required' });
  }

  if (!data.start_time) {
    errors.push({ field: 'start_time', message: 'Start time is required' });
  }

  if (!data.end_time) {
    errors.push({ field: 'end_time', message: 'End time is required' });
  }

  if (!data.purpose.trim()) {
    errors.push({ field: 'purpose', message: 'Purpose is required' });
  }

  if (data.date && data.start_time && data.end_time) {
    const startDateTime = new Date(`${data.date}T${data.start_time}`);
    const endDateTime = new Date(`${data.date}T${data.end_time}`);
    const now = new Date();

    if (endDateTime <= startDateTime) {
      errors.push({ field: 'end_time', message: 'End time must be after start time' });
    }

    if (startDateTime < now) {
      errors.push({ field: 'date', message: 'Cannot create reservations in the past' });
    }
  }

  return errors;
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

export function validateFullName(name: string): string | null {
  if (!name.trim()) return 'Full name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  return null;
}
