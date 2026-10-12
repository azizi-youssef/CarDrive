import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isPlatformAdminRole } from '@cardrive/shared';
import { getServerAuth } from '@/lib/auth/server';

export const metadata: Metadata = {
  title: {
    default: 'Administration — CarDrive',
    template: '%s — Admin CarDrive',
  },
  description: 'Portail de super-administration CarDrive',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side auth guard — fail closed
  const auth = await getServerAuth();
  if (!auth || !isPlatformAdminRole(auth.role)) {
    redirect('/login?portal=admin&error=forbidden');
  }

  return <>{children}</>;
}
