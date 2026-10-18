import { NextResponse } from 'next/server';
import { requirePlatformPermissionApi } from '@/lib/auth/access-api';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const gate = await requirePlatformPermissionApi('reports.read');
  if (gate.denied) return gate.denied;

  const supabase = await createAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Base de données indisponible' }, { status: 503 });
  }

  try {
    // 1. Récupérer toutes les réservations pour calculs statistiques
    const { data: bookings, error: bErr } = await supabase
      .from('bookings')
      .select(`
        id, reference, total_price, total_days, status, start_date, end_date,
        created_at, pickup_location, delivery_type,
        agency:agencies(id, name, rating),
        vehicle:vehicles(id, brand, model, category)
      `);

    if (bErr) throw bErr;

    const allBookings = bookings || [];

    // 2. Calcul des KPIs globaux
    const validBookings = allBookings.filter((b) => b.status !== 'CANCELLED' && b.status !== 'REJECTED');
    const totalVolume = validBookings.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
    const totalDays = validBookings.reduce((sum, b) => sum + (Number(b.total_days) || 1), 0);
    const averageBookingPrice = validBookings.length > 0 ? Math.round(totalVolume / validBookings.length) : 0;
    const averageRentalDays = validBookings.length > 0 ? (totalDays / validBookings.length).toFixed(1) : '0';

    const confirmedCount = allBookings.filter((b) => ['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(b.status)).length;
    const cancelledCount = allBookings.filter((b) => ['CANCELLED', 'REJECTED'].includes(b.status)).length;
    const confirmationRate = allBookings.length > 0 ? Math.round((confirmedCount / allBookings.length) * 100) : 0;
    const cancellationRate = allBookings.length > 0 ? Math.round((cancelledCount / allBookings.length) * 100) : 0;

    // Commission estimée (15% moyenne plateforme)
    const platformCommission = Math.round(totalVolume * 0.15);
    const agencyNet = totalVolume - platformCommission;

    // 3. Répartition par catégorie de véhicule
    const categoryCounts: Record<string, { count: number; volume: number }> = {};
    validBookings.forEach((b) => {
      const cat = (b.vehicle as any)?.category || 'Non renseigné';
      if (!categoryCounts[cat]) {
        categoryCounts[cat] = { count: 0, volume: 0 };
      }
      categoryCounts[cat].count += 1;
      categoryCounts[cat].volume += Number(b.total_price) || 0;
    });

    const categoryBreakdown = Object.entries(categoryCounts).map(([category, stats]) => ({
      category,
      count: stats.count,
      volume: stats.volume,
      percentage: validBookings.length > 0 ? Math.round((stats.count / validBookings.length) * 100) : 0,
    })).sort((a, b) => b.count - a.count);

    // 4. Top agences partenaires
    const agencyStatsMap: Record<string, { name: string; count: number; volume: number; rating: number }> = {};
    validBookings.forEach((b) => {
      const ag = b.agency as any;
      const agencyName = ag?.name || 'Agence';
      const agencyId = ag?.id || 'unknown';
      if (!agencyStatsMap[agencyId]) {
        agencyStatsMap[agencyId] = {
          name: agencyName,
          count: 0,
          volume: 0,
          rating: Number(ag?.rating) || 4.8,
        };
      }
      agencyStatsMap[agencyId].count += 1;
      agencyStatsMap[agencyId].volume += Number(b.total_price) || 0;
    });

    const topAgencies = Object.values(agencyStatsMap)
      .sort((a, b) => b.volume - a.volume)
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

    // 6. Tendances mensuelles (6 derniers mois)
    const monthlyTrendsMap: Record<string, { month: string; bookings: number; volume: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      monthlyTrendsMap[key] = { month: label, bookings: 0, volume: 0 };
    }

    validBookings.forEach((b) => {
      const dateStr = b.created_at || b.start_date;
      if (dateStr) {
        const key = dateStr.slice(0, 7);
        if (monthlyTrendsMap[key]) {
          monthlyTrendsMap[key].bookings += 1;
          monthlyTrendsMap[key].volume += Number(b.total_price) || 0;
        }
      }
    });

    const monthlyTrends = Object.values(monthlyTrendsMap);

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalVolume,
          platformCommission,
          agencyNet,
          totalBookings: allBookings.length,
          confirmedBookings: confirmedCount,
          cancelledBookings: cancelledCount,
          averageBookingPrice,
          averageRentalDays: Number(averageRentalDays),
          confirmationRate,
          cancellationRate,
        },
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
