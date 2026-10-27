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

function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  try {
    // 1. Check URL query param ?lang=xx
    const urlParams = new URLSearchParams(window.location.search);
    const queryLang = urlParams.get('lang') as Locale;
    if (queryLang && SUPPORTED_LOCALES.some((l) => l.code === queryLang)) {
      return queryLang;
    }

    // 2. Check localStorage
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
    if (saved && SUPPORTED_LOCALES.some((l) => l.code === saved)) {
      return saved;
    }

    // 3. Check Cookie
    const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE_KEY}=([^;]*)`));
    if (match && match[1]) {
      const cookieLang = decodeURIComponent(match[1]) as Locale;
      if (SUPPORTED_LOCALES.some((l) => l.code === cookieLang)) {
        return cookieLang;
      }
    }

    // 4. Check Browser navigator.language
    const browserLang = (navigator.language || '').slice(0, 2).toLowerCase() as Locale;
    if (browserLang && SUPPORTED_LOCALES.some((l) => l.code === browserLang)) {
      return browserLang;
    }
  } catch (err) {
    console.warn('[i18n] Erreur détection locale initiale:', err);
  }

  return DEFAULT_LOCALE;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectInitialLocale());

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
