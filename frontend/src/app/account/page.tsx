'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { store } from '@/lib/services/store';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import {
  User,
  Calendar,
  Heart,
  Settings,
  Car,
  MapPin,
  CheckCircle2,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

const DEMO_BOOKINGS = store.getBookings().slice(0, 5);

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<'bookings' | 'favorites' | 'profile'>('bookings');
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !isSupabaseConfigured()) {
      setLoadingUser(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoadingUser(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
    }
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : 'Mohamed El Amrani');

  const displayEmail = user?.email || 'm.elamrani@gmail.com';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const tabs = [
    { id: 'bookings', label: 'Mes Réservations', icon: Calendar, count: DEMO_BOOKINGS.length },
    { id: 'favorites', label: 'Favoris', icon: Heart, count: 4 },
    { id: 'profile', label: 'Mon Profil', icon: Settings },
  ] as const;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-[#0B1220] via-[#0F172A] to-[#1E293B] text-white pt-10 pb-20 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-16 h-16 rounded-2xl border-2 border-white/30 object-cover shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                    {displayName}
                  </h1>
                  {user && (
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                      Connecté Google
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  {displayEmail}
                </p>

                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-300">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Compte vérifié
                  </span>
                  <span>·</span>
                  <span>{DEMO_BOOKINGS.length} réservations</span>
                </div>
              </div>
            </div>

            {user ? (
              <div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-slate-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  Se déconnecter
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Content with overlap card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        {/* Banner if not authenticated */}
        {!user && !loadingUser && (
          <div className="mb-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E63946]/10 text-[#E63946] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Connectez-vous pour synchroniser vos données
                </p>
                <p className="text-[11px] text-slate-500">
                  Accédez à votre historique en temps réel en 1 clic avec Google.
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <GoogleSignInButton variant="light" next="/account" label="Connexion Google" />
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/5 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors',
                    activeTab === tab.id
                      ? 'border-[#E63946] text-[#E63946]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {'count' in tab && tab.count !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-5 sm:p-6">
            {/* TAB: My Bookings */}
            {activeTab === 'bookings' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-900">Historique des dossiers de location</h2>

                {DEMO_BOOKINGS.length > 0 ? (
                  <div className="space-y-3">
                    {DEMO_BOOKINGS.map((booking) => (
                      <div
                        key={booking.id}
                        className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#0B1220] flex items-center justify-center shrink-0">
                            <Car className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">
                                {booking.vehicle?.brand} {booking.vehicle?.model}
                              </span>
                              <Badge
                                variant={
                                  booking.status === 'CONFIRMED' ? 'available'
                                  : booking.status === 'PENDING' ? 'pending'
                                  : 'rented'
                                }
                              >
                                {booking.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono font-semibold text-slate-700">{booking.booking_ref}</span>
                              <span>·</span>
                              <MapPin className="w-3 h-3" />
                              <span>{booking.agency?.name}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
                          <span className="text-xs text-slate-400 block">Total estimé</span>
                          <span className="text-sm font-extrabold text-slate-900">
                            {formatPrice(booking.total_price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Aucune réservation trouvée.</p>
                )}
              </div>
            )}

            {/* TAB: Favorites */}
            {activeTab === 'favorites' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-900">Véhicules sauvegardés</h2>
                <p className="text-xs text-slate-500">
                  Retrouvez rapidement les modèles que vous avez ajoutés en favoris.
                </p>
                <div className="pt-2">
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1220] text-white text-xs font-bold hover:bg-slate-800 transition"
                  >
                    Explorer les voitures disponibles
                  </Link>
                </div>
              </div>
            )}

            {/* TAB: Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-4 max-w-md">
                <h2 className="text-sm font-bold text-slate-900">Informations personnelles</h2>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Nom complet</label>
                    <input
                      type="text"
                      defaultValue={displayName}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#E63946] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      defaultValue={displayEmail}
                      disabled={Boolean(user)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Téléphone / WhatsApp</label>
                    <input
                      type="tel"
                      defaultValue="+212 661 23 45 67"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#E63946] outline-none"
                    />
                  </div>

                  <div className="pt-3">
                    <button className="px-5 py-2.5 rounded-xl bg-[#E63946] hover:bg-[#C92F3B] text-white font-semibold shadow-sm transition-colors">
                      Enregistrer les modifications
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <Link href="/search" className="text-slate-700 font-semibold hover:text-[#E63946] transition">
            ← Retourner à la recherche de voitures
          </Link>
        </div>
      </div>
    </div>
  );
}
