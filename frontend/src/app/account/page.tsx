'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Booking } from '@/types';
import { useRealtimeRefresh } from '@/lib/supabase/realtime';
import {
  Calendar,
  Heart,
  Settings,
  Car,
  MapPin,
  CheckCircle2,
  LogOut,
  Sparkles,
  Loader2,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { signOutEverywhere } from '@/lib/auth/client';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { loginUrl } from '@/lib/auth/login-portals';
import { ReviewModal } from '@/components/shared/ReviewModal';

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab =
    requestedTab === 'bookings' || requestedTab === 'favorites' || requestedTab === 'profile'
      ? requestedTab
      : 'bookings';
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  // Avis : quelle réservation est en cours de notation
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    if (!supabase || !isSupabaseConfigured()) {
      setLoadingUser(false);
      return;
    }

    supabase.auth.getUser().then(({ data }: any) => {
      setUser(data?.user ?? null);
      setLoadingUser(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadBookings = useCallback(async (isInitial = false) => {
    if (!user) {
      setBookings([]);
      return;
    }
    if (isInitial) setLoadingBookings(true);
    try {
      const res = await fetch('/api/bookings', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error('[AccountPage] Error loading bookings:', err);
    } finally {
      if (isInitial) setLoadingBookings(false);
    }
  }, [user]);

  useEffect(() => {
    void loadBookings(true);
  }, [loadBookings]);

  // Rafraîchissement automatique en direct des réservations du client
  useRealtimeRefresh({
    tables: ['bookings', 'vehicles'],
    onRefresh: () => loadBookings(false),
    enabled: Boolean(user),
    pollingIntervalMs: 20_000,
  });

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      await signOutEverywhere(createClient());
      setUser(null);
      setBookings([]);
    } catch (error: unknown) {
      setSignOutError(error instanceof Error ? error.message : 'La déconnexion a échoué. Réessayez.');
    } finally {
      setSigningOut(false);
    }
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : 'Invité');

  const displayEmail = user?.email || 'Non connecté';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const tabs = [
    { id: 'bookings', label: 'Mes Réservations', icon: Calendar, count: bookings.length },
    { id: 'favorites', label: 'Favoris', icon: Heart, count: 0 },
    { id: 'profile', label: 'Mon Profil', icon: Settings },
  ] as const;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-16">
      {/* Profile Header */}
      <div className="bg-linear-to-br from-[#0B1220] via-[#0F172A] to-[#1E293B] text-white pt-10 pb-20 border-b border-slate-800">
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
                    {user ? 'Compte vérifié' : 'Compte invité'}
                  </span>
                  <span>·</span>
                  <span>{bookings.length} réservation{bookings.length > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {user ? (
              <div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
                >
                  {signingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" /> : <LogOut className="w-3.5 h-3.5 text-rose-400" />}
                  {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
                </button>
              </div>
            ) : null}
          </div>
          {signOutError && <p role="alert" className="mt-4 text-sm text-red-300">{signOutError}</p>}
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
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
              <Link
                href={loginUrl('client', { redirect: '/account' })}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Connexion e-mail
              </Link>
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
                  onClick={() => router.replace(`/account?tab=${tab.id}`, { scroll: false })}
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

                {loadingBookings ? (
                  <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#02306B]" />
                    <span className="text-xs">Chargement de vos réservations...</span>
                  </div>
                ) : bookings.length > 0 ? (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
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
                              <span className="font-mono font-semibold text-slate-700">{booking.reference || booking.booking_ref}</span>
                              <span>·</span>
                              <MapPin className="w-3 h-3" />
                              <span>{booking.agency?.name}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 justify-between sm:justify-end sm:border-l sm:border-slate-200 sm:pl-4">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-slate-400 block">Total estimé</span>
                            <span className="text-sm font-extrabold text-slate-900">
                              {formatPrice(booking.total_price)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={`/api/bookings/${encodeURIComponent(booking.reference || booking.booking_ref || '')}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                              title="Télécharger le PDF"
                            >
                              PDF
                            </a>
                            {/* Bouton avis — uniquement pour les locations terminées */}
                            {booking.status === 'COMPLETED' && !reviewedBookingIds.has(booking.id) && (
                              <button
                                type="button"
                                id={`review-btn-${booking.id}`}
                                onClick={() => setReviewBooking(booking)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition"
                                title="Donner un avis sur cette location"
                              >
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                Avis
                              </button>
                            )}
                            {booking.status === 'COMPLETED' && reviewedBookingIds.has(booking.id) && (
                              <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Noté
                              </span>
                            )}
                            <Link
                              href={`/account/bookings/${encodeURIComponent(booking.reference || booking.booking_ref || '')}`}
                              className="px-3 py-1.5 rounded-lg bg-[#02306B] text-white text-xs font-semibold hover:bg-[#064181] transition shadow-sm"
                            >
                              Suivre
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Aucune réservation trouvée</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                      Vos dossiers de location validés apparaîtront ici dès que vous effectuerez une réservation.
                    </p>
                    <div className="mt-4">
                      <Link
                        href="/search"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#02306B] hover:bg-[#064181] text-white text-xs font-semibold transition shadow-sm"
                      >
                        Explorer les voitures disponibles
                      </Link>
                    </div>
                  </div>
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

        <div className="mt-6 text-center text-xs text-slate-500">
          <Link href="/search" className="text-slate-700 font-semibold hover:text-[#E63946] transition">
            ← Retourner à la recherche de voitures
          </Link>
        </div>
      </div>

      {/* Modal d'avis — s'ouvre sur les locations terminées */}
      {reviewBooking && (
        <ReviewModal
          bookingId={reviewBooking.id}
          bookingRef={reviewBooking.reference || reviewBooking.booking_ref || reviewBooking.id}
          vehicleName={
            reviewBooking.vehicle
              ? `${reviewBooking.vehicle.brand} ${reviewBooking.vehicle.model}`
              : 'Véhicule'
          }
          agencyName={reviewBooking.agency?.name || ''}
          vehicleImage={reviewBooking.vehicle?.images?.[0] ?? null}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => {
            setReviewedBookingIds((prev) => new Set(prev).add(reviewBooking.id));
            setReviewBooking(null);
          }}
        />
      )}
    </div>
  );
}
