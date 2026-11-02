import { NextResponse } from 'next/server';
import { requirePlatformPermissionApi } from '@/lib/auth/access-api';
import { createAdminClient } from '@/lib/supabase/server';
import { subscriptionService } from '@/lib/services/subscription.service';

export async function GET() {
  const gate = await requirePlatformPermissionApi('reports.read');
  if (gate.denied) return gate.denied;

  const supabase = await createAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Base de données indisponible' }, { status: 503 });
  }

  try {
    // 1. Récupérer les réservations, abonnements et statistiques globales en parallèle
    const [bookingsRes, subscriptionStats, agenciesCountRes, vehiclesCountRes] = await Promise.all([
      supabase
        .from('bookings')
        .select(`
          id, reference, total_days, status, start_date, end_date,
          created_at, pickup_location, delivery_type,
          agency:agencies(id, name, rating, city),
          vehicle:vehicles(id, brand, model, category)
        `),
      subscriptionService.getSubscriptionStats().catch(() => ({
        monthlyRecurringRevenue: 0,
        activeSubscribers: 0,
        fleetCapacityTotal: 0,
      })),
      supabase.from('agencies').select('id', { count: 'exact', head: true }),
      supabase.from('vehicles').select('id', { count: 'exact', head: true }),
    ]);

    if (bookingsRes.error) throw bookingsRes.error;

    const allBookings = bookingsRes.data || [];
    const totalAgencies = agenciesCountRes.count || 0;
    const totalVehicles = vehiclesCountRes.count || 0;

    // 2. Calcul des indicateurs de performance des réservations
    const confirmedCount = allBookings.filter((b) => ['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(b.status)).length;
    const cancelledCount = allBookings.filter((b) => ['CANCELLED', 'REJECTED'].includes(b.status)).length;
    const pendingCount = allBookings.filter((b) => ['PENDING', 'REQUESTED', 'UNDER_REVIEW'].includes(b.status)).length;

    const confirmationRate = allBookings.length > 0 ? Math.round((confirmedCount / allBookings.length) * 100) : 0;
    const cancellationRate = allBookings.length > 0 ? Math.round((cancelledCount / allBookings.length) * 100) : 0;

    const validBookings = allBookings.filter((b) => b.status !== 'CANCELLED' && b.status !== 'REJECTED');
    const totalDays = validBookings.reduce((sum, b) => sum + (Number(b.total_days) || 1), 0);
    const averageRentalDays = validBookings.length > 0 ? Number((totalDays / validBookings.length).toFixed(1)) : 0;

    // 3. Répartition par catégorie de véhicule
    const categoryCounts: Record<string, number> = {};
    validBookings.forEach((b) => {
      const cat = (b.vehicle as any)?.category || 'Non renseigné';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categoryBreakdown = Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: validBookings.length > 0 ? Math.round((count / validBookings.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 4. Performance des agences partenaires (par nombre de réservations et note)
    const agencyStatsMap: Record<string, { name: string; city: string; count: number; rating: number }> = {};
    validBookings.forEach((b) => {
      const ag = b.agency as any;
      const agencyName = ag?.name || 'Agence';
      const agencyId = ag?.id || 'unknown';
      if (!agencyStatsMap[agencyId]) {
        agencyStatsMap[agencyId] = {
          name: agencyName,
          city: ag?.city || 'Maroc',
          count: 0,
          rating: Number(ag?.rating) || 4.8,
        };
      }
      agencyStatsMap[agencyId].count += 1;
    });

    const topAgencies = Object.values(agencyStatsMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 5. Points de rendez-vous les plus demandés
    const locationCounts: Record<string, number> = {};
    validBookings.forEach((b) => {
      const loc = b.pickup_location || 'Agence principale';
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });

    const topLocations = Object.entries(locationCounts)
      .map(([location, count]) => ({
        location,
        count,
        percentage: validBookings.length > 0 ? Math.round((count / validBookings.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 6. Tendances mensuelles des réservations (6 derniers mois)
    const monthlyTrendsMap: Record<string, { month: string; bookings: number; confirmed: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      monthlyTrendsMap[key] = { month: label, bookings: 0, confirmed: 0 };
    }

    allBookings.forEach((b) => {
      const dateStr = b.created_at || b.start_date;
      if (dateStr) {
        const key = dateStr.slice(0, 7);
        if (monthlyTrendsMap[key]) {
          monthlyTrendsMap[key].bookings += 1;
          if (['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(b.status)) {
            monthlyTrendsMap[key].confirmed += 1;
          }
        }
      }
    });

    const monthlyTrends = Object.values(monthlyTrendsMap);

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalBookings: allBookings.length,
          confirmedBookings: confirmedCount,
          pendingBookings: pendingCount,
          cancelledBookings: cancelledCount,
          confirmationRate,
          cancellationRate,
          averageRentalDays,
          totalAgencies,
          totalVehicles,
        },
        subscriptions: subscriptionStats,
        monthlyTrends,
        categoryBreakdown,
        topAgencies,
        topLocations,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur calcul analytics';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
