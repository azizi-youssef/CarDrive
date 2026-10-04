import { Router, Request, Response } from 'express';
import { store } from '../services/store';
import { validate } from '../middleware/validate.middleware';
import { bookingSchema, bookingStatusSchema } from '../validations/booking.schema';
import { isVehicleAvailable, findSameModelAlternatives } from '../availability/engine';

export const bookingsRouter = Router();

function qs(val: unknown): string | undefined {
  if (Array.isArray(val)) return val[0];
  return val as string | undefined;
}

/** GET /api/bookings */
bookingsRouter.get('/', (req: Request, res: Response) => {
  const agencyId = qs(req.query.agencyId);
  const bookings = store.getBookings(agencyId);
  res.json({ success: true, data: bookings, meta: { total: bookings.length } });
});

/** GET /api/bookings/:id */
bookingsRouter.get('/:id', (req: Request, res: Response) => {
  const booking = store.getBookingById(req.params.id as string);
  if (!booking) { res.status(404).json({ success: false, error: 'Réservation introuvable' }); return; }
  res.json({ success: true, data: booking });
});

/** POST /api/bookings */
bookingsRouter.post('/', validate(bookingSchema), (req: Request, res: Response) => {
  try {
    const input = req.body;

    const vehicle = store.getVehicleById(input.vehicleId);
    if (!vehicle) { res.status(404).json({ success: false, error: 'Véhicule introuvable' }); return; }

    const agency = store.getAgencyById(input.agencyId);
    if (!agency) { res.status(404).json({ success: false, error: 'Agence introuvable' }); return; }

    const allBookings = store.getBookings();
    if (!isVehicleAvailable(vehicle, allBookings, input.startDate, input.endDate)) {
      const allVehicles = store.getVehicles();
      const alternatives = findSameModelAlternatives({
        currentVehicle: vehicle,
        allVehicles,
        allBookings,
        startDate: input.startDate,
        endDate: input.endDate,
      });
      res.status(409).json({
        success: false,
        error: 'Véhicule non disponible pour ces dates',
        alternatives: alternatives.slice(0, 3),
      });
      return;
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const bookingRef = `#NRD-${Math.floor(1000 + Math.random() * 9000)}`;

    const booking = store.createBooking({
      booking_ref: bookingRef,
      vehicle_id: input.vehicleId,
      agency_id: input.agencyId,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      start_date: input.startDate,
      end_date: input.endDate,
      pickup_time: input.pickupTime ?? '10:00',
      dropoff_time: input.dropoffTime ?? '10:00',
      pickup_location: input.pickupLocation,
      dropoff_location: input.dropoffLocation,
      total_days: totalDays,
      daily_price: vehicle.daily_price,
      total_price: vehicle.daily_price * totalDays,
      deposit_amount: vehicle.deposit,
      status: 'PENDING',
      notes: input.notes,
    });

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    console.error('[Booking Create Error]', err);
    res.status(500).json({ success: false, error: 'Erreur lors de la création de la réservation' });
  }
});

/** PATCH /api/bookings/:id/status */
bookingsRouter.patch('/:id/status', validate(bookingStatusSchema), (req: Request, res: Response) => {
  const { status, rejectionReason } = req.body;
  const updated = store.updateBookingStatus(req.params.id as string, status, rejectionReason);
  if (!updated) { res.status(404).json({ success: false, error: 'Réservation introuvable' }); return; }
  res.json({ success: true, data: updated });
});
