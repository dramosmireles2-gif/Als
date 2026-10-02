// =============================================
// main.js — Catálogo Als Dress · Supabase
// =============================================
import './nav.js';
import { autoCarrusel } from './carrusel.js';

// Supabase y Motion se descargan solo cuando hacen falta: la página abre más rápido
export const obtenerSb = () => import('./supabase.js').then(m => m.sb);
const cargarMotion = () => import('motion');

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


export const WA_NUMBER  = '528991947566';
const APP_NAME   = 'RentaVestidosAPP-250346467';

// Google Ads conversion — reemplaza CONVERSION_LABEL con el ID real (AW-11262534800/XXXXXXXX)
const GA_CONVERSION_ID = 'AW-11262534800';
const GA_CONVERSION_LABEL = '_Ri3CMHfnrwcEJDJsvop';

export function trackWAClick() {
    if (typeof gtag === 'undefined') return;
    // Evento genérico — visible en Google Ads como evento de click
    gtag('event', 'click_whatsapp', { event_category: 'contacto', event_label: 'whatsapp' });
    // Conversión específica de campaña (activa cuando se agregue el label)
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

const TABLE_NAME = 'Inventario';
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const bodyScrollLocks = new Set();

// ---- Estado ----
let todosLosModelos  = [];
let filtroDisponible = false;
let tallaActiva      = null;
let categoriaActiva  = 'Vestido';
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

function updateCatalogCategoryUrl() {
    if (document.body.dataset.pagina !== 'catalogo' || !categoriaActiva) return;
    const url = new URL(window.location.href);
    url.searchParams.set('cat', categoriaActiva);
    history.replaceState(null, '', `${url.pathname}${url.search}`);
}

function cerrarSidebarCatalogo() {
    document.getElementById('catalogoSidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('open');
    document.getElementById('sidebarToggle')?.setAttribute('aria-expanded', 'false');
    unlockBodyScroll('catalogo-sidebar');
}

function abrirSidebarCatalogo() {
    document.getElementById('catalogoSidebar')?.classList.add('open');
    document.getElementById('sidebarOverlay')?.classList.add('open');
    document.getElementById('sidebarToggle')?.setAttribute('aria-expanded', 'true');
    lockBodyScroll('catalogo-sidebar');
}

function cerrarSidebarCatalogoSiAplica() {
    if (window.innerWidth <= 960) {
        cerrarSidebarCatalogo();
    }
}

// ---- Helper foto ----
export function obtenerUrlFoto(foto) {
    const placeholder = 'https://placehold.co/400x500/f5f1eb/8a8a8e?text=Sin+Foto';
    if (!foto) return placeholder;
    if (foto.startsWith('http')) return foto;
    return `https://www.appsheet.com/template/gettablefileurl?appName=${encodeURIComponent(APP_NAME)}&tableName=${encodeURIComponent(TABLE_NAME)}&fileName=${encodeURIComponent(foto)}`;
}

// Al agrandar la ventana se cierra el panel de filtros del catálogo
window.addEventListener('resize', () => {
    if (window.innerWidth > 960) {
        cerrarSidebarCatalogo();
    }
});

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
// 4. CARGA DESDE SUPABASE
// ============================================
export function agruparPorModelo(data) {
    const modelos = {};
    data.forEach(item => {
        const nombre = (item.nombre || '').trim();
        if (!nombre) return;
        if (!modelos[nombre]) {
            modelos[nombre] = {
                ...item,
                tallasDisponibles: [item.talla].filter(Boolean),
                hayDisponible: item.estado_actual === 'Disponible'
            };
        } else {
            if (item.talla && !modelos[nombre].tallasDisponibles.includes(item.talla)) {
                modelos[nombre].tallasDisponibles.push(item.talla);
            }
            if (item.estado_actual === 'Disponible') modelos[nombre].hayDisponible = true;
        }
    });
    return Object.values(modelos);
}

// Carga el catálogo completo (página /catalogo)
async function cargarInventario() {
    try {
        const sb = await obtenerSb();
        const { data, error } = await sb
            .from('inventario')
            .select('*')
            .eq('publicado', true)
            .order('nombre');

        if (error) throw error;

        todosLosModelos = agruparPorModelo(data);
        construirFiltrosTallas();
        if (tallaActiva) {
            const btn = document.querySelector(`#tallasFiltro [data-talla="${CSS.escape(tallaActiva)}"]`);
            if (btn) btn.classList.add('active');
            else tallaActiva = null;
        }
        renderizarCatalogo();

    } catch (err) {
        console.error('Error cargando catálogo:', err);
        const c = document.getElementById('productos-container');
        if (c) c.innerHTML = '<p class="mensaje-vacio">No se pudo cargar el catálogo. Intenta más tarde.</p>';
    }
}

// ============================================
// 5. FILTROS
// ============================================

// Categorías
document.querySelectorAll('[data-categoria]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('[data-categoria]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        categoriaActiva = btn.dataset.categoria;
        tallaActiva     = null;
        document.querySelectorAll('#tallasFiltro .filtro-btn').forEach(b => b.classList.remove('active'));
        construirFiltrosTallas();
        renderizarCatalogo();
        updateCatalogCategoryUrl();
        cerrarSidebarCatalogoSiAplica();
    });
});

// Disponibilidad
document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filtroDisponible = btn.dataset.filter === 'disponible';
        renderizarCatalogo();
        cerrarSidebarCatalogoSiAplica();
    });
});

function construirFiltrosTallas() {
    const modelosFiltrados = todosLosModelos.filter(m =>
        !categoriaActiva || (m.tipo || 'Vestido') === categoriaActiva
    );
    const tallaSet = new Set();
    modelosFiltrados.forEach(m => m.tallasDisponibles.forEach(t => tallaSet.add(t)));

    const orden = ['XXS','2XS','XS','S','M','L','XL','2XL','3XL','4XL'];
    const tallas = [...tallaSet].sort((a, b) => {
        const ia = orden.indexOf(a), ib = orden.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1; if (ib !== -1) return 1;
        return a.localeCompare(b);
    });

    const contenedor = document.getElementById('tallasFiltro');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    tallas.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'filtro-btn';
        btn.textContent = t;
        btn.dataset.talla = t;
        btn.addEventListener('click', () => toggleTalla(t, btn));
        contenedor.appendChild(btn);
    });
}

function toggleTalla(talla, btn) {
    if (tallaActiva === talla) {
        tallaActiva = null; btn.classList.remove('active');
    } else {
        document.querySelectorAll('#tallasFiltro .filtro-btn').forEach(b => b.classList.remove('active'));
        tallaActiva = talla; btn.classList.add('active');
    }
    renderizarCatalogo();
    cerrarSidebarCatalogoSiAplica();
}

// ============================================
// 6. RENDERIZADO DEL CATÁLOGO
// ============================================
function renderizarCatalogo() {
    const contenedor = document.getElementById('productos-container');
    const msgVacio   = document.getElementById('mensaje-vacio');
    if (!contenedor) return;

    let lista = [...todosLosModelos];

    // Filtro categoría
    if (categoriaActiva) {
        lista = lista.filter(m => (m.tipo || 'Vestido') === categoriaActiva);
    }

    // Filtro disponibilidad
    if (filtroDisponible) lista = lista.filter(m => m.hayDisponible);

    // Filtro talla
    if (tallaActiva) lista = lista.filter(m => m.tallasDisponibles.includes(tallaActiva));

    contenedor.innerHTML = '';

    const countEl = document.getElementById('resultCount');
    if (countEl) countEl.textContent = lista.length ? `${lista.length} ${lista.length === 1 ? 'pieza' : 'piezas'}` : '';

    if (lista.length === 0) {
        msgVacio.classList.remove('hidden');
        // Si la categoría no tiene productos, mostrar "Próximamente"
        const tieneProductosEnCategoria = todosLosModelos.some(m => (m.tipo||'Vestido') === categoriaActiva);
        if (!tieneProductosEnCategoria) {
            contenedor.innerHTML = `
                <div class="proximamente-card">
                    <div class="prox-icon">✨</div>
                    <h3>¡Próximamente!</h3>
                    <p>Estamos preparando nuestra colección de <b>${categoriaActiva}s</b>.<br>Síguenos en redes para ser la primera en enterarte.</p>
                    <a href="https://www.instagram.com/als_dress" target="_blank" class="prox-btn">Seguir en Instagram</a>
                </div>`;
            msgVacio.classList.add('hidden');
        }
        return;
    }

    msgVacio.classList.add('hidden');

    lista.forEach((vestido) => {
        const urlFoto    = obtenerUrlFoto(vestido.foto);
        const disponible = vestido.hayDisponible;
        const nombre     = vestido.nombre;

        const textoWA = `Hola Als Dress! Vi en su catálogo el vestido "${nombre}". ¿Tienen disponibilidad en alguna talla?`;
        const urlWA   = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(textoWA)}`;

        const tallasChips = vestido.tallasDisponibles.sort()
            .map(t => `<span class="card-talla-chip">${t}</span>`).join('');

        const card = document.createElement('div');
        card.className = 'card-producto';
        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${urlFoto}" alt="${nombre}" loading="lazy"
                     onerror="this.onerror=null; this.src='https://placehold.co/400x500/f5f1eb/8a8a8e?text=Sin+Foto'">
                <span class="badge-estado ${disponible ? 'badge-disponible' : 'badge-agotado'}">
                    <span class="badge-dot"></span>
                    ${disponible ? 'Disponible' : 'Rentado'}
                </span>
                <div class="card-img-hover"><span>Ver detalles</span></div>
            </div>
            <div class="card-info">
                <h3 class="card-nombre">${nombre}</h3>
                <div class="card-nombre-deco" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                </div>
                <div class="card-tallas-wrap">
                    <span class="card-tallas-label">Tallas disponibles</span>
                    <div class="card-tallas-chips">${tallasChips}</div>
                </div>
                ${disponible
                    ? `<button class="btn-accion btn-disponible" type="button" data-wa-url="${urlWA}">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.986-1.418A9.935 9.935 0 0 0 12 22c5.523 0 10-4.477 10-10S17.522 2 12 2z"/></svg>
                        Consultar disponibilidad
                       </button>`
                    : `<button class="btn-accion btn-agotado" type="button" disabled>Actualmente rentado</button>`
                }
            </div>`;

        const openDetails = () => abrirLightbox(vestido, urlFoto);
        const imageTrigger = card.querySelector('.card-img-wrapper');
        const nameTrigger = card.querySelector('.card-nombre');
        const waTrigger = card.querySelector('[data-wa-url]');

        imageTrigger.setAttribute('role', 'button');
        imageTrigger.setAttribute('tabindex', '0');
        imageTrigger.setAttribute('aria-label', `Ver detalles de ${nombre}`);
        imageTrigger.addEventListener('click', openDetails);
        imageTrigger.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openDetails();
            }
        });

        nameTrigger.setAttribute('role', 'button');
        nameTrigger.setAttribute('tabindex', '0');
        nameTrigger.setAttribute('aria-label', `Abrir detalles de ${nombre}`);
        nameTrigger.addEventListener('click', openDetails);
        nameTrigger.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openDetails();
            }
        });

        waTrigger?.addEventListener('click', (event) => {
            event.stopPropagation();
            openWhatsApp(event.currentTarget.dataset.waUrl);
        });
        card.style.cursor = 'pointer';
        contenedor.appendChild(card);
    });

    // ── 4. PRODUCT STAGGER — entrada escalonada ──────────────────────────────
    const cards = contenedor.querySelectorAll('.card-producto');
    if (!shouldReduceMotion()) {
        cargarMotion().then(({ animate, stagger }) => animate(cards,
            { opacity: [0, 1], y: [20, 0] },
            { duration: 0.42, delay: stagger(0.06), ease: [0.25, 0.46, 0.45, 0.94] }
        )).catch(() => {});
    }

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
                        <span>El vestido es tuyo por 3 días</span>
                    </div>
                    <div class="lb-benefit-item">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17 5.8 21.3l2.4-7.4L2 9.4h7.6z"/></svg>
                        <span>Limpieza profesional incluida</span>
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

export function abrirLightbox(vestido, urlFoto) {
    const lb         = document.getElementById('lightbox');
    const disponible = vestido.hayDisponible;
    lightboxLastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    document.getElementById('lightbox-img').src              = urlFoto;
    document.getElementById('lightbox-img').alt              = vestido.nombre;
    document.getElementById('lightbox-categoria').textContent = (vestido.tipo || 'Vestido').toUpperCase();
    document.getElementById('lightbox-nombre').textContent   = vestido.nombre;

    document.getElementById('lb-tallas-section').style.display = '';
    const chipsEl = document.getElementById('lightbox-tallas');
    chipsEl.innerHTML = vestido.tallasDisponibles.sort()
        .map(t => `<span class="talla-chip">${t}</span>`).join('');

    const badge = document.getElementById('lightbox-badge');
    badge.style.display = '';
    badge.innerHTML   = disponible ? '<span class="lb-badge-dot"></span> Disponible' : 'Actualmente Rentado';
    badge.className   = `lightbox-badge ${disponible ? 'disponible' : 'agotado'}`;

    const btnWa = document.getElementById('lightbox-btn-wa');
    if (disponible) {
        const textoWA = `Hola Als Dress! Vi en su catálogo el vestido "${vestido.nombre}". ¿Tienen disponibilidad en alguna talla?`;
        btnWa.onclick = () => openWhatsApp(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(textoWA)}`);
        btnWa.disabled = false;
        btnWa.innerHTML = `${WA_ICON_SVG} Consultar por WhatsApp`;
        btnWa.className = 'lightbox-btn-wa';
    } else {
        btnWa.innerHTML = 'No disponible por el momento';
        btnWa.className = 'lightbox-btn-wa deshabilitado';
        btnWa.disabled  = true;
        btnWa.onclick   = null;
    }

    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    lb.setAttribute('aria-hidden', 'false');
    lockBodyScroll('lightbox');
    document.getElementById('lightboxCerrar')?.focus();
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
document.addEventListener('DOMContentLoaded', () => {
    const esCatalogo = document.body.dataset.pagina === 'catalogo';

    // Página de catálogo: mostrar todo, sin filtro de destacados
    if (esCatalogo) {
        // Aplicar filtros desde la URL (?cat=X&talla=M)
        const params = new URLSearchParams(location.search);
        const catParam = params.get('cat');
        if (catParam) {
            categoriaActiva = catParam;
            document.querySelectorAll('[data-categoria]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.categoria === catParam);
            });
        }
        tallaActiva = params.get('talla');

        // Sidebar mobile toggle
        document.getElementById('sidebarToggle')?.addEventListener('click', abrirSidebarCatalogo);
        document.getElementById('sidebarClose')?.addEventListener('click', cerrarSidebarCatalogo);
        document.getElementById('sidebarOverlay')?.addEventListener('click', cerrarSidebarCatalogo);

    } else {
        restaurarRuta();
    }

    // Registrar la conversión en cada link de WhatsApp (se respeta el mensaje prellenado)
    document.querySelectorAll(`a[href*="wa.me"]`).forEach(a => {
        a.addEventListener('click', trackWAClick);
    });

    crearLightbox();
    if (esCatalogo) {
        cargarMotion();
        cargarInventario();
    }
    cuandoSeAcerque(document.getElementById('opiniones'), cargarGaleriaClientas);
});
