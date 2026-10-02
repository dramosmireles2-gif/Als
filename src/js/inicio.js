// =============================================
// inicio.js: lógica propia de la página de inicio
// Destacados en carrusel nativo y mapa que se carga al tocarlo.
// =============================================
import { autoCarrusel } from './carrusel.js';
import { agruparPorModelo, obtenerUrlFoto, abrirLightbox, shouldReduceMotion, obtenerSb, cuandoSeAcerque } from './main.js';

const ORDEN_TALLAS = ['XXS', '2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
const ordenarTallas = tallas => [...tallas].sort((a, b) => {
    const ia = ORDEN_TALLAS.indexOf(a), ib = ORDEN_TALLAS.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
});

// ---- Destacados ----
function crearTarjeta(modelo) {
    const urlFoto = obtenerUrlFoto(modelo.foto);
    const li = document.createElement('li');
    li.className = 'carrusel__item';

    const tarjeta = document.createElement('article');
    tarjeta.className = 'tarjeta';

    const media = document.createElement('div');
    media.className = 'tarjeta__media';
    const img = document.createElement('img');
    img.src = urlFoto;
    img.alt = modelo.nombre;
    img.width = 600;
    img.height = 800;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => { img.src = obtenerUrlFoto(null); }, { once: true });
    const badge = document.createElement('span');
    badge.className = `badge tarjeta__badge ${modelo.hayDisponible ? 'badge--disponible' : 'badge--apartado'}`;
    badge.textContent = modelo.hayDisponible ? 'Disponible' : 'Apartado';
    media.append(img, badge);

    const cuerpo = document.createElement('div');
    cuerpo.className = 'tarjeta__cuerpo';
    const titulo = document.createElement('h3');
    titulo.className = 'tarjeta__nombre';
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'tarjeta__enlace';
    boton.textContent = modelo.nombre;
    boton.addEventListener('click', () => abrirLightbox(modelo, urlFoto));
    titulo.appendChild(boton);
    const tallas = document.createElement('p');
    tallas.className = 'tarjeta__tallas';
    tallas.textContent = `Tallas: ${ordenarTallas(modelo.tallasDisponibles).join(' · ')}`;
    cuerpo.append(titulo, tallas);

    tarjeta.append(media, cuerpo);
    li.appendChild(tarjeta);
    return li;
}

function iniciarFlechas(pista) {
    const prev = document.querySelector('[data-carrusel-prev]');
    const next = document.querySelector('[data-carrusel-next]');
    if (!prev || !next) return;
    const comportamiento = () => (shouldReduceMotion() ? 'auto' : 'smooth');
    const actualizar = () => {
        const max = pista.scrollWidth - pista.clientWidth - 2;
        prev.disabled = pista.scrollLeft <= 2;
        next.disabled = pista.scrollLeft >= max;
        prev.parentElement.hidden = max <= 0;
    };
    prev.addEventListener('click', () => pista.scrollBy({ left: -pista.clientWidth * 0.9, behavior: comportamiento() }));
    next.addEventListener('click', () => pista.scrollBy({ left: pista.clientWidth * 0.9, behavior: comportamiento() }));
    pista.addEventListener('scroll', actualizar, { passive: true });
    window.addEventListener('resize', actualizar, { passive: true });
    actualizar();
}

async function cargarDestacados() {
    const pista = document.getElementById('destacadosPista');
    const seccion = document.getElementById('destacados');
    if (!pista) return;
    try {
        const sb = await obtenerSb();
        const { data, error } = await sb
            .from('inventario')
            .select('*')
            .eq('publicado', true)
            .eq('destacado', true)
            .order('nombre');
        if (error) throw error;
        const modelos = agruparPorModelo(data || []);
        if (!modelos.length) {
            seccion.hidden = true;
            return;
        }
        pista.replaceChildren(...modelos.map(crearTarjeta));
        pista.setAttribute('aria-busy', 'false');
        iniciarFlechas(pista);
    } catch (err) {
        console.error('Error cargando destacados:', err);
        seccion.hidden = true;
    }
}

// ---- Mapa: se carga solo cuando la clienta lo pide ----
const MAPA_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3584.2937178945017!2d-98.29061312382362!3d26.056655677167793!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86650f59b87c169b%3A0x18fa5aa25b17a307!2sAls%20Dress!5e0!3m2!1ses-419!2smx!4v1770759259715!5m2!1ses-419!2smx';

function iniciarMapa() {
    const boton = document.querySelector('[data-mapa-cargar]');
    if (!boton) return;
    boton.addEventListener('click', () => {
        const iframe = document.createElement('iframe');
        iframe.src = MAPA_URL;
        iframe.title = 'Mapa de Als Dress en Reynosa';
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        iframe.allowFullscreen = true;
        boton.replaceWith(iframe);
        iframe.focus();
    });
}

// Los destacados se piden cuando la clienta se acerca a esa sección
cuandoSeAcerque(document.getElementById('destacados'), cargarDestacados);
iniciarMapa();
// Fotos de la tienda: avanzan solas en teléfono (en computadora se ven las 3)
autoCarrusel(document.querySelector('.visitanos__fotos'));
