// Descarga las fotos de clientas elegidas para las tarjetas de ocasión y genera
// versiones AVIF/WebP en public/img/. Uso: node scripts/fotos-ocasion.mjs
// Para cambiar una foto: cambia su URL aquí (bucket fotos/clientas) y vuelve a correrlo.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const BASE = 'https://nykekrnbijochjcnkrga.supabase.co/storage/v1/object/public/fotos/clientas/';
const FOTOS = {
  xv: 'Damas%20lila.jpg',
  graduacion: 'rosa.jpg', // TODO-FOTO-REAL: no hay foto de una graduación; esta es provisional
  boda: 'Boda%20Nestor.jpg',
  gala: 'Vestido%20rojo.jpg',
};

await mkdir('public/img', { recursive: true });
for (const [ocasion, archivo] of Object.entries(FOTOS)) {
  const res = await fetch(BASE + archivo);
  if (!res.ok) throw new Error(`${ocasion}: ${res.status}`);
  const original = Buffer.from(await res.arrayBuffer());
  for (const ancho of [400, 700]) {
    // Recorte 4:5 centrado en lo más interesante de la foto
    const img = sharp(original).rotate().resize({ width: ancho, height: Math.round(ancho * 1.25), fit: 'cover', position: 'attention' });
    await img.clone().webp({ quality: 74 }).toFile(`public/img/ocasion-${ocasion}-${ancho}.webp`);
    await img.clone().avif({ quality: 52 }).toFile(`public/img/ocasion-${ocasion}-${ancho}.avif`);
  }
  console.log('listo', ocasion);
}
