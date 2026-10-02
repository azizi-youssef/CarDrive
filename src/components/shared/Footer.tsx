import React from 'react';
import Link from 'next/link';
import { Car, ShieldCheck, MapPin, Phone, MessageSquare } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#046c7a] flex items-center justify-center text-white">
                <Car className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Car<span className="text-[#14b8a6]">Drive</span>
              </span>
              <span className="text-[10px] uppercase font-bold bg-teal-900/60 text-teal-300 px-2 py-0.5 rounded border border-teal-700/50">
                Nador & Oriental
              </span>
            </div>
            
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              La 1ère plateforme locale multi-agences à Nador. Comparez les véhicules réels disponibles en temps réel auprès des agences vérifiées de la ville et de l’aéroport Al-Aroui.
            </p>

            <div className="flex items-center gap-3 pt-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5 text-teal-400 font-medium">
                <ShieldCheck className="w-4 h-4" /> 100% Agences Vérifiées
              </span>
              <span>•</span>
              <span>Sans frais cachés</span>
            </div>
          </div>

          {/* Points de prise en charge à Nador */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-semibold tracking-wide">Points Nador</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/search?location=aeroport" className="hover:text-teal-400 transition-colors">
                  Aéroport Nador Al-Aroui (NDR)
                </Link>
              </li>
              <li>
                <Link href="/search?location=marchica" className="hover:text-teal-400 transition-colors">
                  Corniche Marchica
                </Link>
              </li>
              <li>
                <Link href="/search?location=port" className="hover:text-teal-400 transition-colors">
                  Port de Beni Ansar (Ferry)
                </Link>
              </li>
              <li>
                <Link href="/search?location=centre" className="hover:text-teal-400 transition-colors">
                  Boulevard Mohammed V
                </Link>
              </li>
              <li>
                <Link href="/search?location=selouane" className="hover:text-teal-400 transition-colors">
                  Selouane & Zone Industrielle
                </Link>
              </li>
            </ul>
          </div>

          {/* Catégories populaires */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-semibold tracking-wide">Véhicules</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/search?category=SUV" className="hover:text-teal-400 transition-colors">
                  SUV & 4x4 Nador (Duster, Tucson)
                </Link>
              </li>
              <li>
                <Link href="/search?category=Économique" className="hover:text-teal-400 transition-colors">
                  Économique (Clio 5, Sandero)
                </Link>
              </li>
              <li>
                <Link href="/search?category=7 places" className="hover:text-teal-400 transition-colors">
                  7 à 9 places (Jogger, Vito)
                </Link>
              </li>
              <li>
                <Link href="/search?category=Luxe" className="hover:text-teal-400 transition-colors">
                  Luxe & Mariage (Range Rover, Mercedes)
                </Link>
              </li>
              <li>
                <Link href="/search?transmission=AUTOMATIC" className="hover:text-teal-400 transition-colors">
                  Boîte Automatique
                </Link>
              </li>
            </ul>
          </div>

          {/* Agences B2B & Support */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-semibold tracking-wide">Professionnels</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/agency/join" className="text-teal-300 font-semibold hover:underline">
                  Inscrire votre agence
                </Link>
              </li>
              <li>
                <Link href="/agency" className="hover:text-teal-400 transition-colors">
                  Accès Dashboard Agence
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-teal-400 transition-colors">
                  Administration
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-teal-400 transition-colors">
                  À propos de CarDrive
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-teal-400 transition-colors">
                  Questions fréquentes (FAQ)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 CarDrive. Conçu pour Nador et le Maroc. Tous droits réservés.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:underline">Conditions d’utilisation</Link>
            <Link href="/privacy" className="hover:underline">Confidentialité</Link>
            <Link href="/contact" className="hover:underline">Contactez-nous</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
