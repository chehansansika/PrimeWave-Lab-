import React from 'react';
import { getAllReservations } from '@/lib/actions/reservations';
import { AdminReservationsClient } from '@/components/admin/AdminReservationsClient';

export const dynamic = 'force-dynamic';

export default async function AdminReservationsPage() {
  const reservations = await getAllReservations();

  return <AdminReservationsClient initialReservations={reservations} />;
}
