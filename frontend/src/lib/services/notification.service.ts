import { Booking } from '@/types';
import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server';

export interface EmailPayload {
  to: string;
  subject: string;
  template: 'booking-request-to-agency' | 'booking-request-confirmation-to-customer' | 'booking-approved' | 'booking-rejected' | 'booking-alternative';
  variables: Record<string, any>;
}

export interface WhatsAppPayload {
  phone: string;
  text: string;
  bookingRef: string;
}

export interface DashboardNotificationPayload {
  userId?: string;
  agencyId?: string;
  title: string;
  message: string;
  link: string;
  type?: 'BOOKING' | 'SYSTEM' | 'COMMISSION';
}

class NotificationService {
  /**
   * Envoi d'email (abstrait / log / webhook / service tiers Resend ou SendGrid)
   */
  async sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string }> {
    console.log(`[NotificationService] 📧 Sending email to ${payload.to} with template ${payload.template}:`, payload.subject);
    // Simulation / préparation pour provider email de production
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  }

  /**
   * Génération de message & URL WhatsApp prêt à l'emploi
   */
  generateWhatsAppLink(phone: string, text: string): string {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(text);
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }

  /**
   * Formatage du message WhatsApp professionnel de demande de réservation
   */
  formatAgencyWhatsAppMessage(booking: Booking, appUrl?: string): string {
    const baseAppUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://cardrive.ma';
    const pdfUrl = `${baseAppUrl}/api/bookings/${encodeURIComponent(booking.reference || booking.booking_ref || '')}/pdf`;
    const dashboardUrl = `${baseAppUrl}/agency?booking=${encodeURIComponent(booking.reference || booking.booking_ref || '')}`;
    const vehicleName = booking.vehicle
      ? `${booking.vehicle.brand} ${booking.vehicle.model} (${booking.vehicle.year})`
      : 'Véhicule';

    return (
      `🚗 *NOUVELLE DEMANDE DE RÉSERVATION CARDRIVE*\n\n` +
      `*Référence :* ${booking.reference || booking.booking_ref}\n` +
      `*Véhicule :* ${vehicleName}\n` +
      `*Client :* ${booking.customer_name}\n` +
      `*N° CIN / Passeport :* ${booking.cin || 'Présenté sur place'}\n` +
      `*Téléphone client :* ${booking.customer_phone}\n\n` +
      `📅 *Période :* du ${booking.start_date} au ${booking.end_date} (${booking.total_days} jours)\n` +
      `📍 *Point de rendez-vous retenu :* ${booking.pickup_location}\n` +
      (booking.flight_number ? `✈️ *Vol d'arrivée :* ${booking.flight_number} (${booking.flight_arrival_time || '—'})\n` : '') +
      `\n💰 *Total facturé :* ${booking.total_price} DH\n` +
      `💵 *Part revenant à l'agence (85%) :* ${booking.agency_amount} DH\n` +
      `🏷️ *Commission CarDrive (15%) :* ${booking.commission_amount} DH\n` +
      `🔒 *Caution à percevoir en agence :* ${booking.deposit_amount || 3000} DH\n\n` +
      `📄 *Fichier PDF officiel de la demande :*\n${pdfUrl}\n\n` +
      `💻 *Traiter sur votre Dashboard Agence :*\n${dashboardUrl}`
    );
  }

  /**
   * Formatage du message WhatsApp pour le client
   */
  formatCustomerWhatsAppMessage(booking: Booking): string {
    const vehicleName = booking.vehicle
      ? `${booking.vehicle.brand} ${booking.vehicle.model}`
      : 'Véhicule';

    return (
      `✅ *Demande CarDrive enregistrée*\n\n` +
      `Bonjour ${booking.customer_name},\n` +
      `Votre demande pour la *${vehicleName}* a bien été transmise à l'agence ${booking.agency?.name || ''}.\n\n` +
      `*Référence :* ${booking.reference || booking.booking_ref}\n` +
      `*Période :* du ${booking.start_date} au ${booking.end_date}\n` +
      `*Total estimé :* ${booking.total_price} DH\n\n` +
      `Suivez votre demande en direct sur : https://cardrive.ma/account/bookings/${encodeURIComponent(booking.reference || booking.booking_ref || '')}`
    );
  }

  /**
   * Envoi de notification dans le dashboard / base de données Supabase
   */
  async sendDashboardNotification(payload: DashboardNotificationPayload): Promise<boolean> {
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase && payload.userId) {
          await supabase.from('notifications').insert({
            user_id: payload.userId,
            title: payload.title,
            message: payload.message,
            link: payload.link,
            type: payload.type || 'BOOKING',
          });
          return true;
        }
      } catch (err) {
        console.warn('[NotificationService] Could not persist dashboard notification:', err);
      }
    }

    console.log('[NotificationService] 🔔 Dashboard notification:', payload.title, payload.message);
    return true;
  }
}

export const notificationService = new NotificationService();
