'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  type Locale,
  type LanguageOption,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  LOCALE_COOKIE_KEY,
} from './config';
import { translations, type Translations } from './translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
  dir: 'ltr' | 'rtl';
  isRTL: boolean;
  currentLanguage: LanguageOption;
  supportedLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | null>(null);

/** Langue demandée explicitement dans l'URL (?lang=xx), sinon null */
function queryLocale(): Locale | null {
  try {
    const queryLang = new URLSearchParams(window.location.search).get('lang');
    return queryLang && SUPPORTED_LOCALES.some((l) => l.code === queryLang) ? (queryLang as Locale) : null;
  } catch {
    return null;
  }
}

/**
 * La langue initiale vient du serveur (cookie lu par le layout racine) : le premier rendu client est
 * identique au HTML serveur, sans erreur d'hydratation ni bascule de direction (RTL) après coup.
 */
export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT_LOCALE);

  // Après le montage : un ?lang= explicite l'emporte (lien partagé dans une langue donnée)
  useEffect(() => {
    const requested = queryLocale();
    if (requested && requested !== locale) setLocaleState(requested);
    // Exécuté une seule fois au montage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=31536000; SameSite=Lax`;

      // Synchronize <html> attributes
      const isArabic = locale === 'ar';
      document.documentElement.lang = locale;
      document.documentElement.dir = isArabic ? 'rtl' : 'ltr';

      if (isArabic) {
        document.documentElement.classList.add('is-rtl');
      } else {
        document.documentElement.classList.remove('is-rtl');
      }
    } catch (err) {
      console.warn('[i18n] Erreur persistance locale:', err);
    }
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    if (SUPPORTED_LOCALES.some((l) => l.code === newLocale)) {
      setLocaleState(newLocale);
    }
  };

  const currentLanguage = useMemo(() => {
    return SUPPORTED_LOCALES.find((l) => l.code === locale) || SUPPORTED_LOCALES[0];
  }, [locale]);

  const value = useMemo<LanguageContextType>(() => {
    const dir = locale === 'ar' ? 'rtl' : 'ltr';
    return {
      locale,
      setLocale,
      t: translations[locale] || translations.fr,
      dir,
      isRTL: dir === 'rtl',
      currentLanguage,
      supportedLanguages: SUPPORTED_LOCALES,
    };
  }, [locale, currentLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback for components used outside LanguageProvider (e.g. testing or isolated admin widgets)
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: translations[DEFAULT_LOCALE],
      dir: 'ltr',
      isRTL: false,
      currentLanguage: SUPPORTED_LOCALES[0],
      supportedLanguages: SUPPORTED_LOCALES,
    };
  }
  return context;
}

export function useTranslation() {
  const { t, locale, setLocale, isRTL, dir } = useLanguage();
  return { t, locale, setLocale, isRTL, dir };
}
