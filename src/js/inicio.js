// =============================================
// inicio.js: lógica propia de la página de inicio
// Destacados en carrusel nativo y mapa que se carga al tocarlo.
// =============================================
import { autoCarrusel } from './carrusel.js';
import { shouldReduceMotion, cuandoSeAcerque } from './main.js';
import { cargarModelos } from './datos.js';
import { crearTarjeta } from './tarjeta.js';

function iniciarFlechas(pista) {
    const prev = document.querySelector('[data-carrusel-prev]');
    const next = document.querySelector('[data-carrusel-next]');
    if (!prev || !next) return;
    const comportamiento = () => (shouldReduceMotion() ? 'auto' : 'smooth');
    const actualizar = () => {
        const max = pista.scrollWidth - pista.clientWidth - 2;
        prev.disabled = pista.scrollLeft <= 2;
        next.disabled = pista.scrollLeft >= max;
        prev.hidden = next.hidden = max <= 0;
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
        const modelos = (await cargarModelos()).filter(m => m.destacado);
        if (!modelos.length) {
            seccion.hidden = true;
            return;
        }
        // Primero los que tienen tallas disponibles
        modelos.sort((x, y) => Number(y.hayDisponible) - Number(x.hayDisponible));
        pista.replaceChildren(...modelos.map(m => crearTarjeta(m)));
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

// Telón del probador: se abre cuando la foto del hero ya está lista (máximo 1.5 s de espera)
function abrirTelon() {
    const raiz = document.documentElement;
    const foto = document.querySelector('.hero-nuevo__foto');
    if (!raiz.classList.contains('telon') || !foto) return;
    try { sessionStorage.setItem('als:telon', '1'); } catch { /* sin almacenamiento: se abre igual */ }
    const img = foto.querySelector('img');
    const lista = img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    const pausa = new Promise(r => setTimeout(r, 250));
    const limite = new Promise(r => setTimeout(r, 1500));
    Promise.race([Promise.all([lista, pausa]), limite]).then(() => {
        clearTimeout(window.alsTelon);
        foto.addEventListener('transitionend', () => raiz.classList.remove('telon', 'telon--abrir'), { once: true });
        requestAnimationFrame(() => raiz.classList.add('telon--abrir'));
    });
}
abrirTelon();
