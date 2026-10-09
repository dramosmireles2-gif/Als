// =============================================
// tarjeta.js: tarjeta de producto (inicio, catálogo y "también te puede gustar")
// Toda la tarjeta lleva a la página del vestido; el ♡ es un botón aparte.
// =============================================
import { prepararFoto, urlVestido } from './datos.js';
import { estaEnLista, alternarEnLista, rebote } from './mi-lista.js';

const ICONO_CORAZON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';

function pintarFav(fav) {
    const dentro = estaEnLista(fav.dataset.slug);
    fav.setAttribute('aria-pressed', String(dentro));
    fav.setAttribute('aria-label', dentro ? `Quitar ${fav.dataset.nombre} de Mi lista` : `Agregar ${fav.dataset.nombre} a Mi lista`);
}
// Un solo oyente actualiza todos los corazones cuando cambia la lista
document.addEventListener('lista:cambio', () => document.querySelectorAll('.tarjeta__fav[data-slug]').forEach(pintarFav));

// La foto de la tarjeta "viaja" a la página del vestido (View Transitions entre páginas).
// Es mejora progresiva: sin soporte, la navegación es normal. La URL de la foto se pasa
// para que la página del vestido la muestre desde el primer cuadro.
let tarjetaTocada = null;
document.addEventListener('click', e => {
    const enlace = e.target.closest?.('.tarjeta__enlace');
    if (!enlace || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const img = enlace.closest('.tarjeta').querySelector('.tarjeta__media img');
    tarjetaTocada = img;
    try { sessionStorage.setItem('als:viaje', JSON.stringify({ u: enlace.getAttribute('href'), f: img.currentSrc || img.src })); } catch { /* sin almacenamiento */ }
});
window.addEventListener('pageswap', e => {
    if (!e.viewTransition || !tarjetaTocada) return;
    const img = tarjetaTocada;
    tarjetaTocada = null;
    img.style.viewTransitionName = 'foto-vestido';
    e.viewTransition.finished.finally(() => { img.style.viewTransitionName = ''; });
});
// Al volver con el botón Atrás (página guardada en memoria) se limpia el nombre
window.addEventListener('pageshow', e => {
    if (e.persisted) document.querySelectorAll('.tarjeta__media img').forEach(i => { i.style.viewTransitionName = ''; });
});

export function crearTarjeta(modelo, { prioridad = false } = {}) {
    const li = document.createElement('li');
    li.className = 'carrusel__item';

    const tarjeta = document.createElement('article');
    tarjeta.className = 'tarjeta';
    tarjeta.dataset.slug = modelo.slug;

    // Foto
    const media = document.createElement('div');
    media.className = 'tarjeta__media';
    const img = document.createElement('img');
    img.alt = modelo.color ? `${modelo.nombre}, ${modelo.color.toLowerCase()}` : modelo.nombre;
    img.width = 600;
    img.height = 800;
    img.loading = prioridad ? 'eager' : 'lazy';
    prepararFoto(img, modelo.fotos[0]);
    const badge = document.createElement('span');
    badge.className = `badge tarjeta__badge ${modelo.hayDisponible ? 'badge--disponible' : 'badge--apartado'}`;
    badge.textContent = modelo.hayDisponible ? 'Disponible' : 'Apartado';

    // ♡ Mi lista
    const fav = document.createElement('button');
    fav.type = 'button';
    fav.className = 'tarjeta__fav';
    fav.innerHTML = ICONO_CORAZON;
    fav.dataset.slug = modelo.slug;
    fav.dataset.nombre = modelo.nombre;
    pintarFav(fav);
    fav.addEventListener('click', () => { if (alternarEnLista(modelo)) rebote(fav); });
    media.append(img, badge, fav);

    // Texto
    const cuerpo = document.createElement('div');
    cuerpo.className = 'tarjeta__cuerpo';
    const titulo = document.createElement('h3');
    titulo.className = 'tarjeta__nombre';
    const enlace = document.createElement('a');
    enlace.className = 'tarjeta__enlace';
    enlace.href = urlVestido(modelo);
    enlace.textContent = modelo.nombre;
    titulo.appendChild(enlace);

    const tallas = document.createElement('p');
    tallas.className = 'tarjeta__tallas';
    const etiqueta = document.createElement('span');
    etiqueta.className = 'sr-only';
    etiqueta.textContent = 'Tallas: ';
    tallas.appendChild(etiqueta);
    modelo.tallas.forEach(t => {
        const s = document.createElement('span');
        s.className = t.disponible ? 'talla-mini' : 'talla-mini talla-mini--apartada';
        s.textContent = t.talla;
        if (!t.disponible) s.title = 'Apartada';
        tallas.appendChild(s);
        if (!t.disponible) {
            const nota = document.createElement('span');
            nota.className = 'sr-only';
            nota.textContent = ' (apartada)';
            tallas.appendChild(nota);
        }
    });
    cuerpo.append(titulo, tallas);

    tarjeta.append(media, cuerpo);
    li.appendChild(tarjeta);
    return li;
}
