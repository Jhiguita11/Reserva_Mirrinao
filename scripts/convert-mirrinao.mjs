// Convierte los assets crudos de MIRRIÑAO (Casa Grande) entregados por el cliente
// desde public/projects/Mirriñao/ (TIFF 8000x4000) a JPG web-ready en la ruta
// que espera la app: public/projects/melendez/mirrinao/...
//
// Genera:
//   panoramas/casa-grande/<escena>.jpg            8000x4000  q90 mozjpeg (viewer 2D)
//   panoramas/casa-grande/obra-gris/<escena>.jpg  8000x4000  q90 mozjpeg (variante obra gris)
//   panoramas/casa-grande/vr/<escena>.jpg         4096x2048  q82 (Meta Quest / A-Frame)
//   images/home.jpg                               2560 ancho q85 (splash / home)
//
// Uso: node scripts/convert-mirrinao.mjs

import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join } from 'path';

sharp.cache(false);

const SRC = 'public/projects/Mirriñao';
const OUT = 'public/projects/melendez/mirrinao';

const PANO_OUT      = join(OUT, 'panoramas/casa-grande');
const PANO_GRIS_OUT = join(PANO_OUT, 'obra-gris');
const VR_OUT        = join(PANO_OUT, 'vr');
const IMG_OUT       = join(OUT, 'images');

// --- Panoramas amueblados (obra blanca) ---
const AMUEBLADO = {
  'Acceso.tiff':            'acceso.jpg',
  'Sala.tiff':              'sala.jpg',
  'Comedor.tiff':           'comedor.jpg',
  'Cocina_Patio.tiff':      'cocina-patio.jpg',
  'Alcoba_Principal.tiff':  'alcoba-principal.jpg',
  'Alcoba_Auxiliar_1.tiff': 'alcoba-auxiliar-1.jpg',
  'Alcoba_Auxiliar_2.tiff': 'alcoba-auxiliar-2.jpg',
  'Baño_Principal.tiff':    'bano-principal.jpg',
  'Baño_Social.tiff':       'bano-social.jpg',
  'Patio_Exterior.tiff':    'patio-exterior.jpg',
};

// --- Panoramas en obra gris (solo las 5 entregadas) ---
const OBRA_GRIS = {
  'Sala.tif':              'sala.jpg',
  'Cocina_Patio.tif':      'cocina-patio.jpg',
  'Alcoba_Principal.tiff': 'alcoba-principal.jpg',
  'Baño_Social.tiff':      'bano-social.jpg',
  'Patio_Exterior.tif':    'patio-exterior.jpg',
};

const opt = { limitInputPixels: false };
const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';

async function convertPano(srcPath, destPath) {
  const info = await sharp(srcPath, opt)
    .resize({ width: 8192, withoutEnlargement: true })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(destPath);
  return info;
}

await mkdir(PANO_GRIS_OUT, { recursive: true });
await mkdir(VR_OUT, { recursive: true });
await mkdir(IMG_OUT, { recursive: true });

console.log('=== Panoramas amueblados → casa-grande/ ===');
for (const [src, dest] of Object.entries(AMUEBLADO)) {
  process.stdout.write(`  ${src} → ${dest} ... `);
  try {
    const info = await convertPano(join(SRC, '01_360', src), join(PANO_OUT, dest));
    console.log(`OK (${mb(info.size)})`);
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
}

console.log('\n=== Panoramas obra gris → casa-grande/obra-gris/ ===');
for (const [src, dest] of Object.entries(OBRA_GRIS)) {
  process.stdout.write(`  ${src} → obra-gris/${dest} ... `);
  try {
    const info = await convertPano(join(SRC, '01_360/360_ObraGris', src), join(PANO_GRIS_OUT, dest));
    console.log(`OK (${mb(info.size)})`);
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
}

console.log('\n=== Copias VR (4096x2048) → casa-grande/vr/ ===');
for (const dest of Object.values(AMUEBLADO)) {
  process.stdout.write(`  ${dest} ... `);
  try {
    const info = await sharp(join(PANO_OUT, dest), opt)
      .resize(4096, 2048, { fit: 'fill' })
      .jpeg({ quality: 82 })
      .toFile(join(VR_OUT, dest));
    console.log(`OK (${mb(info.size)})`);
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
}

console.log('\n=== Imagen home → images/home.jpg ===');
try {
  const info = await sharp(join(SRC, '06_ImagenInicio/CM_RM_HOME_Final.tiff'), opt)
    .resize({ width: 2560, withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(join(IMG_OUT, 'home.jpg'));
  console.log(`  home.jpg OK (${mb(info.size)})`);
} catch (e) {
  console.log(`  ERROR: ${e.message}`);
}

console.log('\n¡Conversión MIRRIÑAO completa!');
