import React from 'react';
import { getMyReservations } from '@/lib/actions/reservations';
import { MyReservationsClient } from '@/components/reservations/MyReservationsClient';

export const dynamic = 'force-dynamic';

export default async function MyReservationsPage() {
  const reservations = await getMyReservations();

  return <MyReservationsClient initialReservations={reservations} />;
}
