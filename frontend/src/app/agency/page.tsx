import { redirect } from 'next/navigation';
import AgencyDashboard from '@/components/agency/AgencyDashboard';
import { canAccessAgencyArea, getServerAuth } from '@/lib/auth/server';

export default async function AgencyPage() {
  const auth = await getServerAuth();
  if (!auth || !canAccessAgencyArea(auth)) {
    redirect('/login?portal=agency&error=forbidden');
  }

  return <AgencyDashboard />;
}
