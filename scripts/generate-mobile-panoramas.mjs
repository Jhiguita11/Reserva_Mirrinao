// Genera versiones MOVILES (4096x2048) de los panoramas del tour a partir de
// los JPG de escritorio (8000x4000) que ya viven en public/.
//
// Por que: la mayoria de GPUs moviles topan el tamano de textura en 4096px, asi
// que un equirectangular de 8000px se decodifica entero (32 MP, pico de memoria)
// y luego WebGL lo reduce a la fuerza -> jank sin ganancia de nitidez. Servir
// 4096x2048 en movil elimina ese costo; el escritorio sigue usando los 8000px.
//
// Salida:
//   panoramas/casa-grande/mobile/<escena>.jpg            4096x2048 q82 mozjpeg
//   panoramas/casa-grande/obra-gris/mobile/<escena>.jpg  4096x2048 q82 mozjpeg
//
// Uso: node scripts/generate-mobile-panoramas.mjs

import sharp from 'sharp';
import { mkdir, readdir } from 'fs/promises';
import { join } from 'path';

sharp.cache(false);

const PANO      = 'public/projects/melendez/mirrinao/panoramas/casa-grande';
const GRIS      = join(PANO, 'obra-gris');
const PANO_MOB  = join(PANO, 'mobile');
const GRIS_MOB  = join(GRIS, 'mobile');

const opt = { limitInputPixels: false };
const kb = (n) => (n / 1024).toFixed(0) + ' KB';

async function convertDir(srcDir, destDir) {
  await mkdir(destDir, { recursive: true });
  const entries = await readdir(srcDir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && /\.jpe?g$/i.test(e.name))
    .map((e) => e.name);

  for (const name of files) {
    const src = join(srcDir, name);
    const dest = join(destDir, name);
    const info = await sharp(src, opt)
      .resize({ width: 4096, height: 2048, fit: 'fill', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(dest);
    console.log(`  ${name.padEnd(26)} -> ${kb(info.size)}`);
  }
  return files.length;
}

async function main() {
  console.log('Amueblado (casa-grande) -> mobile/');
  const a = await convertDir(PANO, PANO_MOB);
  console.log(`Obra gris (casa-grande/obra-gris) -> mobile/`);
  const g = await convertDir(GRIS, GRIS_MOB);
  console.log(`\nListo: ${a} amueblados + ${g} obra gris a 4096x2048.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
