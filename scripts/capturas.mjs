// Capturas de página completa a 375 y 1440 con Playwright.
// Uso: npm run build && npx vite preview --port 4173 (en otra terminal)
//      node scripts/capturas.mjs antes|despues
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const etapa = process.argv[2] || 'antes';
const paginas = { inicio: '/', catalogo: '/catalogo/' };
await mkdir('docs/revision', { recursive: true });
const navegador = await chromium.launch();
for (const ancho of [375, 1440]) {
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: ancho === 375 ? 812 : 900 } });
  for (const [nombre, ruta] of Object.entries(paginas)) {
    await pagina.goto('http://localhost:4173' + ruta, { waitUntil: 'networkidle' });
    for (let y = 0; y < 12000; y += 600) { await pagina.evaluate(v => scrollTo(0, v), y); await pagina.waitForTimeout(120); }
    await pagina.evaluate(() => scrollTo(0, 0));
    await pagina.waitForTimeout(800);
    await pagina.screenshot({ path: `docs/revision/${etapa}-${nombre}-${ancho}.png`, fullPage: true });
  }
  await pagina.close();
}
await navegador.close();
console.log('capturas listas en docs/revision/');
