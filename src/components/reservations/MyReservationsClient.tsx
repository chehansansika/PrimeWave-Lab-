'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Filter,
  Layers,
  MapPin,
  XCircle,
  PlusCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import type { Reservation } from '@/types';
import { formatDate, formatTime, getCategoryLabel, isCancellable } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog } from '@/components/ui/dialog';
import { cancelReservation } from '@/lib/actions/reservations';
import { useToast } from '@/components/ui/toast';

interface MyReservationsClientProps {
  initialReservations: Reservation[];
}

export function MyReservationsClient({ initialReservations }: MyReservationsClientProps) {
  const router = useRouter();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled' | 'all'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');

  // Cancel reservation dialog
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Detail inspection modal
  const [inspectTarget, setInspectTarget] = useState<Reservation | null>(null);

  const now = new Date();

  const filteredReservations = initialReservations.filter((res) => {
    const start = new Date(res.start_time);

    // Tab filter
    if (activeTab === 'upcoming') {
      if (res.status === 'cancelled' || start < now) return false;
    } else if (activeTab === 'past') {
      if (res.status === 'cancelled' || start >= now) return false;
    } else if (activeTab === 'cancelled') {
      if (res.status !== 'cancelled') return false;
    }

    // Search query filter
    const resourceName = res.resource?.name || '';
    const purpose = res.purpose || '';
    const matchesSearch =
      resourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purpose.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;

    setCancelling(true);
    try {
      const res = await cancelReservation(cancelTarget.id);
      if (res.success) {
        addToast('success', res.message);
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Reservations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your personal upcoming bookings, track past room usage, or cancel reservations.
          </p>
        </div>
        <Link href="/reservations/new" className="btn btn-primary btn-sm shrink-0">
          <PlusCircle className="w-4 h-4" />
          Book New Resource
        </Link>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'upcoming' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'past' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Past History
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'cancelled' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Cancelled
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'
            }`}
          >
            All Bookings
          </button>
        </div>

        {/* Quick Search */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            className="input text-xs py-1.5"
            placeholder="Search my bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Reservations List */}
      {filteredReservations.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={
            activeTab === 'upcoming'
              ? 'No upcoming reservations'
              : activeTab === 'past'
              ? 'No past reservations'
              : activeTab === 'cancelled'
              ? 'No cancelled reservations'
              : 'No reservations found'
          }
          description={
            activeTab === 'upcoming'
              ? 'You do not have any scheduled reservations. Book a meeting room or equipment to get started.'
              : 'No reservations matching the selected filter criteria were found.'
          }
          actionLabel={activeTab === 'upcoming' ? 'Book Resource' : undefined}
          actionHref="/reservations/new"
        />
      ) : (
        <div className="table-container shadow-sm">
          <table>
            <thead>
              <tr>
                <th>Resource</th>
                <th>Date & Time</th>
                <th>Purpose</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((reservation) => {
                const canCancel = isCancellable(reservation.status, reservation.start_time);

                return (
                  <tr key={reservation.id} className="transition-colors">
                    <td>
                      <div className="font-semibold text-slate-900">
                        {reservation.resource?.name || 'Unnamed Resource'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-medium text-slate-700">
                          {reservation.resource?.category
                            ? getCategoryLabel(reservation.resource.category)
                            : 'Resource'}
                        </span>
                        {reservation.resource?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {reservation.resource.location}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm font-medium text-slate-800">
                        {formatDate(reservation.start_time)}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {formatTime(reservation.start_time)} &ndash;{' '}
                          {formatTime(reservation.end_time)}
                        </span>
                      </div>
                    </td>
                    <td className="max-w-xs">
                      <p className="text-sm text-slate-700 truncate font-medium">
                        {reservation.purpose || 'No purpose recorded'}
                      </p>
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

                        {canCancel && (
                          <button
                            onClick={() => setCancelTarget(reservation)}
                            className="btn btn-secondary btn-sm text-xs py-1 px-2.5 text-red-600 hover:bg-red-50 hover:border-red-200"
                            title="Cancel Reservation"
                          >
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel This Reservation?"
        description={
          cancelTarget
            ? `Are you sure you want to cancel your reservation for "${cancelTarget.resource?.name}" on ${formatDate(
                cancelTarget.start_time
              )}? This time slot will immediately become free for other teammates.`
            : ''
        }
        confirmLabel="Yes, Cancel Booking"
        confirmVariant="danger"
        onConfirm={handleConfirmCancel}
        loading={cancelling}
      />

      {/* Details Dialog */}
      <Dialog
        open={!!inspectTarget}
        onClose={() => setInspectTarget(null)}
        title="Reservation Details"
      >
        {inspectTarget && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
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
                <span className="text-slate-500">Date</span>
                <span className="font-medium text-slate-800">
                  {formatDate(inspectTarget.start_time)}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Time Interval</span>
                <span className="font-medium text-slate-800">
                  {formatTime(inspectTarget.start_time)} &ndash; {formatTime(inspectTarget.end_time)}
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
