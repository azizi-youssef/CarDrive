import { Agency, AgencyStatus } from '@/types';
import { store } from './store';
import { createClient, isSupabaseServerConfigured } from '@/lib/supabase/server';

export class AgenciesService {
  async getAgencies(onlyActive = true): Promise<Agency[]> {
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          let query = supabase.from('agencies').select('*');
          if (onlyActive) {
            query = query.eq('status', 'ACTIVE');
          }
          const { data, error } = await query.order('rating', { ascending: false });
          if (!error && data) {
            return data as Agency[];
          }
        }
      } catch (err) {
        console.warn('Fallback to local store for agencies:', err);
      }
    }
    return store.getAgencies(onlyActive);
  }

  async getAgencyBySlug(slug: string): Promise<Agency | null> {
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('agencies')
            .select('*')
            .eq('slug', slug)
            .single();
          if (!error && data) {
            return data as Agency;
          }
        }
      } catch (err) {
        console.warn('Fallback to local store for agency slug:', err);
      }
    }
    return store.getAgencyBySlug(slug) || null;
  }

  async getAgencyById(id: string): Promise<Agency | null> {
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('agencies')
            .select('*')
            .eq('id', id)
            .single();
          if (!error && data) {
            return data as Agency;
          }
        }
      } catch (err) {
        console.warn('Fallback to local store for agency id:', err);
      }
    }
    return store.getAgencyById(id) || null;
  }

  async updateAgencyStatus(id: string, status: AgencyStatus, verified: boolean): Promise<Agency | null> {
    if (isSupabaseServerConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('agencies')
            .update({ status, verified, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
          if (!error && data) {
            return data as Agency;
          }
        }
      } catch (err) {
        console.warn('Fallback to local store for updateAgencyStatus:', err);
      }
    }
    return store.updateAgencyStatus(id, status, verified) || null;
  }

  async getAgencyStats(agencyId: string) {
    return store.getAgencyStats(agencyId);
  }

  async getAdminStats() {
    return store.getAdminStats();
  }
}

export const agenciesService = new AgenciesService();
