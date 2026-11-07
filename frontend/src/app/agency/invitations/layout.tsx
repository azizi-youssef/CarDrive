import type { Metadata } from 'next';

/** Acceptation d'invitation : page privée, jamais indexée */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AgencyInvitationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
