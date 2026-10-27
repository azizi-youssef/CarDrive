import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../lib/i18n/config';
import { translations } from '../lib/i18n/translations';
import { fr } from '../lib/i18n/translations/fr';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[AssertionFailed] ${message}`);
  }
}

console.log('🧪 Testing i18n system...');

// 1. Check supported locales count and codes
assert(DEFAULT_LOCALE === 'fr', 'Default locale must be fr');
assert(SUPPORTED_LOCALES.length === 5, 'Should have 5 supported locales');
const codes = SUPPORTED_LOCALES.map((l) => l.code);
assert(codes.includes('fr'), 'Must support fr');
assert(codes.includes('ar'), 'Must support ar');
assert(codes.includes('de'), 'Must support de');
assert(codes.includes('es'), 'Must support es');
assert(codes.includes('nl'), 'Must support nl');

// 2. Check Arabic RTL direction
const arLocale = SUPPORTED_LOCALES.find((l) => l.code === 'ar');
assert(arLocale?.direction === 'rtl', 'Arabic must be RTL');

// 3. Check that every locale has all sections and keys from French base
const sections = Object.keys(fr) as (keyof typeof fr)[];

for (const code of codes) {
  const dict = translations[code];
  assert(Boolean(dict), `Dictionary for ${code} must exist`);

  for (const section of sections) {
    assert(Boolean(dict[section]), `Section '${section}' must exist in ${code}`);

    const baseKeys = Object.keys(fr[section]);
    for (const key of baseKeys) {
      const val = (dict[section] as Record<string, string>)[key];
      assert(
        typeof val === 'string' && val.trim().length > 0,
        `Key '${section}.${key}' in locale '${code}' must be a non-empty string`
      );
    }
  }
}

console.log('✅ All 5 locales (FR, AR, DE, ES, NL) validated with 100% complete key coverage!');
