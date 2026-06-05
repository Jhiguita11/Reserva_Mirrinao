// Verifica la navegación en obra gris: en la Sala, al pasar a obra gris deben
// quedar SOLO las burbujas hacia cuartos que también tienen gris (Segundo Piso
// = Baño Social, y Patio Exterior), y al pulsarlas el destino abre en gris.
//
// Requiere el dev server en localhost:3000.  Uso: node scripts/verify-gris-nav.mjs

import { chromium } from 'playwright';

const URL = 'http://localhost:3000/?preview=casa&scene=cg-sala';

const labels = (page) =>
  page.$$eval('.pano-bubble', (els) =>
    els.map((e) => {
      const pill = e.querySelector('.pano-bubble-label');
      const variant = e.classList.contains('pano-bubble-variant');
      return (variant ? '[VAR] ' : '') + (pill ? pill.textContent.trim() : '(sin label)');
    }),
  );

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const panoReqs = [];
  page.on('request', (r) => {
    const u = r.url();
    if (/panoramas\/casa-grande\/.*\.jpe?g/i.test(u)) panoReqs.push(u.replace(/^https?:\/\/[^/]+/, ''));
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('.pano-bubble', { timeout: 15000 });
  await page.waitForTimeout(1500);

  console.log('SALA amueblado — burbujas:');
  console.log('  ', (await labels(page)).join(' | '));

  // Pulsar el botón de variante (Ver obra gris). Usamos el click() nativo del
  // elemento porque las burbujas se reposicionan cada frame (pannellum) y un
  // clic por coordenadas falla. El evento burbujea al handler del hotspot.
  await page.$eval('.pano-bubble-variant', (el) => el.click());
  await page.waitForTimeout(2500);

  const grisLabels = await labels(page);
  console.log('SALA obra gris — burbujas:');
  console.log('  ', grisLabels.join(' | '));

  // Navegar "Segundo Piso" en gris → debe ir a Baño Social en gris
  const segundoPiso = await page.$$('.pano-bubble');
  let clicked = false;
  for (const b of segundoPiso) {
    const t = await b.evaluate((e) => e.querySelector('.pano-bubble-label')?.textContent || '');
    if (/segundo piso/i.test(t)) { await b.evaluate((e) => e.click()); clicked = true; break; }
  }
  await page.waitForTimeout(2500);
  const afterNav = await labels(page);

  await browser.close();

  console.log('Tras clic "Segundo Piso" (esperado: Baño Social en gris):');
  console.log('  ', afterNav.join(' | '));
  console.log('Panoramas pedidos:');
  for (const u of panoReqs) console.log('   ', u);

  // Veredicto
  const hasSegundo = grisLabels.some((l) => /segundo piso/i.test(l));
  const hasPatio = grisLabels.some((l) => /patio/i.test(l));
  const noAcceso = !grisLabels.some((l) => /acceso/i.test(l) && !/\[VAR\]/.test(l));
  const navegoGris = clicked && panoReqs.some((u) => /obra-gris\/.*bano-social/.test(u));

  console.log('\n=== VEREDICTO ===');
  console.log('  Gris muestra "Segundo Piso":           ', hasSegundo ? 'OK' : 'FALLO');
  console.log('  Gris muestra "Patio Exterior":         ', hasPatio ? 'OK' : 'FALLO');
  console.log('  Gris oculta cuartos sin gris (Acceso): ', noAcceso ? 'OK' : 'FALLO');
  console.log('  Navegó a Baño Social EN GRIS:          ', navegoGris ? 'OK' : 'FALLO');
  process.exit(hasSegundo && hasPatio && noAcceso && navegoGris ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
