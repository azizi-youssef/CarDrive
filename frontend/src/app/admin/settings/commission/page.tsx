'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import {
  ArrowLeft,
  Percent,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Save,
  HelpCircle,
  RefreshCw,
  Coins,
  History,
  TrendingUp,
} from 'lucide-react';

export default function CommissionSettingsPage() {
  const [currentRate, setCurrentRate] = useState<number>(15.0);
  const [newRateInput, setNewRateInput] = useState<string>('15.0');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings/commission');
      const data = await res.json();
      if (data.success && data.settings) {
        const rate = Number(data.settings.commission_rate || 15.0);
        setCurrentRate(rate);
        setNewRateInput(rate.toString());
      }
    } catch (err) {
      console.warn('Could not fetch commission settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const parsed = parseFloat(newRateInput);

    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      setFeedback({
        type: 'error',
        message: 'Veuillez saisir un pourcentage valide compris entre 0 et 100 %.',
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/settings/commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commission_rate: parsed }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentRate(parsed);
        setFeedback({
          type: 'success',
          message: `Le taux de commission de la plateforme a été mis à jour avec succès à ${parsed.toFixed(2)} %.`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Erreur lors de l’enregistrement.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Erreur réseau.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Exemple interactif
  const sampleTotal = 1800; // 5 jours à 360 DH
  const parsedNewRate = isNaN(parseFloat(newRateInput)) ? currentRate : parseFloat(newRateInput);
  const sampleCommission = Math.round((sampleTotal * parsedNewRate) / 100);
  const sampleAgency = sampleTotal - sampleCommission;

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation retour */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l'administration CarDrive</span>
          </Link>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Paramètres Plateforme
          </span>
        </div>

        {/* Titre */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#02306B] text-xs font-bold mb-2">
            <Coins className="w-3.5 h-3.5 text-[#FF7300]" />
            <span>Modèle Économique & Monétisation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Commission de la plateforme
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Définissez le pourcentage prélevé par CarDrive sur chaque réservation de véhicule confirmée.
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Main Settings Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* Taux actuel vs nouveau */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-100">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Taux actuellement appliqué
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#02306B]">
                  {loading ? '...' : currentRate.toFixed(2)}
                </span>
                <span className="text-lg font-bold text-slate-500">%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Taux standard sur toutes les nouvelles demandes.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
                Règle de rétroactivité & historique
              </span>
              <p className="text-xs text-blue-950 font-medium leading-relaxed">
                Les réservations passées ou déjà confirmées <strong>conservent leur taux historique</strong> enregistré au moment de la confirmation.
              </p>
            </div>
          </div>

          {/* Formulaire de modification */}
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Nouveau taux de commission plateforme (%)
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={newRateInput}
                  onChange={(e) => setNewRateInput(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-300 font-extrabold text-lg text-slate-900 outline-none focus:border-[#02306B] focus:ring-2 focus:ring-[#02306B]/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                  %
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Recommandé pour la région de Nador : 15.00 % (garantit un bon équilibre entre attractivité pour les agences et rentabilité).
              </p>
            </div>

            {/* Simulateur instantané */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800 pb-1 border-b border-slate-200">
                <TrendingUp className="w-4 h-4 text-[#FF7300]" />
                <span>Simulation sur une réservation type (Dacia Duster 5 jours - 1 800 DH)</span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1 text-center">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Total payé</span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">{formatPrice(sampleTotal)}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-emerald-800">
                  <span className="text-[10px] text-emerald-600 font-semibold block">Part Agence</span>
                  <span className="font-extrabold text-xs sm:text-sm">{formatPrice(sampleAgency)}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-blue-200 text-[#02306B]">
                  <span className="text-[10px] text-blue-600 font-semibold block">Commission CarDrive</span>
                  <span className="font-extrabold text-xs sm:text-sm">{formatPrice(sampleCommission)}</span>
                </div>
              </div>
            </div>

            {/* Bouton Enregistrer */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={fetchSettings}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Réinitialiser</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-[#02306B] hover:bg-[#064181] disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-900/15 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Enregistrement...' : 'Enregistrer le nouveau taux'}</span>
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}
