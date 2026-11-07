import { cookies } from 'next/headers';
import { LOCALE_COOKIE_KEY, localeDirection, resolveLocale, type Locale } from './config';

/**
 * Langue de la requête, lue côté serveur (cookie posé par le navigateur ou par le middleware
 * lors de la première visite). Le premier HTML a ainsi la bonne langue et le bon sens d'écriture.
 */
export async function getServerLocale(): Promise<{ locale: Locale; dir: 'ltr' | 'rtl' }> {
  const store = await cookies();
  const locale = resolveLocale(store.get(LOCALE_COOKIE_KEY)?.value);
  return { locale, dir: localeDirection(locale) };
}
