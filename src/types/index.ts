// ─── User & Auth Types ───────────────────────────────────────────────

export type UserRole = 'administrator' | 'employee';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

// ─── Resource Types ──────────────────────────────────────────────────

export type ResourceStatus = 'active' | 'inactive';

export type ResourceCategory = 'conference_room' | 'meeting_room' | 'projector' | 'laptop' | 'other';

export const RESOURCE_CATEGORIES: { value: ResourceCategory; label: string }[] = [
  { value: 'conference_room', label: 'Conference Room' },
  { value: 'meeting_room', label: 'Meeting Room' },
  { value: 'projector', label: 'Projector' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'other', label: 'Other' },
];

export interface Resource {
  id: string;
  name: string;
  description: string;
  category: ResourceCategory;
  location: string;
  capacity: number | null;
  status: ResourceStatus;
  created_at: string;
  updated_at: string;
}

export interface ResourceFormData {
  name: string;
  description: string;
  category: ResourceCategory;
  location: string;
  capacity: number | null;
  status: ResourceStatus;
}

// ─── Reservation Types ──────────────────────────────────────────────

export type ReservationStatus = 'confirmed' | 'cancelled';

export interface Reservation {
  id: string;
  user_id: string;
  resource_id: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
  // Joined fields
  resource?: Resource;
  profile?: Profile;
}

export interface ReservationFormData {
  resource_id: string;
  date: string;
  start_time: string;
  end_time: string;
  purpose: string;
}

// ─── Dashboard Types ────────────────────────────────────────────────

export interface DashboardStats {
  total_resources: number;
  active_resources: number;
  todays_reservations: number;
  upcoming_reservations: number;
}

export interface ResourceUtilization {
  resource_id: string;
  resource_name: string;
  category: ResourceCategory;
  total_reservations: number;
  total_hours: number;
}

export interface RecentActivity {
  id: string;
  resource_name: string;
  user_name: string;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  created_at: string;
  purpose: string;
}

// ─── Form & UI Types ────────────────────────────────────────────────

export interface ActionResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface FilterParams {
  search?: string;
  category?: ResourceCategory | '';
  status?: ResourceStatus | ReservationStatus | '';
  dateFrom?: string;
  dateTo?: string;
}
