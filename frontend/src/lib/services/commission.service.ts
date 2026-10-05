import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { PlatformSettings } from '@/types';

// Valeur de repli si la base de données n'est pas encore initialisée
const DEFAULT_COMMISSION_RATE = 15.00;

class CommissionService {
  private cachedRate: number = DEFAULT_COMMISSION_RATE;
  private lastFetched: number = 0;
  private readonly CACHE_TTL_MS = 60 * 1000; // 1 minute de cache serveur

  /**
   * Récupère le taux de commission actuel de la plateforme (en pourcentage, ex: 15.00)
   */
  async getCommissionRate(): Promise<number> {
    const now = Date.now();
    if (now - this.lastFetched < this.CACHE_TTL_MS && this.cachedRate !== undefined) {
      return this.cachedRate;
    }

    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('platform_settings')
            .select('commission_rate')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

          if (!error && data && data.commission_rate !== undefined) {
            this.cachedRate = Number(data.commission_rate);
            this.lastFetched = now;
            return this.cachedRate;
          }
        }
      } catch (err) {
        console.warn('Could not fetch commission from Supabase, using fallback:', err);
      }
    }

    return this.cachedRate;
  }

  /**
   * Récupère tous les paramètres globaux de la plateforme
   */
  async getPlatformSettings(): Promise<PlatformSettings> {
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('platform_settings')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

          if (!error && data) {
            return {
              id: data.id,
              commission_rate: Number(data.commission_rate),
              currency: data.currency || 'MAD',
              payment_fee: Number(data.payment_fee || 0),
              cancellation_fee: Number(data.cancellation_fee || 0),
              updated_at: data.updated_at,
            };
          }
        }
      } catch (err) {
        console.warn('Could not fetch platform settings, returning defaults:', err);
      }
    }

    return {
      id: 'default',
      commission_rate: this.cachedRate,
      currency: 'MAD',
      payment_fee: 0,
      cancellation_fee: 0,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Met à jour le taux de commission de la plateforme depuis l'administration.
   * Remarque : Les anciennes réservations conservent leur taux historique dans la table bookings.
   */
  async updateCommissionRate(newRate: number): Promise<{ success: boolean; rate: number; error?: string }> {
    const safeRate = Number(newRate);
    if (isNaN(safeRate) || safeRate < 0 || safeRate > 100) {
      return { success: false, rate: this.cachedRate, error: 'Le taux doit être compris entre 0 et 100%' };
    }

    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          // Mettre à jour la ligne existante ou en insérer une nouvelle
          const { data: existing } = await supabase
            .from('platform_settings')
            .select('id')
            .limit(1)
            .single();

          if (existing?.id) {
            const { error } = await supabase
              .from('platform_settings')
              .update({
                commission_rate: safeRate,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id);

            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('platform_settings')
              .insert({
                commission_rate: safeRate,
                currency: 'MAD',
              });

            if (error) throw error;
          }

          this.cachedRate = safeRate;
          this.lastFetched = Date.now();
          return { success: true, rate: safeRate };
        }
      } catch (err: any) {
        console.error('Failed to update commission rate in Supabase:', err);
        return { success: false, rate: this.cachedRate, error: err.message || 'Erreur base de données' };
      }
    }

    // Mise à jour en mémoire si Supabase indisponible
    this.cachedRate = safeRate;
    this.lastFetched = Date.now();
    return { success: true, rate: safeRate };
  }
}

export const commissionService = new CommissionService();
