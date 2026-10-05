import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Agency } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Phone, MessageSquare, Star, ShieldCheck, Car, ArrowRight } from 'lucide-react';

interface AgencyCardProps {
  agency: Agency;
  carCount?: number;
}

export function AgencyCard({ agency, carCount }: AgencyCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden card-hover flex flex-col justify-between shadow-sm">
      <div>
        {/* Banner with Logo Overlay */}
        <div className="relative h-28 w-full bg-slate-100">
          <Image
            src={agency.banner_url || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80'}
            alt={agency.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Logo */}
          <div className="absolute -bottom-4 left-4 w-14 h-14 rounded-xl border-2 border-white bg-white overflow-hidden shadow-md">
            <Image
              src={agency.logo_url}
              alt={`Logo ${agency.name}`}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>

          {/* Verification Badge */}
          {agency.verified && (
            <div className="absolute top-3 right-3">
              <Badge variant="verified" icon>
                Partenaire Vérifié
              </Badge>
            </div>
          )}
        </div>

        {/* Agency Content */}
        <div className="pt-6 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 hover:text-[#0B1220] transition-colors">
                <Link href={`/agencies/${agency.slug}`}>
                  {agency.name}
                </Link>
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{agency.address}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg shrink-0">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{agency.rating.toFixed(1)}</span>
              <span className="text-[10px] text-slate-400 font-normal">({agency.review_count})</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 my-3">
            {agency.description}
          </p>

          {/* Fleet Count Info */}
          {carCount !== undefined && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 py-2 border-y border-slate-100 mb-3">
              <Car className="w-3.5 h-3.5 text-slate-500" />
              <span>{carCount} véhicule{carCount > 1 ? 's' : ''} disponible{carCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 sm:p-5 pt-0">
        <Link
          href={`/agencies/${agency.slug}`}
          className="w-full py-2.5 px-4 rounded-xl bg-[#02306B] hover:bg-[#064181] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Car className="w-3.5 h-3.5 text-[#FF7300]" />
          <span>Voir la flotte & Réserver</span>
          <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-300" />
        </Link>
        <p className="text-[10px] text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Réservation garantie via CarDrive</span>
        </p>
      </div>
    </div>
  );
}
