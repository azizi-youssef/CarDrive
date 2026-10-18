import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformPermissionApi } from '@/lib/auth/access-api';
import { createAdminClient } from '@/lib/supabase/server';

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cin: string;
  country: string;
  bookingCount: number;
  totalSpent: number;
  lastBookingDate: string;
  lastBookingRef: string;
  lastStatus: string;
  firstBookingDate: string;
  bookings: Array<{
    id: string;
    reference: string;
    vehicleName: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    status: string;
  }>;
}

export async function GET(request: NextRequest) {
  const gate = await requirePlatformPermissionApi('customers.read');
  if (gate.denied) return gate.denied;

  const supabase = await createAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Base de données indisponible' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const countryFilter = searchParams.get('country') || 'ALL';

  try {
    // 1. Récupérer toutes les réservations avec détails clients
    const { data: bookings, error: bErr } = await supabase
      .from('bookings')
      .select(`
        id, reference, booking_ref,
        customer_name, customer_email, customer_phone,
        first_name, last_name, cin, customer_country,
        total_price, status, start_date, end_date, created_at,
        vehicle:vehicles(brand, model)
      `)
      .order('created_at', { ascending: false });

    if (bErr) throw bErr;

    // 2. Agréger par identifiant unique client (email ou téléphone)
    const customerMap = new Map<string, AdminCustomer>();

    (bookings || []).forEach((b) => {
      const email = (b.customer_email || '').trim().toLowerCase();
      const phone = (b.customer_phone || '').trim();
      const key = email || phone || b.cin || b.id;

      if (!key) return;

      const vehicle = Array.isArray(b.vehicle) ? b.vehicle[0] : b.vehicle;
      const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Véhicule';
      const ref = b.reference || b.booking_ref || b.id.slice(0, 8);
      const price = Number(b.total_price) || 0;
      const bookingDate = b.created_at || b.start_date || '';

      const existing = customerMap.get(key);

      if (!existing) {
        customerMap.set(key, {
          id: key,
          name: b.customer_name || `${b.first_name || ''} ${b.last_name || ''}`.trim() || 'Client',
          email: b.customer_email || '—',
          phone: b.customer_phone || '—',
          cin: b.cin || '—',
          country: b.customer_country || 'Maroc',
          bookingCount: 1,
          totalSpent: price,
          lastBookingDate: bookingDate,
          lastBookingRef: ref,
          lastStatus: b.status,
          firstBookingDate: bookingDate,
          bookings: [
            {
              id: b.id,
              reference: ref,
              vehicleName,
              startDate: b.start_date,
              endDate: b.end_date,
              totalPrice: price,
              status: b.status,
            },
          ],
        });
      } else {
        existing.bookingCount += 1;
        existing.totalSpent += price;
        existing.firstBookingDate = bookingDate; // Vu que l'ordre est décroissant
        if (existing.bookings.length < 5) {
          existing.bookings.push({
            id: b.id,
            reference: ref,
            vehicleName,
            startDate: b.start_date,
            endDate: b.end_date,
            totalPrice: price,
            status: b.status,
          });
        }
      }
    });

    let customers = Array.from(customerMap.values());

    // 3. Filtrage recherche
    if (q) {
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.cin.toLowerCase().includes(q)
      );
    }

    if (countryFilter !== 'ALL') {
      customers = customers.filter(
        (c) => c.country.toLowerCase() === countryFilter.toLowerCase()
      );
    }

    // 4. Calcul des KPIs clients
    const totalCustomers = customerMap.size;
    const repeatCustomers = Array.from(customerMap.values()).filter((c) => c.bookingCount > 1).length;
    const totalVolume = Array.from(customerMap.values()).reduce((sum, c) => sum + c.totalSpent, 0);
    const averageSpendPerCustomer = totalCustomers > 0 ? Math.round(totalVolume / totalCustomers) : 0;

    return NextResponse.json({
      success: true,
      data: {
        customers,
        kpis: {
          totalCustomers,
          repeatCustomers,
          repeatRate: totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0,
          averageSpendPerCustomer,
          totalVolume,
        },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur chargement clients';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
