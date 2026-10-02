// =============================================
// main.js: lo común a todas las páginas
// Navegación, Mi lista, medición de WhatsApp, galería de clientas y su
// lightbox, y rutas viejas (/beneficios…). El catálogo vive en catalogo.js
// y la página de cada vestido en vestido.js.
// =============================================
import './nav.js';
import './mi-lista.js';
import { autoCarrusel } from './carrusel.js';
import { obtenerSb } from './datos.js';

export { obtenerSb, obtenerUrlFoto } from './datos.js';

// Ejecuta fn cuando el elemento está por entrar a la pantalla
export function cuandoSeAcerque(el, fn, margen = '600px') {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver(entradas => {
        if (entradas.some(e => e.isIntersecting)) {
            io.disconnect();
            fn();
        }
    }, { rootMargin: margen });
    io.observe(el);
}

export const WA_NUMBER = '528991947566';

// Conversión de Google Ads — NO TOCAR (AW-11262534800)
const GA_CONVERSION_ID = 'AW-11262534800';
const GA_CONVERSION_LABEL = '_Ri3CMHfnrwcEJDJsvop';

export function trackWAClick() {
    if (typeof gtag === 'undefined') return;
    // Evento genérico — visible en Google Ads como evento de click
    gtag('event', 'click_whatsapp', { event_category: 'contacto', event_label: 'whatsapp' });
    // Conversión específica de campaña
    if (GA_CONVERSION_LABEL) {
        gtag('event', 'conversion', {
            send_to: `${GA_CONVERSION_ID}/${GA_CONVERSION_LABEL}`,
            value: 1.0,
            currency: 'MXN'
        });
    }
}

export function openWhatsApp(url) {
    trackWAClick();
    window.open(url, '_blank', 'noopener');
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const bodyScrollLocks = new Set();
let lightboxLastFocused = null;

export function shouldReduceMotion() {
    return prefersReducedMotion.matches;
}

function syncBodyScrollLock() {
    const locked = bodyScrollLocks.size > 0;
    document.body.classList.toggle('menu-open', locked);
    document.body.style.overflow = locked ? 'hidden' : '';
}

function lockBodyScroll(source) {
    bodyScrollLocks.add(source);
    syncBodyScrollLock();
}

function unlockBodyScroll(source) {
    bodyScrollLocks.delete(source);
    syncBodyScrollLock();
}

// ============================================
// 2. REVEAL ON SCROLL
// ============================================
if (shouldReduceMotion()) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
} else {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 80);
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

// ============================================
// 7. LIGHTBOX
// ============================================
const WA_ICON_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.986-1.418A9.935 9.935 0 0 0 12 22c5.523 0 10-4.477 10-10S17.522 2 12 2z"/></svg>`;

function crearLightbox() {
    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-hidden', 'true');
    lb.setAttribute('aria-labelledby', 'lightbox-nombre');
    lb.innerHTML = `
        <div class="lightbox-inner">
            <div class="lightbox-img-wrap">
                <img id="lightbox-img" src="" alt="">
            </div>
            <div class="lightbox-info">
                <button class="lightbox-cerrar" id="lightboxCerrar">✕</button>
                <p class="lb-eyebrow">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                    <span id="lightbox-categoria"></span>
                </p>
                <h2 class="lightbox-nombre" id="lightbox-nombre"></h2>
                <div class="lb-divider">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                </div>
                <div class="lightbox-tallas" id="lb-tallas-section">
                    <span>Tallas disponibles</span>
                    <div class="lightbox-tallas-chips" id="lightbox-tallas"></div>
                </div>
                <span class="lightbox-badge" id="lightbox-badge"></span>
                <hr class="lb-hr">
                <div class="lb-benefits">
                    <div class="lb-benefit-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        <span>Renta de 3 a 4 días</span>
                    </div>
                    <div class="lb-benefit-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6z"/></svg>
                        <span>Ajustes incluidos con tu renta</span>
                    </div>
                </div>
                <button class="lightbox-btn-wa" id="lightbox-btn-wa"></button>
                <p class="lb-trust">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Tu información está segura
                </p>
            </div>
        </div>`;
    document.body.appendChild(lb);
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-hidden', 'true');
    lb.setAttribute('aria-labelledby', 'lightbox-nombre');
    document.getElementById('lightboxCerrar').setAttribute('type', 'button');
    document.getElementById('lightboxCerrar').setAttribute('aria-label', 'Cerrar detalles');
    document.getElementById('lightboxCerrar').textContent = 'X';
    document.getElementById('lightbox-btn-wa').setAttribute('type', 'button');
    document.getElementById('lightboxCerrar').addEventListener('click', cerrarLightbox);
    lb.addEventListener('click', (e) => { if (e.target === lb) cerrarLightbox(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarLightbox(); });
    document.addEventListener('keydown', handleLightboxKeydown);
}

function getLightboxFocusableElements() {
    const lb = document.getElementById('lightbox');
    if (!lb) return [];
    return [...lb.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')]
        .filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
}

function handleLightboxKeydown(event) {
    const lb = document.getElementById('lightbox');
    if (!lb?.classList.contains('open') || event.key !== 'Tab') return;

    const focusable = getLightboxFocusableElements();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function cerrarLightbox() {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
    document.getElementById('lightbox')?.setAttribute('aria-hidden', 'true');
    unlockBodyScroll('lightbox');
    lightboxLastFocused?.focus?.();
}

// ============================================
// 8. GALERÍA DE CLIENTAS
// ============================================
async function cargarGaleriaClientas() {
    const contenedor = document.getElementById('galeria-clientas-grid');
    if (!contenedor) return;

    const sb = await obtenerSb();
    const { data, error } = await sb
        .from('galeria_clientas')
        .select('*')
        .eq('activa', true)
        .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
        document.getElementById('sec-galeria-clientas').classList.add('hidden');
        return;
    }

    document.getElementById('sec-galeria-clientas').classList.remove('hidden');
    contenedor.innerHTML = '';

    // Cada foto es un botón que abre la foto grande
    data.forEach(foto => {
        const li = document.createElement('li');
        const nombre = foto.nombre || 'Clienta Als Dress';
        li.className = 'galeria-clientas__item';
        li.innerHTML = `
            <button type="button" class="galeria-clientas__boton">
                <img src="${foto.foto_url}" alt="" loading="lazy" decoding="async" width="300" height="400"
                     onerror="this.closest('li').remove()">
                <span class="sr-only">Ver foto de ${nombre}</span>
                ${foto.nombre ? `<span class="galeria-clientas__nombre" aria-hidden="true">${foto.nombre}</span>` : ''}
            </button>`;
        li.querySelector('button').addEventListener('click', () => abrirLightboxClientas(foto.foto_url, foto.nombre));
        contenedor.appendChild(li);
    });
    autoCarrusel(contenedor);
}

// ============================================
// 8B. LIGHTBOX CLIENTAS
// ============================================
function abrirLightboxClientas(url, nombre) {
    const lb    = document.getElementById('lightbox');
    const msgWA = `Hola Als Dress! Vi las fotos de sus clientas y me encantó. ¿Me pueden ayudar a encontrar mi vestido ideal?`;
    const urlWA = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msgWA)}`;
    lightboxLastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    document.getElementById('lightbox-img').src  = url;
    document.getElementById('lightbox-img').alt  = nombre || 'Clienta Als Dress';

    document.getElementById('lightbox-categoria').textContent = 'ALS DRESS';
    document.getElementById('lightbox-nombre').textContent    = nombre || 'Clienta Als Dress';

    document.getElementById('lb-tallas-section').style.display = 'none';

    const badge = document.getElementById('lightbox-badge');
    badge.style.display = 'none';

    const btnWa = document.getElementById('lightbox-btn-wa');
    btnWa.innerHTML = `${WA_ICON_SVG} ¡Quiero lucir así también!`;
    btnWa.className = 'lightbox-btn-wa';
    btnWa.disabled  = false;
    btnWa.onclick   = () => openWhatsApp(urlWA);

    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    lb.setAttribute('aria-hidden', 'false');
    lockBodyScroll('lightbox');
    document.getElementById('lightboxCerrar')?.focus();
}

// ============================================
// 9. URL MANAGEMENT — clean paths, no hashes
// ============================================
// Restaura scroll si el usuario llegó por una URL directa (via 404.html redirect)
function restaurarRuta() {
    const params  = new URLSearchParams(location.search);
    const rutaRaw = params.get('p');
    if (!rutaRaw) return;
    // Always keep URL clean as /
    history.replaceState(null, '', '/');
    const SCROLL_IDS = {
        '/coleccion':  'ocasiones',
        '/beneficios': 'como-rentar',
        '/preguntas':  'faq',
        '/contacto':   'contacto',
        '/visita':     'visitanos',
        '/ubicacion':  'visitanos',
    };
    const secId = SCROLL_IDS[rutaRaw];
    if (secId) {
        setTimeout(() => document.getElementById(secId)?.scrollIntoView(), 100);
    }
}

// ============================================
// 11. INIT
// ============================================
// Registrar la conversión en cualquier link de WhatsApp, también en los que
// se crean después (tarjetas, página del vestido, Mi lista). Se respeta el
// mensaje prellenado.
document.addEventListener('click', e => {
    if (e.target.closest('a[href*="wa.me"]')) trackWAClick();
});

document.addEventListener('DOMContentLoaded', () => {
    if (location.pathname === '/' || location.pathname === '/index.html') restaurarRuta();
    crearLightbox();
    cuandoSeAcerque(document.getElementById('opiniones'), cargarGaleriaClientas);
});
