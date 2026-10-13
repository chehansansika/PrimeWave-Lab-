import React, { Suspense } from 'react';
import { getResources } from '@/lib/actions/resources';
import { ReservationFormClient } from '@/components/reservations/ReservationFormClient';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NewReservationPage() {
  const resources = await getResources();

  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-sm">Loading booking form...</p>
        </div>
      }
    >
      <ReservationFormClient resources={resources} />
    </Suspense>
  );
}
