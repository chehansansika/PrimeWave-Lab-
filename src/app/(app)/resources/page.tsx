import React from 'react';
import { getResources } from '@/lib/actions/resources';
import { getCurrentProfile } from '@/lib/actions/auth';
import { ResourceManagementClient } from '@/components/resources/ResourceManagementClient';

export const dynamic = 'force-dynamic';

export default async function ResourcesPage() {
  const profile = await getCurrentProfile();
  const resources = await getResources();

  return (
    <ResourceManagementClient
      initialResources={resources}
      profile={profile}
    />
  );
}
