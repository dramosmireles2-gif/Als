// =============================================
// mi-lista.js: favoritos ("Mi lista") guardados en este teléfono
// Panel que se abre encima de la página, envío por WhatsApp y compartir.
// =============================================
import { CLAVE_LISTA, leerLista, actualizarContadorLista } from './nav.js';
import { urlWhatsApp, mensajeLista, linkPublico } from './whatsapp.js';
import { prepararFoto } from './datos.js';

const MAXIMO = 10;

function guardar(lista) {
    try { localStorage.setItem(CLAVE_LISTA, JSON.stringify(lista)); } catch { /* modo privado: no se guarda */ }
    actualizarContadorLista();
    pintarPanel();
    document.dispatchEvent(new CustomEvent('lista:cambio'));
}

export const estaEnLista = slug => leerLista().some(it => it.slug === slug);

// Agrega o quita un modelo. Devuelve true si quedó agregado.
export function alternarEnLista(modelo, talla = null) {
    const lista = leerLista();
    const i = lista.findIndex(it => it.slug === modelo.slug);
    if (i !== -1) {
        lista.splice(i, 1);
        guardar(lista);
        mostrarAviso(`Quitaste "${modelo.nombre}" de Mi lista`);
        return false;
    }
    if (lista.length >= MAXIMO) {
        mostrarAviso(`Tu lista ya tiene ${MAXIMO} vestidos. Quita alguno para agregar otro.`);
        return false;
    }
    lista.push({ slug: modelo.slug, nombre: modelo.nombre, foto: modelo.fotos[0], talla, ruta: `/vestido/?m=${modelo.slug}` });
    guardar(lista);
    mostrarAviso(`Agregaste "${modelo.nombre}" a Mi lista`, { accion: 'Ver lista', alTocar: abrirLista });
    return true;
}

// Pequeño rebote del ♡ al guardar (no se usa con reduced-motion)
export function rebote(boton) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    boton.classList.remove('con-rebote');
    void boton.offsetWidth; // reinicia la animación si tocan dos veces seguidas
    boton.classList.add('con-rebote');
    boton.addEventListener('animationend', () => boton.classList.remove('con-rebote'), { once: true });
}

// Guarda la talla elegida en la página del vestido (si ya está en la lista)
export function actualizarTalla(slug, talla) {
    const lista = leerLista();
    const it = lista.find(x => x.slug === slug);
    if (it && it.talla !== talla) { it.talla = talla; guardar(lista); }
}

// ---- Aviso flotante ----
let temporizador = null;
export function mostrarAviso(texto, { accion, alTocar } = {}) {
    const aviso = document.querySelector('[data-aviso]');
    if (!aviso) return;
    aviso.replaceChildren(document.createTextNode(texto));
    if (accion) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'aviso__accion';
        b.textContent = accion;
        b.addEventListener('click', () => { aviso.classList.remove('aviso--visible'); alTocar?.(); });
        aviso.appendChild(b);
    }
    aviso.classList.add('aviso--visible');
    clearTimeout(temporizador);
    temporizador = setTimeout(() => aviso.classList.remove('aviso--visible'), 4000);
}

// ---- Panel ----
const panel = document.querySelector('[data-lista-panel]');
let disparador = null;

function pintarPanel() {
    if (!panel) return;
    const lista = leerLista();
    const ul = panel.querySelector('[data-lista-items]');
    ul.replaceChildren(...lista.map(it => {
        const li = document.createElement('li');
        li.className = 'panel-lista__item';
        const img = document.createElement('img');
        img.alt = '';
        img.width = 64;
        img.height = 85;
        prepararFoto(img, it.foto);
        const texto = document.createElement('div');
        texto.className = 'panel-lista__texto';
        const a = document.createElement('a');
        a.href = it.ruta;
        a.textContent = it.nombre;
        texto.appendChild(a);
        if (it.talla) {
            const t = document.createElement('span');
            t.textContent = `Talla ${it.talla}`;
            texto.appendChild(t);
        }
        const quitar = document.createElement('button');
        quitar.type = 'button';
        quitar.className = 'panel-lista__quitar';
        quitar.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
        quitar.setAttribute('aria-label', `Quitar ${it.nombre}`);
        quitar.addEventListener('click', () => {
            guardar(leerLista().filter(x => x.slug !== it.slug));
            panel.querySelector('.menu-movil__cerrar')?.focus();
        });
        li.append(img, texto, quitar);
        return li;
    }));
    const hay = lista.length > 0;
    panel.querySelector('[data-lista-vacia]').hidden = hay;
    panel.querySelector('[data-lista-acciones]').hidden = !hay;
    ul.hidden = !hay;
    if (hay) panel.querySelector('[data-lista-enviar]').href = urlWhatsApp(mensajeLista(lista));
}

const enfocables = () => [...panel.querySelectorAll('a[href], button:not([disabled])')].filter(el => el.offsetParent !== null);

function teclas(e) {
    if (e.key === 'Escape') { e.preventDefault(); cerrarLista(); return; }
    if (e.key !== 'Tab') return;
    const l = enfocables();
    if (!l.length) return;
    if (e.shiftKey && document.activeElement === l[0]) { e.preventDefault(); l[l.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === l[l.length - 1]) { e.preventDefault(); l[0].focus(); }
}

export function abrirLista() {
    if (!panel || !panel.hidden) return;
    disparador = document.activeElement;
    document.querySelector('[data-aviso]')?.classList.remove('aviso--visible');
    pintarPanel();
    panel.hidden = false;
    document.body.classList.add('menu-abierto');
    requestAnimationFrame(() => panel.classList.add('panel-lista--abierto'));
    panel.querySelector('.menu-movil__cerrar')?.focus();
    document.addEventListener('keydown', teclas);
}

export function cerrarLista() {
    if (!panel || panel.hidden) return;
    panel.classList.remove('panel-lista--abierto');
    document.body.classList.remove('menu-abierto');
    document.removeEventListener('keydown', teclas);
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => { panel.hidden = true; }, reducir ? 0 : 400);
    if (disparador instanceof HTMLElement && document.contains(disparador) && disparador.offsetParent !== null) disparador.focus();
}

async function compartirLista() {
    const lista = leerLista();
    const texto = lista.map((it, i) => `${i + 1}. ${it.nombre}${it.talla ? ` (talla ${it.talla})` : ''}: ${linkPublico(it.ruta)}`).join('\n');
    const datos = { title: 'Mi lista de Als Dress', text: `Mira los vestidos que me gustaron en Als Dress:\n${texto}` };
    try {
        if (navigator.share) { await navigator.share(datos); return; }
        await navigator.clipboard.writeText(datos.text);
        mostrarAviso('Copiamos tu lista. Pégala donde quieras compartirla.');
    } catch (e) {
        if (e?.name !== 'AbortError') mostrarAviso('No se pudo compartir. Intenta de nuevo.');
    }
}

if (panel) {
    document.addEventListener('click', e => {
        const abrir = e.target.closest('[data-abrir-lista]');
        if (abrir) { e.preventDefault(); abrirLista(); }
    });
    panel.querySelectorAll('[data-lista-cerrar]').forEach(b => b.addEventListener('click', cerrarLista));
    panel.querySelector('[data-lista-compartir]').addEventListener('click', compartirLista);
    window.addEventListener('storage', e => { if (e.key === CLAVE_LISTA) pintarPanel(); });
    if (location.hash === '#mi-lista') abrirLista();
}
