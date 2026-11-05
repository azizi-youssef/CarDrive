import { SearchClient, type SearchPreload } from './SearchClient';
import { agenciesService } from '@/lib/services/agencies.service';
import { vehiclesService } from '@/lib/services/vehicles.service';
import { formatLocalDate, getEffectiveRentalDates, isValidDateOnly } from '@/lib/utils/date-only';

// Rendu à la requête : la disponibilité dépend des dates demandées et de l'état du jour
export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const single = (value: string | string[] | undefined) => (typeof value === 'string' ? value : '');

/**
 * Catalogue : résultats préchargés côté serveur avec les mêmes règles que GET /api/vehicles
 * (période validée, disponibilité calculée en base). En cas d'échec, le client charge lui-même.
 */
export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const startDate = single(params.startDate);
  const endDate = single(params.endDate);

  let preload: SearchPreload | null = null;
  try {
    const period =
      startDate && endDate ? getEffectiveRentalDates(startDate, endDate, formatLocalDate(new Date())) : { startDate: '', endDate: '' };
    const hasPeriod =
      isValidDateOnly(period.startDate) && isValidDateOnly(period.endDate) && period.startDate < period.endDate;

    const [vehicles, agencies] = await Promise.all([
      vehiclesService.getVehicles(hasPeriod ? { startDate: period.startDate, endDate: period.endDate } : undefined),
      agenciesService.getAgencies(true),
    ]);
    preload = JSON.parse(
      JSON.stringify({ vehicles, agencies, period: hasPeriod ? period : { startDate: '', endDate: '' } })
    );
  } catch (error) {
    console.error('[SearchPage] Préchargement impossible :', error instanceof Error ? error.message : error);
  }

  return <SearchClient preload={preload} />;
}
