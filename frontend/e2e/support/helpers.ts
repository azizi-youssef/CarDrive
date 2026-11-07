import { expect, type Page } from '@playwright/test';
import type { TestAccount } from './env';

export type LoginPortal = 'client' | 'agency' | 'admin';

/** Connexion par le formulaire réel (aucun contournement de l'authentification). */
export async function login(page: Page, portal: LoginPortal, account: TestAccount) {
  await page.goto(`/login?portal=${portal}`);
  await page.locator('#cd-login-email').fill(account.email);
  await page.locator('#cd-login-password').fill(account.password);
  await page.locator('button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
}

/** Lien de la première fiche véhicule du catalogue (données réelles). */
export async function firstVehicleHref(page: Page, catalogPath = '/search'): Promise<string | null> {
  await page.goto(catalogPath);
  const link = page.locator('main a[href^="/cars/"]').first();
  try {
    await link.waitFor({ state: 'attached', timeout: 20_000 });
  } catch {
    return null;
  }
  return link.getAttribute('href');
}

/** Aucune barre de défilement horizontale (mise en page, notamment en RTL et sur mobile). */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'débordement horizontal (px)').toBeLessThanOrEqual(1);
}

/** Erreurs de console, hors bruit connu des extensions et du rechargement à chaud. */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/Download the React DevTools|\[HMR\]|\[Fast Refresh\]|favicon/i.test(text)) return;
    errors.push(text);
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}
