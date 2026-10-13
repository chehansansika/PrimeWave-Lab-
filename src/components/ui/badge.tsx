import React from 'react';
import { getStatusColor, getStatusLabel } from '@/lib/utils';
import type { ResourceStatus, ReservationStatus } from '@/types';

interface BadgeProps {
  status: ResourceStatus | ReservationStatus | string;
  label?: string;
  className?: string;
}

export function Badge({ status, label, className = '' }: BadgeProps) {
  const displayLabel = label || getStatusLabel(status as ResourceStatus | ReservationStatus);
  const colorClasses = getStatusColor(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
          status === 'active' || status === 'confirmed'
            ? 'bg-emerald-500'
            : status === 'cancelled'
            ? 'bg-red-500'
            : 'bg-slate-400'
        }`}
      />
      {displayLabel}
    </span>
  );
}
