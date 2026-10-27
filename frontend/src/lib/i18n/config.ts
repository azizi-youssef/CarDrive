export type Locale = 'fr' | 'ar' | 'de' | 'es' | 'nl';

export interface LanguageOption {
  code: Locale;
  label: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LOCALES: LanguageOption[] = [
  {
    code: 'fr',
    label: 'Français',
    nativeName: 'Français',
    flag: '🇫🇷',
    direction: 'ltr',
  },
  {
    code: 'ar',
    label: 'Arabe',
    nativeName: 'العربية',
    flag: '🇲🇦',
    direction: 'rtl',
  },
  {
    code: 'de',
    label: 'Allemand',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    direction: 'ltr',
  },
  {
    code: 'es',
    label: 'Espagnol',
    nativeName: 'Español',
    flag: '🇪🇸',
    direction: 'ltr',
  },
  {
    code: 'nl',
    label: 'Néerlandais',
    nativeName: 'Nederlands',
    flag: '🇳🇱',
    direction: 'ltr',
  },
];

export const DEFAULT_LOCALE: Locale = 'fr';
export const LOCALE_COOKIE_KEY = 'cardrive_locale';
export const LOCALE_STORAGE_KEY = 'cardrive_locale';
