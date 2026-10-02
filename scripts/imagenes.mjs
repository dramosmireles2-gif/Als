// Genera versiones responsivas (AVIF y WebP) de las fotos del sitio.
// Uso: npm run imagenes  →  escribe en public/img/
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const FOTOS = {
  'hero2.webp':          [480, 800, 1122],
  'cat-vestidos.webp':   [400, 700],
  'cat-zapatos.webp':    [400, 700],
  'cat-bolsas.webp':     [400, 700],
  'cat-accesorios.webp': [400, 700],
  'interior1.webp':      [480, 900],
  'interior2.webp':      [480, 900],
  'interior3.webp':      [480, 900],
};

await mkdir('public/img', { recursive: true });
for (const [archivo, anchos] of Object.entries(FOTOS)) {
  const base = archivo.replace(/[.]webp$/, '');
  for (const w of anchos) {
    const img = sharp(`public/${archivo}`).resize({ width: w, withoutEnlargement: true });
    await img.clone().webp({ quality: 74 }).toFile(`public/img/${base}-${w}.webp`);
    await img.clone().avif({ quality: 52 }).toFile(`public/img/${base}-${w}.avif`);
  }
  console.log('listo', archivo);
}

// Ícono y logo en tamaños chicos (el original mide 2048 px)
await sharp('public/Icono.webp').resize(48).png().toFile('public/favicon-48.png');
await sharp('public/Icono.webp').resize(180).png().toFile('public/apple-touch-icon.png');
await sharp('public/Icono.webp').resize(128).webp({ quality: 82 }).toFile('public/img/logo-128.webp');
console.log('listo ícono y logo');
