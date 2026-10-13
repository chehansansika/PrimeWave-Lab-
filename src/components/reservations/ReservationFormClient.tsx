'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Layers,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CalendarCheck2,
} from 'lucide-react';
import { createReservation } from '@/lib/actions/reservations';
import { validateReservationForm } from '@/lib/validations/schemas';
import { getTodayString, generateTimeSlots, getCategoryLabel, formatDate, formatTime } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import type { Resource, ReservationFormData } from '@/types';

interface ReservationFormClientProps {
  resources: Resource[];
}

export function ReservationFormClient({ resources }: ReservationFormClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const initialResourceId = searchParams.get('resourceId') || (resources[0]?.id || '');
  const initialDate = searchParams.get('date') || getTodayString();
  const initialStart = searchParams.get('start') || '09:00';
  const initialEnd = searchParams.get('end') || '10:00';

  const timeSlots = generateTimeSlots();

  const [formData, setFormData] = useState<ReservationFormData>({
    resource_id: initialResourceId,
    date: initialDate,
    start_time: initialStart,
    end_time: initialEnd,
    purpose: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    resourceName: string;
    date: string;
    startTime: string;
    endTime: string;
    purpose: string;
  } | null>(null);

  const selectedResource = resources.find((r) => r.id === formData.resource_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    // Client-side validation
    const errors = validateReservationForm(formData);
    if (errors.length > 0) {
      const errMap: Record<string, string> = {};
      errors.forEach((err) => {
        errMap[err.field] = err.message;
      });
      setFieldErrors(errMap);
      return;
    }

    setSubmitting(true);
    try {
      const result = await createReservation(formData);

      if (result.success) {
        addToast('success', 'Reservation booked successfully!');
        setConfirmedBooking({
          resourceName: selectedResource?.name || 'Selected Resource',
          date: formData.date,
          startTime: formData.start_time,
          endTime: formData.end_time,
          purpose: formData.purpose,
        });
      } else {
        setGeneralError(result.message);
      }
    } catch {
      setGeneralError('An unexpected network error occurred while booking.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedBooking) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <div className="card p-8 text-center animate-scale-in border-slate-200">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Booking Confirmed!</h2>
          <p className="text-sm text-slate-500 mt-1">
            Your resource reservation has been confirmed and scheduled in the organization registry.
          </p>

          <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left space-y-2.5 text-sm">
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Resource</span>
              <span className="font-semibold text-slate-800">{confirmedBooking.resourceName}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Date</span>
              <span className="font-medium text-slate-800">{formatDate(confirmedBooking.date)}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Time Window</span>
              <span className="font-medium text-slate-800">
                {confirmedBooking.startTime} &ndash; {confirmedBooking.endTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Purpose</span>
              <span className="font-medium text-slate-800 max-w-[240px] truncate">
                {confirmedBooking.purpose}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/reservations" className="btn btn-primary btn-sm">
              View My Reservations
            </Link>
            <button
              onClick={() => {
                setConfirmedBooking(null);
                setFormData({
                  ...formData,
                  purpose: '',
                });
              }}
              className="btn btn-secondary btn-sm"
            >
              Book Another Resource
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button & Title */}
      <div>
        <Link
          href="/availability"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Availability
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reserve a Shared Resource</h1>
        <p className="text-sm text-slate-500 mt-1">
          Select an active resource and enter your reservation details. The system enforces zero double-bookings.
        </p>
      </div>

      {generalError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div>
            <span className="font-semibold block">Booking conflict or validation error</span>
            <span className="text-xs">{generalError}</span>
          </div>
        </div>
      )}

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-6">
        {/* Resource Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Target Resource *
          </label>
          <select
            className={`input text-sm ${fieldErrors.resource_id ? 'input-error' : ''}`}
            value={formData.resource_id}
            onChange={(e) => setFormData({ ...formData, resource_id: e.target.value })}
            required
          >
            <option value="" disabled>
              Select a resource...
            </option>
            {resources
              .filter((r) => r.status === 'active')
              .map((res) => (
                <option key={res.id} value={res.id}>
                  {res.name} ({getCategoryLabel(res.category)} - {res.location})
                </option>
              ))}
          </select>
          {fieldErrors.resource_id && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.resource_id}</p>
          )}

          {/* Quick info about selected resource */}
          {selectedResource && (
            <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
              <div className="font-medium text-slate-800">{selectedResource.name}</div>
              <div className="flex gap-4 text-slate-500">
                <span>Location: {selectedResource.location}</span>
                {selectedResource.capacity && <span>Capacity: {selectedResource.capacity} seats</span>}
              </div>
              {selectedResource.description && (
                <p className="text-slate-500 italic mt-1">{selectedResource.description}</p>
              )}
            </div>
          )}
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Reservation Date *
          </label>
          <input
            type="date"
            className={`input text-sm ${fieldErrors.date ? 'input-error' : ''}`}
            min={getTodayString()}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          {fieldErrors.date && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.date}</p>
          )}
        </div>

        {/* Start & End Times */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Start Time *
            </label>
            <select
              className={`input text-sm ${fieldErrors.start_time ? 'input-error' : ''}`}
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            {fieldErrors.start_time && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.start_time}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              End Time *
            </label>
            <select
              className={`input text-sm ${fieldErrors.end_time ? 'input-error' : ''}`}
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            {fieldErrors.end_time && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.end_time}</p>
            )}
          </div>
        </div>

        {/* Purpose / Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            Purpose / Meeting Subject *
          </label>
          <textarea
            className={`input text-sm resize-none h-24 ${fieldErrors.purpose ? 'input-error' : ''}`}
            placeholder="e.g. Q4 Executive Strategy Sync, Client Presentation, Hardware Diagnostics"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            required
          />
          {fieldErrors.purpose && (
            <p className="text-xs text-red-500 mt-1">{fieldErrors.purpose}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <Link href="/availability" className="btn btn-secondary btn-sm">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-sm px-5"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
            {submitting ? 'Confirming Availability...' : 'Confirm Reservation'}
          </button>
        </div>
      </form>
    </div>
  );
}
