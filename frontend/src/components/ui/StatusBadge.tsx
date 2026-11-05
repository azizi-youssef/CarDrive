import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { bookingStatusLabel, bookingStatusTone } from '@/lib/bookings/status';
import type { Locale } from '@/lib/i18n/config';

/** Badge de statut de réservation, cohérent dans tout le produit (client, agence, admin). */
export function StatusBadge({
  status,
  locale = 'fr',
  audience = 'customer',
  size = 'md',
  className,
}: {
  status: string;
  locale?: Locale;
  audience?: 'customer' | 'business';
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <Badge tone={bookingStatusTone(status)} size={size} dot className={className}>
      {bookingStatusLabel(status, locale, audience)}
    </Badge>
  );
}
