import React from 'react';
import { getResources } from '@/lib/actions/resources';
import { AvailabilityCheckerClient } from '@/components/availability/AvailabilityCheckerClient';

export const dynamic = 'force-dynamic';

export default async function AvailabilityPage() {
  const allResources = await getResources();

  return <AvailabilityCheckerClient allResources={allResources} />;
}
