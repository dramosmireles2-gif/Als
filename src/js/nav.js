// =============================================
// nav.js: header, menú de teléfono y contador de Mi lista
// =============================================

const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
const esTelefono = window.matchMedia('(max-width: 767px)');

// ---- Header: se compacta al bajar; en teléfono se esconde al bajar rápido ----
const header = document.querySelector('[data-header]');
let ultimoY = 0; // no leer scrollY al cargar: forzaría el primer layout dentro del script
let pendiente = false;

function actualizarHeader() {
    const y = window.scrollY;
    const delta = y - ultimoY;
    header.classList.toggle('site-header--compacto', y > 24);
    const menuAbierto = document.body.classList.contains('menu-abierto');
    const focoDentro = header.contains(document.activeElement);
    if (!esTelefono.matches || menuAbierto || focoDentro || y < 120) {
        header.classList.remove('site-header--oculto');
    } else if (delta > 8) {
        header.classList.add('site-header--oculto');
    } else if (delta < -4) {
        header.classList.remove('site-header--oculto');
    }
    ultimoY = y;
    pendiente = false;
}

if (header) {
    window.addEventListener('scroll', () => {
        if (!pendiente) {
            pendiente = true;
            requestAnimationFrame(actualizarHeader);
        }
    }, { passive: true });
    header.addEventListener('focusin', () => header.classList.remove('site-header--oculto'));
    actualizarHeader();
}

// ---- Menú de teléfono y tablet ----
const menu = document.querySelector('[data-menu]');
const botonAbrir = document.querySelector('[data-menu-abrir]');
const SELECTOR_FOCO = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

function enfocables() {
    return [...menu.querySelectorAll(SELECTOR_FOCO)].filter(el => el.offsetParent !== null);
}

function abrirMenu() {
    menu.hidden = false;
    document.body.classList.add('menu-abierto');
    botonAbrir.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => menu.classList.add('menu-movil--abierto'));
    menu.querySelector('.menu-movil__cerrar')?.focus();
    document.addEventListener('keydown', teclasMenu);
}

function cerrarMenu({ devolverFoco = true } = {}) {
    if (menu.hidden) return;
    menu.classList.remove('menu-movil--abierto');
    document.body.classList.remove('menu-abierto');
    botonAbrir.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', teclasMenu);
    const ocultar = () => { menu.hidden = true; };
    if (reducirMovimiento.matches) ocultar();
    else setTimeout(ocultar, 450);
    if (devolverFoco) botonAbrir.focus();
}

// Esc cierra; Tab no sale del menú
function teclasMenu(e) {
    if (e.key === 'Escape') {
        e.preventDefault();
        cerrarMenu();
        return;
    }
    if (e.key !== 'Tab') return;
    const lista = enfocables();
    if (!lista.length) return;
    const primero = lista[0];
    const ultimo = lista[lista.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
    }
}

if (menu && botonAbrir) {
    botonAbrir.addEventListener('click', abrirMenu);
    menu.querySelectorAll('[data-menu-cerrar]').forEach(el => el.addEventListener('click', () => cerrarMenu()));
    // Al elegir un link el menú se cierra (y la página puede desplazarse a la sección)
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => cerrarMenu({ devolverFoco: false })));
    window.matchMedia('(min-width: 1100px)').addEventListener('change', e => {
        if (e.matches) cerrarMenu({ devolverFoco: false });
    });
}

// ---- Contador de Mi lista (la lista se construye en la fase 5) ----
export const CLAVE_LISTA = 'als:mi-lista';

export function leerLista() {
    try {
        const lista = JSON.parse(localStorage.getItem(CLAVE_LISTA) || '[]');
        return Array.isArray(lista) ? lista : [];
    } catch {
        return [];
    }
}

export function actualizarContadorLista() {
    const n = leerLista().length;
    document.querySelectorAll('[data-lista-contador]').forEach(el => {
        el.textContent = String(n);
    });
}

actualizarContadorLista();
window.addEventListener('storage', e => {
    if (e.key === CLAVE_LISTA) actualizarContadorLista();
});
