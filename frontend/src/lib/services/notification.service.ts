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
  formatAgencyWhatsAppMessage(booking: Booking): string {
    const vehicleName = booking.vehicle
      ? `${booking.vehicle.brand} ${booking.vehicle.model}`
      : 'Véhicule';

    return (
      `🚗 *Nouvelle demande CarDrive*\n\n` +
      `*Référence :* ${booking.reference || booking.booking_ref}\n` +
      `*Véhicule :* ${vehicleName}\n` +
      `*Client :* ${booking.customer_name}\n` +
      `*Téléphone :* ${booking.customer_phone}\n` +
      `*Dates :* ${booking.start_date} → ${booking.end_date} (${booking.total_days} jours)\n` +
      `*Lieu :* ${booking.pickup_location}\n` +
      `*Total location :* ${booking.total_price} DH\n` +
      `*Montant agence :* ${booking.agency_amount} DH (Com. CarDrive ${booking.commission_rate}% : ${booking.commission_amount} DH)\n\n` +
      `Merci de traiter cette demande depuis votre espace partenaire CarDrive.`
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
