import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/auth/server';
import { portalForRole, PORTAL_DEFAULT_REDIRECT, loginUrl } from '@/lib/auth/login-portals';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const auth = await getServerAuth();
  if (!auth) {
    redirect(loginUrl('client', { redirect: PORTAL_DEFAULT_REDIRECT.client }));
  }

  const portal = portalForRole(auth.role);
  if (portal !== 'client') {
    if (portal) redirect(PORTAL_DEFAULT_REDIRECT[portal]);
    redirect(loginUrl('client', { error: 'forbidden' }));
  }

  return children;
}
