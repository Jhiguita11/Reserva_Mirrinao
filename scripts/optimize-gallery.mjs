import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const SRC = 'public/projects/Mirriñao/03_Galeria';
const OUT = 'public/projects/melendez/mirrinao/images/renders';
mkdirSync(OUT, { recursive: true });

// [archivo origen, nombre destino]
const jobs = [
  ['CM_RM_Fotomontaje_Día.jpg',                 'fotomontaje-dia.jpg'],
  ['CM_RM_Fotomontaje_Noche.jpg',               'fotomontaje-noche.jpg'],
  ['CM_RM_Render Nivel observador_Final.jpg',   'nivel-observador.jpg'],
  ['CM_RM_HOME_Final.jpg',                       'home.jpg'],
];

for (const [src, dst] of jobs) {
  const input = path.join(SRC, src);
  const output = path.join(OUT, dst);
  const info = await sharp(input)
    .rotate() // respeta orientación EXIF
    .resize({ width: 2000, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(output);
  const kb = (info.size / 1024).toFixed(0);
  console.log(`✓ ${dst.padEnd(22)} ${info.width}x${info.height}  ${kb} KB`);
}
