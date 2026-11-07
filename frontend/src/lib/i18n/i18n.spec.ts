import { describe, expect, it } from 'vitest';
import { translations } from './translations';
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  localeDirection,
  localeFromAcceptLanguage,
  resolveLocale,
  type Locale,
} from './config';

type Dict = Record<string, unknown>;

/** Toutes les clés « a.b.c » d'un dictionnaire */
function keyPaths(dict: Dict, prefix = ''): string[] {
  return Object.entries(dict).flatMap(([key, value]) =>
    value && typeof value === 'object' ? keyPaths(value as Dict, `${prefix}${key}.`) : [`${prefix}${key}`]
  );
}

function valueAt(dict: Dict, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => (node as Dict | undefined)?.[key], dict);
}

const reference = translations.fr as unknown as Dict;
const referenceKeys = keyPaths(reference).sort();
const locales = SUPPORTED_LOCALES.map((option) => option.code);

describe('Dictionnaires de traduction (référence : français)', () => {
  it('les six langues sont prises en charge', () => {
    expect([...locales].sort()).toEqual(['ar', 'de', 'en', 'es', 'fr', 'nl']);
  });

  it.each(locales)('%s : mêmes clés que le français', (locale) => {
    expect(keyPaths(translations[locale] as unknown as Dict).sort()).toEqual(referenceKeys);
  });

  it.each(locales)('%s : aucune valeur vide', (locale) => {
    const dict = translations[locale] as unknown as Dict;
    const empty = referenceKeys.filter((path) => typeof valueAt(dict, path) !== 'string' || !String(valueAt(dict, path)).trim());
    expect(empty).toEqual([]);
  });

  it.each(locales)('%s : les variables {…} sont conservées (aucune variable inconnue)', (locale) => {
    const dict = translations[locale] as unknown as Dict;
    for (const path of referenceKeys) {
      const expected: string[] = [...(String(valueAt(reference, path)).match(/\{\w+\}/g) ?? [])].sort();
      const actual: string[] = [...(String(valueAt(dict, path)).match(/\{\w+\}/g) ?? [])].sort();
      // Aucune variable absente du français (elle ne serait jamais remplacée)
      expect(actual.filter((v) => !expected.includes(v)), `${locale}:${path}`).toEqual([]);
      // Forme du singulier : le nombre peut être écrit en toutes lettres (ex. « سيارة واحدة »)
      if (!path.endsWith('One')) expect(actual, `${locale}:${path}`).toEqual(expected);
    }
  });

  it.each(locales.filter((locale) => locale !== 'fr'))('%s : pas de texte laissé en français', (locale) => {
    const dict = translations[locale] as unknown as Dict;
    // Valeurs identiques tolérées : noms propres, sigles, devises
    const allowed = /^(FAQ|Contact|Nador|SUV & 4x4|MAD|DH|Destinations|Marchica Lagoon Resort|Prestige|Compacte)$/;
    const untranslated = referenceKeys.filter((path) => {
      const value = String(valueAt(dict, path));
      return value === String(valueAt(reference, path)) && !allowed.test(value);
    });
    expect(untranslated).toEqual([]);
  });
});

describe('Langue de la requête', () => {
  it('seul l’arabe s’écrit de droite à gauche', () => {
    const directions = Object.fromEntries(locales.map((locale) => [locale, localeDirection(locale as Locale)]));
    expect(directions).toEqual({ fr: 'ltr', ar: 'rtl', en: 'ltr', de: 'ltr', es: 'ltr', nl: 'ltr' });
  });

  it('cookie invalide → langue par défaut', () => {
    expect(resolveLocale('ar')).toBe('ar');
    expect(resolveLocale('EN')).toBe('en');
    expect(resolveLocale('xx')).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale('<script>')).toBe(DEFAULT_LOCALE);
  });

  it('Accept-Language : première langue prise en charge selon la préférence', () => {
    expect(localeFromAcceptLanguage('ar-MA,ar;q=0.9,fr;q=0.8')).toBe('ar');
    expect(localeFromAcceptLanguage('en-GB,en;q=0.9')).toBe('en');
    expect(localeFromAcceptLanguage('zh-CN,nl;q=0.5,de;q=0.7')).toBe('de');
    expect(localeFromAcceptLanguage('ja,zh')).toBe(DEFAULT_LOCALE);
    expect(localeFromAcceptLanguage('')).toBe(DEFAULT_LOCALE);
    expect(localeFromAcceptLanguage('es;q=0')).toBe(DEFAULT_LOCALE);
  });
});
