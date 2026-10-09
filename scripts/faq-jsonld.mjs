// Genera el JSON-LD FAQPage de /como-rentar/ a partir de sus <details>.
// Uso: node scripts/faq-jsonld.mjs   (correr cada vez que cambien las preguntas)
import { readFile, writeFile } from 'node:fs/promises';

const archivo = 'como-rentar/index.html';
let html = await readFile(archivo, 'utf8');
const limpiar = t => t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const bloque = html.slice(html.indexOf('data-faq>'), html.indexOf('</div>', html.indexOf('data-faq>')));
const preguntas = [...bloque.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)]
  .map(([, q, a]) => ({ '@type': 'Question', name: limpiar(q), acceptedAnswer: { '@type': 'Answer', text: limpiar(a) } }));
const json = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: preguntas }, null, 2)
  .split('\n').map(l => '  ' + l).join('\n');
const nuevo = `  <!-- FAQPage (generado con scripts/faq-jsonld.mjs) -->\n  <script type="application/ld+json">\n${json}\n  </script>`;
const ini = html.indexOf('  <!-- FAQPage');
const fin = html.includes('<!-- FAQPage (generado') ? html.indexOf('</script>', ini) + '</script>'.length : html.indexOf('-->', ini) + 3;
html = html.slice(0, ini) + nuevo + html.slice(fin);
await writeFile(archivo, html);
console.log(`${preguntas.length} preguntas en el FAQPage`);
