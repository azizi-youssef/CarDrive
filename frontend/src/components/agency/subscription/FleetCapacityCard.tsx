'use client';

import React from 'react';
import {
  Car,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import type { AgencySubscription } from '@/types';

interface Props {
  subscription: AgencySubscription | null;
  loading?: boolean;
  onOpenUpgradeModal: () => void;
}

export function FleetCapacityCard({ subscription, loading, onOpenUpgradeModal }: Props) {
  if (loading || !subscription) {
    return (
      <div className="h-28 w-full animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
    );
  }

  const { plan, current_vehicles_count, vehicle_capacity, is_at_capacity, capacity_usage_pct } = subscription;
  const isUnlimited = vehicle_capacity === null;
  const remaining = isUnlimited ? null : Math.max(0, vehicle_capacity - current_vehicles_count);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all',
        is_at_capacity
          ? 'border-red-200 bg-linear-to-br from-red-50/70 via-white to-amber-50/40 shadow-xs'
          : 'border-blue-100 bg-linear-to-br from-blue-50/60 via-white to-slate-50/50 shadow-xs'
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Left info */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#02306B] px-3 py-1 text-xs font-bold text-white shadow-xs">
              <Sparkles className="h-3 w-3 text-amber-300" />
              Forfait {plan.name}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              0% de commission CarDrive
            </span>
            {is_at_capacity && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 animate-pulse">
                <AlertTriangle className="h-3.5 w-3.5" />
                Capacité atteinte
              </span>
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">
              Capacité du parc :{' '}
              <span className="text-[#02306B]">
                {current_vehicles_count} / {isUnlimited ? 'Illimité' : `${vehicle_capacity} véhicules`}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isUnlimited ? (
                'Votre concession bénéficie d’un quota illimité de véhicules actifs.'
              ) : is_at_capacity ? (
                <span className="text-red-700 font-semibold">
                  Limite atteinte ! Vous ne pouvez plus ajouter de véhicule sans passer au palier supérieur.
                </span>
              ) : (
                `Il vous reste ${remaining} place${(remaining ?? 0) > 1 ? 's' : ''} disponible${(remaining ?? 0) > 1 ? 's' : ''} dans votre formule actuelle.`
              )}
            </p>
          </div>
        </div>

        {/* Right action & progress */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:min-w-85">
          
          {/* Progress bar */}
          {!isUnlimited && (
            <div className="w-full sm:w-44 space-y-1">
              <div className="flex justify-between text-[11px] font-semibold">
                <span className="text-slate-500">Utilisation</span>
                <span className={is_at_capacity ? 'text-red-600' : 'text-slate-700'}>
                  {capacity_usage_pct}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={cn(
                    'h-full transition-all duration-500 rounded-full',
                    is_at_capacity
                      ? 'bg-red-500'
                      : capacity_usage_pct > 80
                      ? 'bg-amber-500'
                      : 'bg-[#02306B]'
                  )}
                  style={{ width: `${capacity_usage_pct}%` }}
                />
              </div>
            </div>
          )}

          {/* Upgrade button */}
          <button
            type="button"
            onClick={onOpenUpgradeModal}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer',
              is_at_capacity
                ? 'bg-[#E63946] hover:bg-red-700 text-white'
                : 'bg-white hover:bg-slate-50 text-[#02306B] border border-blue-200'
            )}
          >
            <span>{is_at_capacity ? 'Augmenter ma capacité' : "Changer de forfait"}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>

        </div>

      </div>
    </div>
  );
}
