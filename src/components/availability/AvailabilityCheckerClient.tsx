'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarPlus,
  MapPin,
  Users,
  Loader2,
} from 'lucide-react';
import { getAvailableResources, getResourceReservations } from '@/lib/actions/reservations';
import { getTodayString, getCategoryLabel, formatTime, generateTimeSlots } from '@/lib/utils';
import type { Resource, Reservation } from '@/types';

interface AvailableResourceItem extends Resource {
  is_available: boolean;
}

interface AvailabilityCheckerClientProps {
  allResources: Resource[];
}

export function AvailabilityCheckerClient({ allResources }: AvailabilityCheckerClientProps) {
  const timeSlots = generateTimeSlots();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<AvailableResourceItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Selected resource for detailed daily schedule inspection
  const [inspectedResource, setInspectedResource] = useState<Resource | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState<boolean>(false);
  const [dailySchedule, setDailySchedule] = useState<Reservation[]>([]);

  const fetchAvailability = useCallback(async () => {
    setErrorMessage('');

    if (endTime <= startTime) {
      setErrorMessage('End time must be after start time.');
      return;
    }

    setLoading(true);
    try {
      const data = await getAvailableResources(selectedDate, startTime, endTime);
      setResults(data as AvailableResourceItem[]);
    } catch {
      setErrorMessage('Failed to fetch availability for the selected time window.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, startTime, endTime]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // When inspected resource or date changes, fetch its reservations for the day
  useEffect(() => {
    if (!inspectedResource) {
      setDailySchedule([]);
      return;
    }

    const loadSchedule = async () => {
      setScheduleLoading(true);
      try {
        const schedule = await getResourceReservations(inspectedResource.id, selectedDate);
        setDailySchedule(schedule);
      } catch {
        setDailySchedule([]);
      } finally {
        setScheduleLoading(false);
      }
    };

    loadSchedule();
  }, [inspectedResource, selectedDate]);

  const inactiveResources = allResources.filter((r) => r.status === 'inactive');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resource Availability Checker</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pick a date and time slot to verify which rooms and equipment are free for your reservation.
        </p>
      </div>

      {/* Date & Time Picker Controls */}
      <div className="card p-6 border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 items-end">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Reservation Date
            </label>
            <input
              type="date"
              className="input text-sm"
              value={selectedDate}
              min={getTodayString()}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Start Time
            </label>
            <select
              className="input text-sm"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          {/* End Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              End Time
            </label>
            <select
              className="input text-sm"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Action */}
          <div>
            <button
              onClick={fetchAvailability}
              disabled={loading}
              className="btn btn-primary w-full text-sm py-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {loading ? 'Checking...' : 'Check Availability'}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Main Content Area: Status Cards Grid + Schedule Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Active Resources ({results.length})
            </h2>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Available ({results.filter((r) => r.is_available).length})
              </div>
              <div className="flex items-center gap-1 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Reserved ({results.filter((r) => !r.is_available).length})
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 card">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
              <p className="text-sm font-medium">Checking time slots against database...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm">
              No active resources configured in system.
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((resource) => (
                <div
                  key={resource.id}
                  className={`card p-4.5 border transition-all duration-150 ${
                    inspectedResource?.id === resource.id
                      ? 'ring-2 ring-blue-600 border-transparent shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="font-semibold text-slate-900 text-base">
                          {resource.name}
                        </span>
                        {resource.is_available ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3.5 h-3.5" />
                            Reserved
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded">
                          {getCategoryLabel(resource.category)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {resource.location}
                        </span>
                        {resource.capacity && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            Capacity: {resource.capacity}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setInspectedResource(resource)}
                        className="btn btn-secondary btn-sm text-xs"
                      >
                        View Schedule
                      </button>

                      {resource.is_available && (
                        <Link
                          href={`/reservations/new?resourceId=${resource.id}&date=${selectedDate}&start=${startTime}&end=${endTime}`}
                          className="btn btn-primary btn-sm text-xs"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          Book Slot
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inactive Resources Subsection */}
          {inactiveResources.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Inactive Resources ({inactiveResources.length}) &mdash; Unavailable for Booking
              </h3>
              <div className="space-y-2">
                {inactiveResources.map((res) => (
                  <div
                    key={res.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs text-slate-500 opacity-70"
                  >
                    <div>
                      <span className="font-medium text-slate-700">{res.name}</span> &bull;{' '}
                      {res.location}
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-medium text-[11px]">
                      Deactivated
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Schedule Inspector (1 col) */}
        <div>
          <div className="card p-5 sticky top-20 border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              {inspectedResource ? `Daily Schedule: ${inspectedResource.name}` : 'Day Schedule Inspector'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {inspectedResource
                ? `Confirmed reservations for ${selectedDate}`
                : 'Select "View Schedule" on any resource to view its booked timeline.'}
            </p>

            {inspectedResource ? (
              scheduleLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  <p className="text-xs">Loading schedule...</p>
                </div>
              ) : dailySchedule.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500 mb-1.5" />
                  <p className="text-xs font-semibold text-slate-800">Completely Open!</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    No reservations booked yet on this date.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dailySchedule.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/60 text-xs"
                    >
                      <div className="flex items-center justify-between font-semibold text-blue-900">
                        <span>
                          {formatTime(booking.start_time)} &ndash; {formatTime(booking.end_time)}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide bg-blue-200/70 text-blue-800 px-1.5 py-0.5 rounded">
                          Booked
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium mt-1 truncate">
                        {booking.purpose || 'Reserved'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        By {(booking.profile as { full_name?: string })?.full_name || 'Organization Member'}
                      </p>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                <Clock className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Select a resource from the list to view its booked hours</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
