// Verifica que el tour sirve panoramas 8000px en desktop y 4096px (/mobile/) en
// movil, usando Playwright headless. Requiere el dev server en localhost:3000.
//
// Uso: node scripts/verify-pano-resolution.mjs

import { chromium, devices } from 'playwright';

const URL = 'http://localhost:3000/?preview=casa';
const PANO_RE = /panoramas\/casa-grande\/.*\.jpe?g/i;

async function run(label, contextOpts) {
  const browser = await chromium.launch();
  const context = await browser.newContext(contextOpts);
  const page = await context.newPage();

  const requested = [];
  page.on('request', (req) => {
    const u = req.url();
    if (PANO_RE.test(u)) requested.push(u.replace(/^https?:\/\/[^/]+/, ''));
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  // Dar tiempo a Pannellum a inicializar y pedir el primer panorama
  await page.waitForTimeout(4000);

  const gpu = await page.evaluate(() => {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      const maxTex = gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : null;
      return {
        maxTex,
        coarse: window.matchMedia('(pointer: coarse)').matches,
        screen: `${window.screen.width}x${window.screen.height}`,
      };
    } catch (e) {
      return { error: String(e) };
    }
  });

  await browser.close();

  const mobileReqs = requested.filter((u) => u.includes('/mobile/'));
  const fullReqs = requested.filter((u) => !u.includes('/mobile/'));
  return { label, gpu, requested, mobileReqs, fullReqs };
}

function report(r) {
  console.log(`\n=== ${r.label} ===`);
  console.log(`  GPU MAX_TEXTURE_SIZE: ${r.gpu.maxTex}  | pointer:coarse=${r.gpu.coarse} | screen=${r.gpu.screen}`);
  console.log(`  Panoramas pedidos: ${r.requested.length}  (mobile=${r.mobileReqs.length}, full=${r.fullReqs.length})`);
  for (const u of r.requested) console.log(`    ${u}`);
}

async function main() {
  const desktop = await run('DESKTOP (1440x900)', {
    viewport: { width: 1440, height: 900 },
  });
  const mobile = await run('MOVIL (iPhone 13)', {
    ...devices['iPhone 13'],
  });

  report(desktop);
  report(mobile);

  console.log('\n=== VEREDICTO ===');
  const desktopOk = desktop.requested.length > 0 && desktop.mobileReqs.length === 0;
  // En headless la GPU puede reportar MAX_TEXTURE_SIZE alto; el fallback de
  // pantalla tactil pequena debe activar /mobile/ en la emulacion de iPhone.
  const mobileOk = mobile.mobileReqs.length > 0 && mobile.fullReqs.length === 0;
  console.log(`  Desktop usa 8000px (sin /mobile/): ${desktopOk ? 'OK' : 'FALLO'}`);
  console.log(`  Movil usa 4096px (/mobile/):       ${mobileOk ? 'OK' : 'FALLO'}`);
  process.exit(desktopOk && mobileOk ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
