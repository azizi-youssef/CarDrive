import type { Metadata } from 'next';
import UnifiedPortalLogin from '@/components/auth/UnifiedPortalLogin';

export const metadata: Metadata = {
  title: 'Connexion',
  robots: { index: false, follow: true },
  alternates: { canonical: '/login' },
};

export default function LoginPage() {
  return <UnifiedPortalLogin />;
}
