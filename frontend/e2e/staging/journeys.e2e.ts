import { expect, test, type Page } from '@playwright/test';
import { e2eEnv, SKIP_NO_ACCOUNT, SKIP_NO_WRITES } from '../support/env';
import { firstVehicleHref, login } from '../support/helpers';

/**
 * Parcours authentifiés (1, 5 à 10) : environnement de test uniquement.
 * Chaque test est ignoré, avec sa raison, tant que le compte ou l'autorisation d'écriture manque.
 * Les données créées sont identifiables (préfixe « E2E ») et non publiées quand c'est possible.
 */

const runId = `E2E-${Date.now().toString(36).toUpperCase()}`;

async function openSidebarSection(page: Page, label: string) {
  const link = page.getByRole('button', { name: label, exact: true }).or(page.getByRole('link', { name: label, exact: true }));
  if (!(await link.first().isVisible())) {
    // Mobile : menu de navigation repliable
    await page.getByRole('button', { name: /Menu|Ouvrir la navigation/i }).first().click();
  }
  await link.first().click();
}

test.describe('Client', () => {
  test('1. inscription d’un compte client', async ({ page }) => {
    test.skip(!e2eEnv.allowWrites, SKIP_NO_WRITES);
    test.skip(!e2eEnv.signupDomain, 'E2E_SIGNUP_EMAIL_DOMAIN non configuré (boîte de réception de test).');
    await page.goto('/login?portal=client&mode=signup');
    await page.getByLabel('Nom complet').fill(`Client ${runId}`);
    await page.locator('#cd-login-email').fill(`${runId.toLowerCase()}@${e2eEnv.signupDomain}`);
    const password = `Kd-${runId}-pass!9`;
    await page.locator('#cd-login-password').fill(password);
    await page.getByLabel('Confirmer le mot de passe').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText(/Compte créé|Vérifiez votre boîte|confirm/i).first()).toBeVisible({ timeout: 30_000 });
  });

  test('1. connexion client puis accès à l’espace client', async ({ page }) => {
    test.skip(!e2eEnv.customer, SKIP_NO_ACCOUNT);
    await login(page, 'client', e2eEnv.customer!);
    await page.goto('/account');
    await expect(page).toHaveURL(/\/account/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('5. envoi d’une demande de réservation complète', async ({ page }) => {
    test.skip(!e2eEnv.customer, SKIP_NO_ACCOUNT);
    test.skip(!e2eEnv.allowWrites, SKIP_NO_WRITES);
    await login(page, 'client', e2eEnv.customer!);
    const href = await firstVehicleHref(page);
    test.skip(!href, 'Aucun véhicule publié.');
    await page.goto(href!);
    await expect(page.getByText('Disponible pour ces dates').first()).toBeVisible({ timeout: 20_000 });
    await page.locator('form button[type="submit"]').first().click();

    const dialog = page.getByRole('dialog').filter({ has: page.getByLabel(/Prénom/) });
    await dialog.getByLabel(/Prénom/).fill('Test');
    await dialog.getByLabel(/^Nom/).fill(runId);
    await dialog.getByLabel(/Téléphone/).fill('+212600000000');
    await dialog.getByLabel(/Date de naissance/).fill('1990-01-15');
    await dialog.getByLabel(/CIN ou passeport/).fill(`T${Date.now()}`.slice(0, 10));
    const license = dialog.getByLabel(/N° de permis/);
    if (await license.isVisible()) await license.fill(`P${Date.now()}`.slice(0, 10));
    const expiry = dialog.getByLabel(/Expiration du permis/);
    if (await expiry.isVisible()) await expiry.fill(`${new Date().getFullYear() + 3}-12-31`);

    for (let step = 1; step <= 3; step += 1) await dialog.getByRole('button', { name: /Continuer/ }).click();
    await dialog.getByRole('checkbox').last().check();
    const created = page.waitForResponse((r) => r.url().includes('/api/bookings') && r.request().method() === 'POST');
    await dialog.getByRole('button', { name: /Envoyer ma demande de réservation/ }).click();
    expect((await created).status()).toBe(201);
    await expect(dialog.getByRole('heading', { name: 'Votre demande a bien été envoyée' })).toBeFocused();
  });

  test('6. historique des réservations du client', async ({ page }) => {
    test.skip(!e2eEnv.customer, SKIP_NO_ACCOUNT);
    await login(page, 'client', e2eEnv.customer!);
    const response = await page.goto('/account/bookings');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
  });
});

test.describe('Agence', () => {
  test('7. connexion agence : tableau de bord de l’agence', async ({ page }) => {
    test.skip(!e2eEnv.agency, SKIP_NO_ACCOUNT);
    await login(page, 'agency', e2eEnv.agency!);
    await page.goto('/agency');
    await expect(page).toHaveURL(/\/agency/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('8. création d’un véhicule (non publié)', async ({ page }) => {
    test.skip(!e2eEnv.agency, SKIP_NO_ACCOUNT);
    test.skip(!e2eEnv.allowWrites, SKIP_NO_WRITES);
    await login(page, 'agency', e2eEnv.agency!);
    await page.goto('/agency');
    await openSidebarSection(page, 'Voitures');
    await page.getByRole('button', { name: 'Ajouter une voiture' }).first().click();

    const dialog = page.getByRole('dialog', { name: 'Ajouter un nouveau véhicule' });
    await dialog.getByLabel(/Marque/).fill('E2E');
    await dialog.getByLabel(/Modèle/).fill(runId);
    await dialog.getByRole('button', { name: /Tarifs & Conditions/ }).click();
    await dialog.getByLabel(/Prix par jour/).fill('400');
    await dialog.getByRole('button', { name: /Photos & Publication/ }).click();
    // Véhicule de test jamais visible des clients
    await dialog.getByRole('switch', { name: 'Publier immédiatement sur la marketplace' }).uncheck();
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog).toBeHidden({ timeout: 30_000 });
    await expect(page.getByText(runId).first()).toBeVisible();
  });

  test('9. gestion des réservations : liste et dossier accessibles', async ({ page }) => {
    test.skip(!e2eEnv.agency, SKIP_NO_ACCOUNT);
    await login(page, 'agency', e2eEnv.agency!);
    await page.goto('/agency');
    await openSidebarSection(page, 'Réservations');
    const firstRow = page.getByRole('button', { name: /Voir|Détails|KD-/ }).first();
    const hasBooking = await firstRow.isVisible().catch(() => false);
    test.skip(!hasBooking, 'Aucune réservation pour l’agence de test.');
    await firstRow.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(firstRow).toBeFocused();
  });
});

test.describe('Super administrateur', () => {
  test('10. gestion des agences : liste et formulaire de création', async ({ page }) => {
    test.skip(!e2eEnv.superAdmin, SKIP_NO_ACCOUNT);
    await login(page, 'admin', e2eEnv.superAdmin!);
    const response = await page.goto('/admin/agencies');
    expect(response?.status()).toBe(200);
    await page.getByRole('button', { name: 'Ajouter une agence' }).click();
    const dialog = page.getByRole('dialog', { name: 'Ajouter une nouvelle agence' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
