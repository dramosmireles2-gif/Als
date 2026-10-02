// =============================================
// estilos.js: interacción de la página interna /_estilos
// =============================================
import { auditarContraste, ratioHex } from './contraste.js';

// Botones de alternar (chips, swatches, favorito)
document.querySelectorAll('[aria-pressed]').forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const grupo = btn.closest('[data-unico]');
        if (grupo) grupo.querySelectorAll('[aria-pressed]').forEach(b => b !== btn && b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', String(btn.getAttribute('aria-pressed') !== 'true'));
    });
});

// Paleta con su contraste contra los fondos base
const PALETA = [
    ['Tinta', '--ink', '#1A141C'],
    ['Orquídea', '--orchid-700', '#6E3A87'],
    ['Orquídea oscura', '--orchid-800', '#4E2862'],
    ['Lila', '--lila', '#A873BB'],
    ['Malva', '--malva', '#E3ACDA'],
    ['Lavanda', '--lavanda', '#B6A5E0'],
    ['Rubor', '--rubor', '#F3E6EE'],
    ['Champagne', '--champagne', '#F2DDD1'],
    ['Marfil', '--marfil', '#FBF8F5'],
    ['Noche', '--noche', '#2A1E30'],
    ['Texto secundario', '--muted', '#5B5160'],
    ['WhatsApp', '--wa', '#1F8F55'],
    ['WhatsApp oscuro', '--wa-700', '#187547'],
];
const FONDOS = { marfil: '#FBF8F5', blanco: '#FFFFFF', noche: '#2A1E30' };
function etiqueta(r) {
    if (r >= 4.5) return 'AA';
    if (r >= 3) return 'Solo grande';
    return 'No';
}
const paleta = document.getElementById('paleta');
for (const [nombre, token, hex] of PALETA) {
    const li = document.createElement('li');
    li.className = 'color';
    li.innerHTML = `<div class="paleta__muestra" style="background:${hex}"></div>
        <div class="paleta__info"><strong>${nombre}</strong>${token} · ${hex}<ul class="paleta__ratios"></ul></div>`;
    const lista = li.querySelector('.paleta__ratios');
    for (const [fondo, fhex] of Object.entries(FONDOS)) {
        const r = ratioHex(hex, fhex);
        const item = document.createElement('li');
        item.textContent = `Sobre ${fondo}: ${r.toFixed(2)} · ${etiqueta(r)}`;
        lista.appendChild(item);
    }
    paleta.appendChild(li);
}

// Auditoría de contraste de todos los componentes de esta página
function correrAuditoria() {
    const { revisados, sinVerificar, fallas } = auditarContraste(document.querySelector('main'));
    const salida = document.getElementById('auditoria');
    salida.innerHTML = '';
    const resumen = document.createElement('p');
    resumen.className = fallas.length ? 'auditoria__mal' : 'auditoria__bien';
    resumen.textContent = fallas.length
        ? `${fallas.length} de ${revisados} textos no llegan a AA.`
        : `Los ${revisados} textos revisados pasan AA.`;
    salida.appendChild(resumen);
    if (sinVerificar) {
        const nota = document.createElement('p');
        nota.textContent = `${sinVerificar} textos están sobre foto o degradado y se revisan a ojo.`;
        salida.appendChild(nota);
    }
    fallas.forEach(f => {
        const p = document.createElement('p');
        p.textContent = `${f.elemento} "${f.texto}": ${f.ratio} (mínimo ${f.minimo})`;
        salida.appendChild(p);
    });
}
document.fonts.ready.then(correrAuditoria);
