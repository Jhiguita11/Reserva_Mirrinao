// Reemplaza panoramas de OBRA BLANCA con los archivos nuevos del cliente
// (entregados en public/projects/Mirriñao/Remplazos/, TIFF 8000x4000 con
// doble extension .tiff.tiff). Solo toca obra blanca; NO toca obra gris.
//
// Genera, por cada escena:
//   panoramas/casa-grande/<escena>.jpg         8192 ancho q90 mozjpeg (viewer 2D)
//   panoramas/casa-grande/vr/<escena>.jpg      4096x2048 q82        (Meta Quest / A-Frame)
//   panoramas/casa-grande/mobile/<escena>.jpg  4096x2048 q82 mozjpeg (movil)
//
// Uso: node scripts/replace-mirrinao.mjs

import sharp from 'sharp';
import { join } from 'path';

sharp.cache(false);

const SRC = 'public/projects/Mirriñao/Remplazos';
const PANO_OUT = 'public/projects/melendez/mirrinao/panoramas/casa-grande';
const VR_OUT = join(PANO_OUT, 'vr');
const MOB_OUT = join(PANO_OUT, 'mobile');

// src (en Remplazos) -> nombre destino
const SCENES = {
  'Acceso.tiff.tiff': 'acceso.jpg',
  'Sala.tiff.tiff': 'sala.jpg',
  'Comedor.tiff.tiff': 'comedor.jpg',
  'Cocina_Patio.tiff.tiff': 'cocina-patio.jpg',
  'Alcoba_Principal.tiff.tiff': 'alcoba-principal.jpg',
  'Alcoba_Auxiliar_1.tiff.tiff': 'alcoba-auxiliar-1.jpg',
  'Alcoba_Auxiliar_2.tiff.tiff': 'alcoba-auxiliar-2.jpg',
  'Baño_Principal.tiff.tiff': 'bano-principal.jpg',
  'Baño_Social.tiff.tiff': 'bano-social.jpg',
  'Patio_Exterior.tiff.tiff': 'patio-exterior.jpg',
};

const opt = { limitInputPixels: false };
const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';
const kb = (n) => (n / 1024).toFixed(0) + ' KB';

for (const [src, dest] of Object.entries(SCENES)) {
  const srcPath = join(SRC, src);
  console.log(`\n${dest}`);
  try {
    // Escritorio 8K
    const d = await sharp(srcPath, opt)
      .resize({ width: 8192, withoutEnlargement: true })
      .jpeg({ quality: 90, mozjpeg: true })
      .toFile(join(PANO_OUT, dest));
    console.log(`  2D  ${d.width}x${d.height}  ${mb(d.size)}`);

    // VR 4096x2048
    const v = await sharp(srcPath, opt)
      .resize(4096, 2048, { fit: 'fill' })
      .jpeg({ quality: 82 })
      .toFile(join(VR_OUT, dest));
    console.log(`  VR  ${v.width}x${v.height}  ${kb(v.size)}`);

    // Movil 4096x2048
    const m = await sharp(srcPath, opt)
      .resize({ width: 4096, height: 2048, fit: 'fill', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(join(MOB_OUT, dest));
    console.log(`  MOB ${m.width}x${m.height}  ${kb(m.size)}`);
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
  }
}

console.log('\nReemplazo de obra blanca completo.');
