import Link from 'next/link';
import { Car, Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
            <Car className="w-12 h-12 text-[#02306B]" />
          </div>
        </div>

        {/* Code & Message */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
            Erreur 404
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Page introuvable
          </h1>
          <p className="text-sm text-slate-500 mt-3 leading-relaxed">
            Cette page n'existe pas ou a été déplacée. Peut-être que le véhicule que vous cherchez n'est plus disponible ?
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#02306B] hover:bg-[#064181] text-white text-sm font-semibold shadow transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </Link>

          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Chercher un véhicule</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
