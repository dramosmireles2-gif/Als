// =============================================
// catalogo.js: catálogo con filtros guardados en la URL
// ?talla=M,L&color=verde&disponibles=1  (también entiende ?cat=Vestido)
// En computadora los filtros van en una columna; en teléfono, en un panel
// que sube desde abajo.
// =============================================
import { cargarModelos, ordenarTallas, slug, FAMILIAS } from './datos.js';
import { crearTarjeta } from './tarjeta.js';
import { urlWhatsApp, mensajeAvisame } from './whatsapp.js';

const POR_PAGINA = 12;
const OCASIONES = { xv: 'XV años', graduacion: 'Graduación', boda: 'Boda', gala: 'Gala' };
const GRUPOS = ['talla', 'color', 'ocasion', 'tipo'];

const $ = sel => document.querySelector(sel);
const grid = $('[data-resultados]');
const conteo = $('[data-conteo]');
const btnMas = $('[data-cargar-mas]');
const vacio = $('[data-vacio]');
const errorEl = $('[data-error]');
const activos = $('[data-activos]');
const panel = $('[data-filtros]');
const caja = $('[data-filtros-caja]');
const btnAbrir = $('[data-filtros-abrir]');
const btnVer = $('[data-filtros-ver]');
const chkDisponibles = $('[data-filtro-disponibles]');
const esPanel = window.matchMedia('(max-width: 1023px)');

let modelos = [];
let mostrados = POR_PAGINA;
const estado = { talla: new Set(), color: new Set(), ocasion: new Set(), tipo: new Set(), disponibles: false };

// ---- URL ----
function leerUrl() {
    const p = new URLSearchParams(location.search);
    for (const g of GRUPOS) {
        estado[g] = new Set((p.get(g) || '').split(',').map(v => v.trim()).filter(Boolean));
    }
    if (p.get('cat')) estado.tipo.add(slug(p.get('cat')));
    estado.color = new Set([...estado.color].map(slug));
    estado.ocasion = new Set([...estado.ocasion].map(slug));
    estado.tipo = new Set([...estado.tipo].map(slug));
    estado.disponibles = p.get('disponibles') === '1';
}

function escribirUrl() {
    const p = new URLSearchParams();
    for (const g of GRUPOS) if (estado[g].size) p.set(g, [...estado[g]].join(','));
    if (estado.disponibles) p.set('disponibles', '1');
    const qs = p.toString().replace(/%2C/g, ',');
    history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : '') + location.hash);
}

// ---- Filtrado ----
function filtrar() {
    return modelos.filter(m => {
        if (estado.tipo.size && !estado.tipo.has(slug(m.tipo))) return false;
        if (estado.color.size && !estado.color.has(m.familia)) return false;
        if (estado.ocasion.size && !m.ocasion.some(o => estado.ocasion.has(slug(o)))) return false;
        if (estado.talla.size && !m.tallas.some(t => estado.talla.has(t.talla) && (!estado.disponibles || t.disponible))) return false;
        if (estado.disponibles && !m.hayDisponible) return false;
        return true;
    }).sort((a, b) => Number(b.hayDisponible) - Number(a.hayDisponible) || a.nombre.localeCompare(b.nombre, 'es'));
}

const totalFiltros = () => GRUPOS.reduce((n, g) => n + estado[g].size, 0) + (estado.disponibles ? 1 : 0);

// ---- Opciones de filtro (solo las que existen en el catálogo) ----
function opcionesDe(grupo) {
    if (grupo === 'talla') {
        return ordenarTallas([...new Set(modelos.flatMap(m => m.tallas.map(t => t.talla)))]).map(t => ({ valor: t, texto: t }));
    }
    if (grupo === 'color') {
        const presentes = new Set(modelos.map(m => m.familia).filter(Boolean));
        return FAMILIAS.filter(f => presentes.has(f.id)).map(f => ({ valor: f.id, texto: f.nombre, muestra: f.muestra }));
    }
    if (grupo === 'ocasion') {
        const presentes = [...new Set(modelos.flatMap(m => m.ocasion.map(slug)))];
        return presentes.map(o => ({ valor: o, texto: OCASIONES[o] || o }));
    }
    const tipos = new Map(modelos.map(m => [slug(m.tipo), m.tipo]));
    return [...tipos].map(([valor, texto]) => ({ valor, texto: texto.endsWith('s') ? texto : `${texto}s` }));
}

function construirFiltros() {
    for (const grupo of GRUPOS) {
        const opciones = opcionesDe(grupo);
        const fieldset = document.querySelector(`[data-grupo="${grupo}"]`);
        // El tipo solo aparece si hay más de uno; la ocasión, si ya hay datos
        fieldset.hidden = grupo === 'tipo' ? opciones.length < 2 : opciones.length === 0;
        const cont = document.querySelector(`[data-opciones="${grupo}"]`);
        cont.replaceChildren(...opciones.map(op => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = op.muestra ? 'chip chip--color' : 'chip';
            if (op.muestra) b.style.setProperty('--muestra', op.muestra);
            b.textContent = op.texto;
            b.dataset.valor = op.valor;
            b.setAttribute('aria-pressed', String(estado[grupo].has(op.valor)));
            b.addEventListener('click', () => {
                estado[grupo].has(op.valor) ? estado[grupo].delete(op.valor) : estado[grupo].add(op.valor);
                aplicar();
            });
            return b;
        }));
    }
    chkDisponibles.checked = estado.disponibles;
}

function textoDe(grupo, valor) {
    const op = opcionesDe(grupo).find(o => o.valor === valor);
    return op ? op.texto : valor;
}

// ---- Pintar ----
function pintar() {
    const lista = filtrar();
    const n = lista.length;
    const hayFiltros = totalFiltros() > 0;

    conteo.textContent = `${n} ${n === 1 ? 'vestido' : 'vestidos'}${hayFiltros ? ' con tus filtros' : ''}`;
    btnVer.textContent = n ? `Ver ${n} ${n === 1 ? 'resultado' : 'resultados'}` : 'Sin resultados';

    grid.replaceChildren(...lista.slice(0, mostrados).map((m, i) => crearTarjeta(m, { prioridad: i < 4 })));
    grid.setAttribute('aria-busy', 'false');
    btnMas.hidden = n <= mostrados;
    btnMas.textContent = `Cargar más vestidos (${n - Math.min(mostrados, n)} más)`;

    vacio.hidden = n > 0;
    if (!n) {
        const talla = [...estado.talla][0];
        $('[data-avisame]').href = urlWhatsApp(mensajeAvisame(talla));
    }

    // Estado de los chips y del switch
    for (const grupo of GRUPOS) {
        document.querySelectorAll(`[data-opciones="${grupo}"] .chip`).forEach(b => b.setAttribute('aria-pressed', String(estado[grupo].has(b.dataset.valor))));
    }
    chkDisponibles.checked = estado.disponibles;

    // Filtros activos (se quitan con un toque)
    const chips = [];
    if (estado.disponibles) chips.push({ texto: 'Solo disponibles', quitar: () => { estado.disponibles = false; } });
    for (const grupo of GRUPOS) for (const valor of estado[grupo]) {
        chips.push({ texto: textoDe(grupo, valor), quitar: () => estado[grupo].delete(valor) });
    }
    activos.replaceChildren(...chips.map(c => {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip chip--activo';
        b.innerHTML = '<span></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
        b.firstChild.textContent = c.texto;
        b.setAttribute('aria-label', `Quitar filtro: ${c.texto}`);
        b.addEventListener('click', () => { c.quitar(); aplicar(); });
        li.appendChild(b);
        return li;
    }));
    activos.hidden = chips.length === 0;
    const cuantos = $('[data-filtros-cuantos]');
    cuantos.hidden = !hayFiltros;
    cuantos.textContent = String(totalFiltros());
}

function aplicar() {
    mostrados = POR_PAGINA;
    escribirUrl();
    pintar();
}

function limpiar() {
    for (const g of GRUPOS) estado[g].clear();
    estado.disponibles = false;
    aplicar();
}

// ---- Panel de filtros en teléfono (sube desde abajo) ----
const enfocables = () => [...caja.querySelectorAll('button, input, a[href]')].filter(el => el.offsetParent !== null);

function teclasPanel(e) {
    if (e.key === 'Escape') { e.preventDefault(); cerrarPanel(); return; }
    if (e.key !== 'Tab') return;
    const l = enfocables();
    if (e.shiftKey && document.activeElement === l[0]) { e.preventDefault(); l[l.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === l[l.length - 1]) { e.preventDefault(); l[0].focus(); }
}

function abrirPanel() {
    panel.classList.add('filtros--abierto');
    caja.setAttribute('role', 'dialog');
    caja.setAttribute('aria-modal', 'true');
    caja.setAttribute('aria-labelledby', 'filtros-titulo');
    btnAbrir.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-abierto');
    document.addEventListener('keydown', teclasPanel);
    caja.querySelector('.filtros__cerrar')?.focus();
}

function cerrarPanel({ devolverFoco = true } = {}) {
    if (!panel.classList.contains('filtros--abierto')) return;
    panel.classList.remove('filtros--abierto');
    caja.removeAttribute('role');
    caja.removeAttribute('aria-modal');
    caja.removeAttribute('aria-labelledby');
    btnAbrir.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-abierto');
    document.removeEventListener('keydown', teclasPanel);
    if (devolverFoco) btnAbrir.focus();
}

// ---- Arranque ----
async function iniciar() {
    errorEl.hidden = true;
    try {
        modelos = await cargarModelos();
        construirFiltros();
        pintar();
    } catch (err) {
        console.error('Error cargando catálogo:', err);
        grid.replaceChildren();
        conteo.textContent = '';
        errorEl.hidden = false;
    }
}

leerUrl();
btnAbrir.addEventListener('click', abrirPanel);
document.querySelectorAll('[data-filtros-cerrar]').forEach(b => b.addEventListener('click', () => cerrarPanel()));
btnVer.addEventListener('click', () => {
    cerrarPanel({ devolverFoco: false });
    document.querySelector('.catalogo__barra')?.scrollIntoView({ block: 'start' });
});
document.querySelectorAll('[data-filtros-limpiar]').forEach(b => b.addEventListener('click', limpiar));
chkDisponibles.addEventListener('change', () => { estado.disponibles = chkDisponibles.checked; aplicar(); });
btnMas.addEventListener('click', () => {
    const antes = mostrados;
    mostrados += POR_PAGINA;
    pintar();
    // El foco pasa a la primera tarjeta nueva
    grid.children[antes]?.querySelector('.tarjeta__enlace')?.focus();
});
$('[data-reintentar]').addEventListener('click', iniciar);
esPanel.addEventListener('change', e => { if (!e.matches) cerrarPanel({ devolverFoco: false }); });
iniciar();
