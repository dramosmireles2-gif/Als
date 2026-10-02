// =============================================================
// migrar-fotos.mjs: copia las fotos de AppSheet y Google Drive a
// Supabase Storage (bucket "fotos", carpeta "inventario/"), igual que
// las guarda el panel admin: inventario/<id_articulo>.jpg
//
// Uso:
//   node scripts/migrar-fotos.mjs                 → PRUEBA: descarga y revisa,
//                                                   no escribe nada en Supabase
//   node scripts/migrar-fotos.mjs --aplicar       → sube las fotos y actualiza la
//                                                   columna foto (necesita la llave
//                                                   SUPABASE_SERVICE_ROLE_KEY)
//   node scripts/migrar-fotos.mjs --revertir <respaldo.json>
//                                                 → regresa la columna foto a como estaba
//
// La llave secreta NUNCA se guarda en el repo: se pone solo en la terminal.
// Usa la API HTTP de Supabase directamente (funciona con Node 20).
// =============================================================
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import sharp from 'sharp';

const SUPABASE_URL = 'https://nykekrnbijochjcnkrga.supabase.co';
const LLAVE_PUBLICA = 'sb_publishable_3B_zCPi9bJYN6TEmoVB3jg_VJ1C45Sj';
const LLAVE_SECRETA = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LLAVE = LLAVE_SECRETA || LLAVE_PUBLICA;
const APP_NAME = 'RentaVestidosAPP-250346467';
const CARPETA_LOCAL = '_interno/migracion-fotos';

const args = process.argv.slice(2);
const APLICAR = args.includes('--aplicar');
const REVERTIR = args.includes('--revertir') ? args[args.indexOf('--revertir') + 1] : null;

if ((APLICAR || REVERTIR) && !LLAVE_SECRETA) {
  console.error('Falta la llave. En la terminal de VS Code (PowerShell):');
  console.error('  $env:SUPABASE_SERVICE_ROLE_KEY = "<llave service_role de Supabase>"');
  console.error('Está en Supabase → Project Settings → API keys. No la pegues en el chat ni en ningún archivo.');
  process.exit(1);
}

const cabeceras = (extra = {}) => ({ apikey: LLAVE, Authorization: `Bearer ${LLAVE}`, ...extra });

async function rest(ruta, opciones = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, { ...opciones, headers: cabeceras(opciones.headers) });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

const actualizarFoto = (id, nueva, vieja) => rest(
  `inventario?id_articulo=eq.${encodeURIComponent(id)}${vieja ? `&foto=eq.${encodeURIComponent(vieja)}` : ''}`,
  { method: 'PATCH', body: JSON.stringify({ foto: nueva }), headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' } });

const esSupabase = f => typeof f === 'string' && f.includes('.supabase.co/storage/');
const urlOrigen = f => (f.startsWith('http') ? f
  : `https://www.appsheet.com/template/gettablefileurl?appName=${encodeURIComponent(APP_NAME)}&tableName=Inventario&fileName=${encodeURIComponent(f)}`);
const origen = f => (f.startsWith('http') ? new URL(f).host : 'AppSheet');

// ---- Revertir ----
if (REVERTIR) {
  const respaldo = JSON.parse(await readFile(REVERTIR, 'utf8'));
  for (const r of respaldo) {
    try { await actualizarFoto(r.id_articulo, r.foto_anterior); console.log(`↺ ${r.id_articulo}`); }
    catch (e) { console.log(`✗ ${r.id_articulo}: ${e.message}`); }
  }
  console.log('Listo: la columna foto regresó a sus valores anteriores. (Los archivos subidos se quedan en Storage.)');
  process.exit(0);
}

// ---- Leer inventario ----
const filas = await rest('inventario?select=id_articulo,nombre,talla,foto');
const pendientes = filas.filter(f => f.foto && !esSupabase(f.foto));
console.log(`${filas.length} filas leídas${LLAVE_SECRETA ? '' : ' (solo las publicadas: sin llave secreta no veo las ocultas)'}.`);
console.log(`${pendientes.length} fotos por migrar (AppSheet o Google Drive).\n`);

await mkdir(CARPETA_LOCAL, { recursive: true });
const resultados = [];
for (const fila of pendientes) {
  const etiqueta = `${fila.id_articulo} · ${fila.nombre} (${fila.talla || 's/t'}) · ${origen(fila.foto)}`;
  try {
    const res = await fetch(urlOrigen(fila.foto));
    const tipo = res.headers.get('content-type') || '';
    if (!res.ok || !tipo.startsWith('image')) throw new Error(`respuesta ${res.status} ${tipo}`);
    const original = Buffer.from(await res.arrayBuffer());
    // Mismo formato que el admin: JPEG. Máximo 1400 px de ancho.
    const jpg = await sharp(original).rotate().resize({ width: 1400, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    const ruta = `inventario/${fila.id_articulo}.jpg`;
    await writeFile(`${CARPETA_LOCAL}/${fila.id_articulo}.jpg`, jpg);
    resultados.push({ fila, ruta, jpg });
    console.log(`✓ ${etiqueta} → ${Math.round(original.length / 1024)} KB → ${Math.round(jpg.length / 1024)} KB`);
  } catch (e) {
    console.log(`✗ ${etiqueta}: ${e.message}`);
  }
}

console.log(`\n${resultados.length} de ${pendientes.length} fotos listas. Copias en ${CARPETA_LOCAL}/ para revisarlas.`);
if (!APLICAR) {
  console.log('PRUEBA terminada: no se escribió nada en Supabase. Para aplicar: node scripts/migrar-fotos.mjs --aplicar');
  process.exit(0);
}

// ---- Aplicar: respaldo → subir → actualizar ----
const marca = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const archivoRespaldo = `_interno/respaldo-fotos-${marca}.json`;
await writeFile(archivoRespaldo, JSON.stringify(resultados.map(r => ({ id_articulo: r.fila.id_articulo, foto_anterior: r.fila.foto })), null, 2));
console.log(`Respaldo guardado en ${archivoRespaldo}\n`);

let ok = 0;
for (const { fila, ruta, jpg } of resultados) {
  const subida = await fetch(`${SUPABASE_URL}/storage/v1/object/fotos/${ruta}`, {
    method: 'POST', body: jpg, headers: cabeceras({ 'Content-Type': 'image/jpeg', 'x-upsert': 'false' }) });
  if (!subida.ok) {
    const texto = await subida.text();
    if (/exist|duplicate/i.test(texto)) console.log(`· ${ruta} ya existía en Storage; no se sobrescribe ni se cambia la fila`);
    else console.log(`✗ subir ${ruta}: ${subida.status} ${texto}`);
    continue;
  }
  const publica = `${SUPABASE_URL}/storage/v1/object/public/fotos/${ruta}`;
  // Solo cambia la fila si sigue teniendo la foto vieja (por si alguien la editó en el admin)
  try { await actualizarFoto(fila.id_articulo, publica, fila.foto); ok++; console.log(`✓ ${fila.id_articulo} → ${publica}`); }
  catch (e) { console.log(`✗ actualizar ${fila.id_articulo}: ${e.message}`); }
}
console.log(`\nListo: ${ok} fotos migradas. Para deshacer: node scripts/migrar-fotos.mjs --revertir ${archivoRespaldo}`);
