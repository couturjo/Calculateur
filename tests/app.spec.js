import { test, expect } from '@playwright/test';

async function openApp(page) {
  await page.route('**/@supabase/supabase-js**', route => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: "window.supabase = { createClient: () => ({ auth: { getSession: async () => ({ data: { session: null }, error: null }), signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Connexion de test simulée' } }), signOut: async () => ({ error: null }) }, from: () => ({ select() { return this; }, eq() { return this; }, order() { return this; }, limit() { return this; }, maybeSingle: async () => ({ data: null, error: null }), insert: async () => ({ error: null }), update() { return this; } }) }) };"
  }));
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#sbLoginForm')).toBeAttached();
  await page.waitForTimeout(150);
  return pageErrors;
}

test('les éléments critiques et les huit onglets sont présents', async ({ page }) => {
  const errors = await openApp(page);
  await expect(page.locator('#supabaseGate')).toBeAttached();
  await expect(page.locator('#sbLoginForm')).toBeVisible();
  await expect(page.locator('#sbEmail')).toBeVisible();
  await expect(page.locator('#sbPassword')).toBeVisible();
  await expect(page.locator('#stickyBar')).toBeAttached();
  await expect(page.locator('#mainNav .nav-btn')).toHaveCount(8);
  expect(errors, 'Aucune erreur JavaScript non interceptée au chargement').toEqual([]);
});

test('la barre salariale est dans le conteneur sticky et reste en haut au défilement', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => {
    document.querySelector('#supabaseGate')?.remove();
    document.body.classList.remove('login-locked');
    document.body.style.minHeight = '3000px';
  });
  const wrapper = page.locator('.sticky-wrap');
  const bar = page.locator('#stickyBar');
  expect(await bar.evaluate(el => el.closest('.sticky-wrap') !== null)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 700));
  await expect.poll(async () => (await wrapper.boundingBox())?.y).toBeLessThanOrEqual(1);
  await expect.poll(async () => (await bar.boundingBox())?.y).toBeLessThanOrEqual(1);
});

test('le formulaire de connexion conserve ses champs et son action', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('#sbEmail')).toHaveAttribute('type', 'email');
  await expect(page.locator('#sbPassword')).toHaveAttribute('type', 'password');
  await expect(page.locator('#sbLoginBtn')).toHaveText('Se connecter');
  await page.locator('#sbEmail').fill('test@example.com');
  await page.locator('#sbPassword').fill('mot-de-passe-invalide');
  await page.locator('#sbLoginBtn').click();
  await expect(page.locator('#sbLoginMessage')).toContainText('Connexion de test simulée');
  await expect(page.locator('#sbLoginBtn')).toBeEnabled();
});

test('la navigation change bien l’onglet actif', async ({ page }) => {
  await openApp(page);
  await page.locator('.nav-btn[data-tab="rfa"]').click();
  await expect(page.locator('.nav-btn[data-tab="rfa"]')).toHaveClass(/active/);
});
