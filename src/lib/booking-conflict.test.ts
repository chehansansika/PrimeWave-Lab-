import { describe, it, expect } from 'vitest';
import {
  doIntervalsOverlap,
  hasBookingConflict,
  canResourceBeReserved,
} from './conflict-checker';
import {
  validateResourceForm,
  validateReservationForm,
  validateEmail,
  validatePassword,
  validateFullName,
} from './validations/schemas';
import type { Reservation, Resource } from '@/types';

describe('Booking Conflict Prevention & Interval Logic', () => {
  it('detects overlapping reservations on the same resource', () => {
    const existing: Reservation[] = [
      {
        id: 'res-1',
        user_id: 'user-1',
        resource_id: 'room-1',
        start_time: '2026-10-15T10:00:00Z',
        end_time: '2026-10-15T11:00:00Z',
        purpose: 'Team Sync',
        status: 'confirmed',
        created_at: '2026-10-13T00:00:00Z',
        updated_at: '2026-10-13T00:00:00Z',
      },
    ];

    const overlappingCandidate = {
      resource_id: 'room-1',
      start_time: '2026-10-15T10:30:00Z',
      end_time: '2026-10-15T11:30:00Z',
    };

    const result = hasBookingConflict(overlappingCandidate, existing);
    expect(result.hasConflict).toBe(true);
    expect(result.conflictingWith?.id).toBe('res-1');
  });

  it('allows adjacent reservations without conflict (e.g. 10:00-11:00 and 11:00-12:00)', () => {
    const existing: Reservation[] = [
      {
        id: 'res-1',
        user_id: 'user-1',
        resource_id: 'room-1',
        start_time: '2026-10-15T10:00:00Z',
        end_time: '2026-10-15T11:00:00Z',
        purpose: 'Morning Session',
        status: 'confirmed',
        created_at: '2026-10-13T00:00:00Z',
        updated_at: '2026-10-13T00:00:00Z',
      },
    ];

    // Adjacent immediately after
    const adjacentAfter = {
      resource_id: 'room-1',
      start_time: '2026-10-15T11:00:00Z',
      end_time: '2026-10-15T12:00:00Z',
    };

    // Adjacent immediately before
    const adjacentBefore = {
      resource_id: 'room-1',
      start_time: '2026-10-15T09:00:00Z',
      end_time: '2026-10-15T10:00:00Z',
    };

    expect(hasBookingConflict(adjacentAfter, existing).hasConflict).toBe(false);
    expect(hasBookingConflict(adjacentBefore, existing).hasConflict).toBe(false);
  });

  it('allows different resources to be reserved at the exact same time', () => {
    const existing: Reservation[] = [
      {
        id: 'res-1',
        user_id: 'user-1',
        resource_id: 'room-1',
        start_time: '2026-10-15T10:00:00Z',
        end_time: '2026-10-15T11:00:00Z',
        purpose: 'Room 1 Session',
        status: 'confirmed',
        created_at: '2026-10-13T00:00:00Z',
        updated_at: '2026-10-13T00:00:00Z',
      },
    ];

    const differentResourceCandidate = {
      resource_id: 'room-2', // Different resource
      start_time: '2026-10-15T10:00:00Z',
      end_time: '2026-10-15T11:00:00Z',
    };

    const result = hasBookingConflict(differentResourceCandidate, existing);
    expect(result.hasConflict).toBe(false);
  });

  it('ensures cancelled reservations release their time slots and do not cause conflicts', () => {
    const existing: Reservation[] = [
      {
        id: 'res-cancelled',
        user_id: 'user-1',
        resource_id: 'room-1',
        start_time: '2026-10-15T10:00:00Z',
        end_time: '2026-10-15T11:00:00Z',
        purpose: 'Old Session',
        status: 'cancelled', // Cancelled!
        created_at: '2026-10-13T00:00:00Z',
        updated_at: '2026-10-13T00:00:00Z',
      },
    ];

    const candidate = {
      resource_id: 'room-1',
      start_time: '2026-10-15T10:00:00Z',
      end_time: '2026-10-15T11:00:00Z',
    };

    const result = hasBookingConflict(candidate, existing);
    expect(result.hasConflict).toBe(false);
  });

  it('rejects reservation attempts on inactive resources', () => {
    const activeResource: Resource = {
      id: 'r-1',
      name: 'Projector A',
      description: '',
      category: 'projector',
      location: 'Store 1',
      capacity: null,
      status: 'active',
      created_at: '2026-10-13T00:00:00Z',
      updated_at: '2026-10-13T00:00:00Z',
    };

    const inactiveResource: Resource = {
      ...activeResource,
      status: 'inactive',
    };

    expect(canResourceBeReserved(activeResource).allowed).toBe(true);
    expect(canResourceBeReserved(inactiveResource).allowed).toBe(false);
    expect(canResourceBeReserved(inactiveResource).reason).toContain('inactive');
  });
});

describe('Form Validation Logic', () => {
  it('validates reservation form and rejects end time before start time', () => {
    const futureDate = '2099-01-01';
    const errors = validateReservationForm({
      resource_id: 'res-1',
      date: futureDate,
      start_time: '14:00',
      end_time: '13:00', // invalid: earlier than start
      purpose: 'Design review',
    });

    expect(errors.some((e) => e.field === 'end_time')).toBe(true);
  });

  it('rejects reservations in the past', () => {
    const errors = validateReservationForm({
      resource_id: 'res-1',
      date: '2020-01-01', // Past date
      start_time: '10:00',
      end_time: '11:00',
      purpose: 'Old review',
    });

    expect(errors.some((e) => e.field === 'date')).toBe(true);
  });

  it('validates resource form required fields', () => {
    const errors = validateResourceForm({
      name: '',
      description: '',
      category: 'meeting_room',
      location: '',
      capacity: -5,
      status: 'active',
    });

    expect(errors.some((e) => e.field === 'name')).toBe(true);
    expect(errors.some((e) => e.field === 'location')).toBe(true);
    expect(errors.some((e) => e.field === 'capacity')).toBe(true);
  });

  it('validates email and password constraints', () => {
    expect(validateEmail('invalid-email')).not.toBeNull();
    expect(validateEmail('test@primewave.com')).toBeNull();

    expect(validatePassword('123')).not.toBeNull();
    expect(validatePassword('securePass123')).toBeNull();

    expect(validateFullName('')).not.toBeNull();
    expect(validateFullName('Jane Doe')).toBeNull();
  });
});
