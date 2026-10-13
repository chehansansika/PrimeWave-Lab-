'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  User,
  MapPin,
  XCircle,
  Eye,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';
import type { Reservation } from '@/types';
import { formatDate, formatTime, getCategoryLabel } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog } from '@/components/ui/dialog';
import { cancelReservation } from '@/lib/actions/reservations';
import { useToast } from '@/components/ui/toast';

interface AdminReservationsClientProps {
  initialReservations: Reservation[];
}

export function AdminReservationsClient({ initialReservations }: AdminReservationsClientProps) {
  const router = useRouter();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState('');

  // Cancel dialog state
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Detail dialog state
  const [inspectTarget, setInspectTarget] = useState<Reservation | null>(null);

  const filteredReservations = initialReservations.filter((res) => {
    // Status filter
    if (statusFilter !== 'all' && res.status !== statusFilter) {
      return false;
    }

    // Date filter
    if (dateFilter) {
      const resDate = res.start_time.split('T')[0];
      if (resDate !== dateFilter) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const resourceName = res.resource?.name?.toLowerCase() || '';
      const employeeName = res.profile?.full_name?.toLowerCase() || '';
      const purpose = res.purpose?.toLowerCase() || '';
      if (!resourceName.includes(q) && !employeeName.includes(q) && !purpose.includes(q)) {
        return false;
      }
    }

    return true;
  });

  const handleAdminCancel = async () => {
    if (!cancelTarget) return;

    setCancelling(true);
    try {
      const res = await cancelReservation(cancelTarget.id);
      if (res.success) {
        addToast('success', 'Reservation cancelled by administrator.');
        router.refresh();
      } else {
        addToast('error', res.message);
      }
    } catch {
      addToast('error', 'Failed to cancel reservation.');
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
          <ShieldAlert className="w-4 h-4" />
          <span>Administrative Control</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Reservations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Full oversight of all resource schedules, employee bookings, conflict reviews, and cancellation controls.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              className="input pl-9 text-xs"
              placeholder="Search by employee, resource name, or purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              className="input text-xs"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | 'confirmed' | 'cancelled')
              }
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed Only</option>
              <option value="cancelled">Cancelled Only</option>
            </select>
          </div>

          {/* Date Picker Filter */}
          <div>
            <input
              type="date"
              className="input text-xs"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              title="Filter by specific date"
            />
          </div>
        </div>

        {dateFilter && (
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Filtering reservations on {dateFilter}</span>
            <button
              onClick={() => setDateFilter('')}
              className="text-blue-600 hover:underline font-medium"
            >
              Clear date filter
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {filteredReservations.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No reservations found"
          description="No organizational reservations match your current filters and search terms."
        />
      ) : (
        <div className="table-container shadow-sm">
          <table>
            <thead>
              <tr>
                <th>Resource & Details</th>
                <th>Employee / Booker</th>
                <th>Scheduled Time</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id} className="transition-colors">
                  <td>
                    <div className="font-semibold text-slate-900">
                      {reservation.resource?.name || 'Resource'}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-medium">
                        {reservation.resource?.category
                          ? getCategoryLabel(reservation.resource.category)
                          : 'General'}
                      </span>
                      {reservation.resource?.location && (
                        <span>{reservation.resource.location}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800">
                        {reservation.profile?.full_name || 'Member'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs truncate">
                      Purpose: {reservation.purpose || 'None'}
                    </p>
                  </td>
                  <td>
                    <div className="text-xs font-semibold text-slate-800">
                      {formatDate(reservation.start_time)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {formatTime(reservation.start_time)} &ndash; {formatTime(reservation.end_time)}
                    </div>
                  </td>
                  <td>
                    <Badge status={reservation.status} />
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setInspectTarget(reservation)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {reservation.status === 'confirmed' && (
                        <button
                          onClick={() => setCancelTarget(reservation)}
                          className="btn btn-secondary btn-sm text-xs py-1 px-2.5 text-red-600 hover:bg-red-50 hover:border-red-200"
                          title="Administrative Cancel"
                        >
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin Cancel Confirmation Dialog */}
      <Dialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Administrative Cancellation"
        description={
          cancelTarget
            ? `As an administrator, are you sure you want to cancel the reservation booked by ${
                cancelTarget.profile?.full_name || 'the employee'
              } for "${cancelTarget.resource?.name}" on ${formatDate(
                cancelTarget.start_time
              )}? This will release the time slot immediately.`
            : ''
        }
        confirmLabel="Cancel Reservation"
        confirmVariant="danger"
        onConfirm={handleAdminCancel}
        loading={cancelling}
      />

      {/* Inspection Modal */}
      <Dialog
        open={!!inspectTarget}
        onClose={() => setInspectTarget(null)}
        title="Admin Reservation Details"
      >
        {inspectTarget && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Booked By</span>
                <span className="font-semibold text-slate-900">
                  {inspectTarget.profile?.full_name || 'Organization Member'}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Resource</span>
                <span className="font-semibold text-slate-900">
                  {inspectTarget.resource?.name}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Location</span>
                <span className="font-medium text-slate-800">
                  {inspectTarget.resource?.location}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Scheduled Time</span>
                <span className="font-medium text-slate-800">
                  {formatDate(inspectTarget.start_time)} ({formatTime(inspectTarget.start_time)} &ndash; {formatTime(inspectTarget.end_time)})
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Status</span>
                <Badge status={inspectTarget.status} />
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Purpose / Notes:</span>
                <p className="p-2.5 rounded bg-white border border-slate-200 text-slate-800">
                  {inspectTarget.purpose || 'None'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectTarget(null)}
                className="btn btn-secondary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
