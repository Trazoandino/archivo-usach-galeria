import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const url = process.env.GALLERY_TEST_URL || 'http://127.0.0.1:4176/archivo-usach/';
const browser = await chromium.launch({ headless: true, channel: process.env.GALLERY_BROWSER_CHANNEL || undefined, args: ['--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const failures = [];
page.on('pageerror', error => failures.push(error.message));
page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) failures.push(`Unexpected API request ${request.url()}`); });
try {
  await page.goto(url);
  await expect(page.locator('.card')).toHaveCount(7);
  await page.getByRole('searchbox').fill('garcia');
  await expect(page.locator('.card')).toHaveCount(1);
  await page.getByRole('searchbox').fill('sin coincidencias');
  await expect(page.getByText('No encontramos modelos con esa búsqueda.')).toBeVisible();
  await page.getByRole('button', { name: 'Ver toda la colección' }).click();
  await page.getByLabel('Colección', { exact: true }).selectOption('Polideportivo');
  await expect(page.locator('.card')).toHaveCount(2);
  await page.getByLabel('Colección', { exact: true }).selectOption('Todos');
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
  // Todos los archivos deben decodificarse y dibujarse: seis splats y una malla Draco.
  const ids = ['h5wzvilxwa5itqlc', 'serb4xxwzrtvt6lu', 'pusysnw5nqilomx2', 'gpzyc5z7jwfcuzsj', '4tnwb7lm6skcxldi', 'jzzlnisdth6v2atn', 'oarz4im7ixqwr5jm'];
  for (const id of ids) {
    await page.goto(`${url}#modelo=${id}`);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Explorar en 3D', exact: true }).click();
    await expect(page.locator('.library-scan-viewer')).toHaveAttribute('data-status', 'ready', { timeout: 90000 });
    await expect(page.locator('canvas')).toBeVisible();
    console.log(`Modelo listo: ${id}`);
    if (id === ids[0]) {
      await page.getByRole('button', { name: 'Giro automático' }).click();
      await expect(page.getByRole('button', { name: 'Pausar giro' })).toHaveAttribute('aria-pressed', 'true');
      // Spark necesita cuadros adicionales para preparar la representación GPU tras decodificar.
      await page.waitForTimeout(2500);
      await page.screenshot({ path: 'test-results/viewer.png' });
      await page.getByRole('button', { name: 'Restablecer vista' }).click();
      await expect(page.locator('.library-scan-viewer')).toHaveAttribute('data-status', 'ready', { timeout: 90000 });
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await expect(page.locator('.card')).toHaveCount(7);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
  await page.locator('.card-open').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Ver fotografía 2', exact: true }).click();
  await expect(page.locator('.stage-image')).toHaveAttribute('src', /-2\.webp$/);
  expect(await page.getByRole('dialog').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile-detail.png' });
  await page.getByRole('button', { name: 'Cerrar modelo' }).click();
  expect(failures).toEqual([]);
  console.log('OK: subruta de Pages, 7 modelos 3D, búsqueda, filtros, fotografías, enlace directo, cierre y móvil. Sin errores de red ni llamadas a API.');
} finally { await browser.close(); }
