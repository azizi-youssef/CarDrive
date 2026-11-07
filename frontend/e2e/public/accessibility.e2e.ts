import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { firstVehicleHref } from '../support/helpers';

/**
 * Contrôle automatique WCAG 2.2 A/AA (axe-core) sur les pages publiques principales.
 * Bloquant pour les violations « critical » et « serious ».
 * Un contrôle automatique ne couvre qu'une partie des critères : il complète, sans la remplacer,
 * la vérification manuelle (clavier, lecteur d'écran, zoom 200 %).
 */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function audit(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const blocking = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  const summary = blocking.map(
    (v) => `${v.impact} · ${v.id} · ${v.help} (${v.nodes.length}) → ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`
  );
  return { blocking, summary };
}

for (const path of ['/', '/search', '/motos', '/agencies', '/login?portal=client']) {
  test(`axe WCAG 2.2 AA : ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const { blocking, summary } = await audit(page);
    expect(blocking, summary.join('\n')).toEqual([]);
  });
}

test('axe WCAG 2.2 AA : fiche véhicule', async ({ page }) => {
  const href = await firstVehicleHref(page);
  test.skip(!href, 'Aucun véhicule publié sur cet environnement.');
  await page.goto(href!);
  await page.waitForLoadState('networkidle');
  const { blocking, summary } = await audit(page);
  expect(blocking, summary.join('\n')).toEqual([]);
});
