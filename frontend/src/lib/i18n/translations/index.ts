import { fr, type Translations } from './fr';
import { ar } from './ar';
import { de } from './de';
import { es } from './es';
import { nl } from './nl';
import type { Locale } from '../config';

export const translations: Record<Locale, Translations> = {
  fr,
  ar,
  de,
  es,
  nl,
};

export type { Translations };
