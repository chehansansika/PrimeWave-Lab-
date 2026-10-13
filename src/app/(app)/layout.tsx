import { getCurrentProfile } from '@/lib/actions/auth';
import { AppLayoutClient } from '@/components/layout/AppLayoutClient';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <AppLayoutClient profile={profile}>
      {children}
    </AppLayoutClient>
  );
}
