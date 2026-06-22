// =============================================
// main.js — Catálogo Als Dress · Supabase
// =============================================

const WA_NUMBER  = '528991947566';
const APP_NAME   = 'RentaVestidosAPP-250346467';

// Google Ads conversion — reemplaza CONVERSION_LABEL con el ID real (AW-11262534800/XXXXXXXX)
const GA_CONVERSION_ID = 'AW-11262534800';
const GA_CONVERSION_LABEL = '_Ri3CMHfnrwcEJDJsvop';

function trackWAClick() {
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

function openWhatsApp(url) {
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

function shouldReduceMotion() {
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
function obtenerUrlFoto(foto) {
    const placeholder = 'https://placehold.co/400x500/f5f1eb/8a8a8e?text=Sin+Foto';
    if (!foto) return placeholder;
    if (foto.startsWith('http')) return foto;
    return `https://www.appsheet.com/template/gettablefileurl?appName=${encodeURIComponent(APP_NAME)}&tableName=${encodeURIComponent(TABLE_NAME)}&fileName=${encodeURIComponent(foto)}`;
}

// ============================================
// 1. HEADER scroll + menú hamburguesa
// ============================================
const header     = document.getElementById('header');
const menuToggle = document.getElementById('menuToggle');
const mainNav    = document.getElementById('mainNav');
const navOverlay = document.getElementById('navOverlay');

function cerrarMenu() {
    mainNav.classList.remove('open');
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    navOverlay?.classList.remove('open');
    unlockBodyScroll('main-menu');
}

function abrirMenu() {
    mainNav.classList.add('open');
    menuToggle.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
    navOverlay?.classList.add('open');
    lockBodyScroll('main-menu');
}

window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.contains('open');
    if (isOpen) {
        cerrarMenu();
    } else {
        abrirMenu();
    }
});

mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        cerrarMenu();
    });
});

navOverlay?.addEventListener('click', cerrarMenu);

window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        cerrarMenu();
    }
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
// 3. GALERÍA DE INTERIORES
// ============================================
const slides        = document.querySelectorAll('.foto-slide');
const dotsContainer = document.getElementById('galeriaDots');
let slideActual     = 0;

function irASlide(n) {
    if (!slides.length) return;
    slides[slideActual].classList.remove('active');
    dotsContainer.children[slideActual].classList.remove('active');
    slideActual = (n + slides.length) % slides.length;
    slides[slideActual].classList.add('active');
    dotsContainer.children[slideActual].classList.add('active');
}

if (slides.length && dotsContainer) {
    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = `galeria-dot${i === 0 ? ' active' : ''}`;
        dot.setAttribute('aria-label', `Ver foto ${i + 1} del local`);
        dot.addEventListener('click', () => irASlide(i));
        dotsContainer.appendChild(dot);
    });
    document.getElementById('btn-prev')?.addEventListener('click', () => irASlide(slideActual - 1));
    document.getElementById('btn-next')?.addEventListener('click', () => irASlide(slideActual + 1));
    if (!shouldReduceMotion()) {
        setInterval(() => irASlide(slideActual + 1), 6500);
    }
}

// ============================================
// 4. CARGA DESDE SUPABASE
// ============================================
function agruparPorModelo(data) {
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
        const { data, error } = await sb
            .from('inventario')
            .select('*')
            .eq('publicado', true)
            .order('nombre');

        if (error) throw error;

        todosLosModelos = agruparPorModelo(data);
        construirFiltrosTallas();
        renderizarCatalogo();

    } catch (err) {
        console.error('Error cargando catálogo:', err);
        const c = document.getElementById('productos-container');
        if (c) c.innerHTML = '<p class="mensaje-vacio">No se pudo cargar el catálogo. Intenta más tarde.</p>';
    }
}

// Inicia el carrusel de la sección destacados
function iniciarCarruselDestacados(total) {
    const carousel = document.getElementById('destCarousel');
    const track    = document.getElementById('productos-container');
    const wrapper  = document.getElementById('destWrapper');
    const prevBtn  = document.getElementById('destPrev');
    const nextBtn  = document.getElementById('destNext');
    const dotsEl   = document.getElementById('destDots');
    if (!carousel || !track || total === 0) return;

    let idx = 0;
    let gap = parseFloat(getComputedStyle(track).columnGap) || 24;

    function getVisible() {
        return window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
    }

    function getMaxIdx() {
        return Math.max(0, total - getVisible());
    }

    // All items fit: just center them, no carousel
    if (getVisible() >= total) {
        carousel.classList.add('dest-carousel--few');
        return;
    }

    function buildDots() {
        if (!dotsEl) return;
        dotsEl.innerHTML = '';
        const maxIdx = getMaxIdx();
        if (maxIdx <= 0) return;
        for (let i = 0; i <= maxIdx; i++) {
            const dot = document.createElement('button');
            dot.className = `dest-dot${i === 0 ? ' active' : ''}`;
            dot.setAttribute('aria-label', `Pieza ${i + 1}`);
            dot.addEventListener('click', () => goTo(i));
            dotsEl.appendChild(dot);
        }
    }

    function goTo(i) {
        const maxIdx = getMaxIdx();
        idx = Math.max(0, Math.min(i, maxIdx));
        const firstCard = track.firstElementChild;
        if (!firstCard) return;
        const cardW = firstCard.getBoundingClientRect().width + gap;
        track.style.transform = `translateX(-${idx * cardW}px)`;
        dotsEl?.querySelectorAll('.dest-dot').forEach((d, j) => d.classList.toggle('active', j === idx));
        if (prevBtn) prevBtn.disabled = idx === 0;
        if (nextBtn) nextBtn.disabled = idx >= maxIdx;
    }

    buildDots();
    goTo(0);

    prevBtn?.addEventListener('click', () => goTo(idx - 1));
    nextBtn?.addEventListener('click', () => goTo(idx + 1));

    let timer = null;
    const startAutoplay = () => {
        if (shouldReduceMotion() || timer) return;
        timer = setInterval(() => goTo(idx >= getMaxIdx() ? 0 : idx + 1), 5500);
    };
    const stopAutoplay = () => {
        if (!timer) return;
        clearInterval(timer);
        timer = null;
    };

    startAutoplay();
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);

    // Touch/swipe — primary navigation method on mobile
    if (wrapper) {
        let swipeX = 0;
        wrapper.addEventListener('touchstart', (e) => {
            swipeX = e.touches[0].clientX;
            stopAutoplay();
        }, { passive: true });
        wrapper.addEventListener('touchend', (e) => {
            const diff = swipeX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 40) goTo(diff > 0 ? idx + 1 : idx - 1);
            startAutoplay();
        }, { passive: true });
    }

    // Recalculate on resize — update gap since CSS changes it at breakpoints
    window.addEventListener('resize', () => {
        gap = parseFloat(getComputedStyle(track).columnGap) || 24;
        buildDots();
        goTo(Math.min(idx, getMaxIdx()));
    }, { passive: true });
}

// Carga solo los items marcados como destacado=true (landing)
async function cargarDestacados() {
    const contenedor = document.getElementById('productos-container');
    if (!contenedor) return;

    try {
        const { data, error } = await sb
            .from('inventario')
            .select('*')
            .eq('publicado', true)
            .eq('destacado', true)
            .order('nombre');

        if (error) throw error;

        if (!data.length) {
            // Sin destacados: ocultar sección entera
            document.getElementById('destacados')?.classList.add('hidden');
            return;
        }

        todosLosModelos = agruparPorModelo(data);
        const catPrevia  = categoriaActiva;
        categoriaActiva  = null;
        renderizarCatalogo();
        categoriaActiva  = catPrevia;
        iniciarCarruselDestacados(todosLosModelos.length);

    } catch (err) {
        console.error('Error cargando destacados:', err);
        document.getElementById('destacados')?.classList.add('hidden');
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
    if (!shouldReduceMotion() && window.Motion) {
        window.Motion.animate(cards,
            { opacity: [0, 1], y: [20, 0] },
            { duration: 0.42, delay: window.Motion.stagger(0.06), ease: [0.25, 0.46, 0.45, 0.94] }
        );
    } else {
        cards.forEach(c => { c.style.opacity = '1'; });
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

function abrirLightbox(vestido, urlFoto) {
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

    const crearItem = (foto) => {
        const div = document.createElement('div');
        div.className = 'galeria-cliente-item';
        div.innerHTML = `
            <img src="${foto.foto_url}" alt="${foto.nombre || 'Clienta Als Dress'}" loading="lazy"
                 onerror="this.parentElement.style.display='none'">
            ${foto.nombre ? `<div class="galeria-overlay"><p>${foto.nombre}</p></div>` : ''}`;
        div.onclick = () => abrirLightboxClientas(foto.foto_url, foto.nombre);
        return div;
    };

    // Original + copia para loop continuo e invisible
    [...data, ...data].forEach(foto => contenedor.appendChild(crearItem(foto)));

    // Velocidad proporcional al número de fotos
    contenedor.style.animationDuration = `${Math.max(30, data.length * 5)}s`;
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
const RUTAS_SECCIONES = {
    'inicio':      '/',
    'categorias':  '/',
    'beneficios':  '/',
    'faq':         '/',
    'testimonios': '/',
    'contacto':    '/',
    'ubicacion':   '/',
};

// Intercepta clics en nav para hacer scroll suave en vez de navegar
function initNavLinks() {
    const SCROLL_IDS = {
        '/coleccion':  'categorias',
        '/beneficios': 'beneficios',
        '/preguntas':  'faq',
        '/contacto':   'contacto',
        '/visita':     'ubicacion',
        '/ubicacion':  'ubicacion',
    };
    const esCatalogo = document.body.dataset.pagina === 'catalogo';
    document.querySelectorAll('#mainNav a[href^="/"], .hero-btn[href^="/"]').forEach(link => {
        link.addEventListener('click', e => {
            const path  = new URL(link.href, location.origin).pathname;
            const secId = SCROLL_IDS[path];
            if (secId) {
                e.preventDefault();
                if (esCatalogo) {
                    window.location.href = `/?p=${encodeURIComponent(path)}`;
                } else {
                    document.getElementById(secId)?.scrollIntoView({ behavior: 'smooth' });
                }
            } else if (path === '/') {
                if (!esCatalogo) {
                    e.preventDefault();
                    document.body.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

// Restaura scroll si el usuario llegó por una URL directa (via 404.html redirect)
function restaurarRuta() {
    const params  = new URLSearchParams(location.search);
    const rutaRaw = params.get('p');
    if (!rutaRaw) return;
    // Always keep URL clean as /
    history.replaceState(null, '', '/');
    const SCROLL_IDS = {
        '/coleccion':  'categorias',
        '/beneficios': 'beneficios',
        '/preguntas':  'faq',
        '/contacto':   'contacto',
        '/visita':     'ubicacion',
        '/ubicacion':  'ubicacion',
    };
    const secId = SCROLL_IDS[rutaRaw];
    if (secId) {
        setTimeout(() => document.getElementById(secId)?.scrollIntoView(), 100);
    }
}

// ============================================
// 10. CARRUSEL TESTIMONIOS (solo móvil)
// ============================================
function iniciarCarruselTestimonios() {
    if (window.innerWidth > 768) return;

    const grid   = document.getElementById('testimoniosGrid');
    const dotsEl = document.getElementById('testDots');
    if (!grid || !dotsEl) return;

    const cards = Array.from(grid.querySelectorAll('.testimonio-card'));
    if (cards.length < 2) return;

    // Construir dots
    const dots = cards.map((_, i) => {
        const d = document.createElement('button');
        d.type = 'button';
        d.className = 'test-dot' + (i === 0 ? ' active' : '');
        d.setAttribute('aria-label', `Ver testimonio ${i + 1}`);
        d.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(d);
        return d;
    });

    function currentIdx() {
        const gap = 14;
        const cardW = cards[0].offsetWidth + gap;
        return Math.round(grid.scrollLeft / cardW);
    }

    function goTo(i) {
        const gap = 14;
        grid.scrollTo({ left: i * (cards[0].offsetWidth + gap), behavior: 'smooth' });
    }

    function updateDots() {
        const idx = currentIdx();
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    }

    grid.addEventListener('scroll', updateDots, { passive: true });

    let timer = null;
    const startAutoplay = () => {
        if (shouldReduceMotion() || timer) return;
        timer = setInterval(() => {
            const next = (currentIdx() + 1) % cards.length;
            goTo(next);
        }, 4200);
    };
    const stopAutoplay = () => {
        if (!timer) return;
        clearInterval(timer);
        timer = null;
    };

    startAutoplay();
    grid.addEventListener('touchstart', stopAutoplay, { passive: true });
    grid.addEventListener('touchend', startAutoplay, { passive: true });
}

// ============================================
// 11. INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const esCatalogo = document.body.dataset.pagina === 'catalogo';

    // Página de catálogo: mostrar todo, sin filtro de destacados
    if (esCatalogo) {
        initNavLinks();

        // Marcar nav link activo
        document.querySelectorAll('#mainNav a').forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === '/catalogo');
        });

        // Aplicar filtro de categoría desde URL (?cat=X)
        const catParam = new URLSearchParams(location.search).get('cat');
        if (catParam) {
            categoriaActiva = catParam;
            document.querySelectorAll('[data-categoria]').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.categoria === catParam);
            });
        }

        // Sidebar mobile toggle
        document.getElementById('sidebarToggle')?.addEventListener('click', abrirSidebarCatalogo);
        document.getElementById('sidebarClose')?.addEventListener('click', cerrarSidebarCatalogo);
        document.getElementById('sidebarOverlay')?.addEventListener('click', cerrarSidebarCatalogo);

    } else {
        restaurarRuta();
        initNavLinks();

        // Ocultar botones flotantes mientras el botón WA del hero es visible
        const botonesFlotantes = document.querySelector('.botones-flotantes');
        const heroWaBtn = document.querySelector('.hero-btn-wa');
        if (botonesFlotantes && heroWaBtn) {
            botonesFlotantes.classList.add('oculto');
            new IntersectionObserver(([entry]) => {
                botonesFlotantes.classList.toggle('oculto', entry.isIntersecting);
            }, { threshold: 0 }).observe(heroWaBtn);
        }

        // ── 1. HERO ENTRANCE — stagger por hijo ──────────────────────────────
        const heroLeft = document.querySelector('.hero-left');
        if (heroLeft) {
            // Tomar control del reveal genérico: hacer el padre visible ya
            heroLeft.style.opacity = '1';
            heroLeft.style.transform = 'none';
            heroLeft.classList.add('visible');

            if (!shouldReduceMotion() && window.Motion) {
                const { animate, stagger } = window.Motion;
                const heroKids = Array.from(heroLeft.children);

                animate(heroKids,
                    { opacity: [0, 1], y: [28, 0] },
                    { duration: 0.65, delay: stagger(0.1), ease: [0.25, 0.46, 0.45, 0.94] }
                );

                const heroImg = document.querySelector('.hero-image-wrapper img');
                if (heroImg) {
                    animate(heroImg,
                        { opacity: [0, 1], x: [40, 0] },
                        { duration: 0.8, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }
                    );
                }
            } else {
                // Sin Motion / reduced-motion: mostrar de inmediato
                Array.from(heroLeft.children).forEach(el => { el.style.opacity = '1'; });
                const heroImgFallback = document.querySelector('.hero-image-wrapper img');
                if (heroImgFallback) heroImgFallback.style.opacity = '1';
            }
        }

        // ── 2. WHATSAPP FLOAT — pulso de atención ────────────────────────────
        const waFloat = document.querySelector('.btn-flotante.whatsapp');
        if (waFloat && !shouldReduceMotion() && window.Motion) {
            const ring = document.createElement('span');
            ring.className = 'wa-pulse-ring';
            ring.setAttribute('aria-hidden', 'true');
            waFloat.appendChild(ring);

            const pulse = () => {
                window.Motion.animate(ring,
                    { scale: [1, 1.85], opacity: [0.65, 0] },
                    { duration: 1.1, ease: 'ease-out' }
                ).then(() => { setTimeout(pulse, 3000); });
            };
            setTimeout(pulse, 3500); // primer pulso a los 3.5s
        }

        // ── 5. RATING COUNTER — cuenta 4.5 → 4.9 al entrar en viewport ──────
        const ratingEl = document.querySelector('.rating-score');
        if (ratingEl && !shouldReduceMotion()) {
            const from = 4.5, to = 4.9, dur = 1200;
            ratingEl.textContent = from.toFixed(1);
            new IntersectionObserver(([entry], obs) => {
                if (!entry.isIntersecting) return;
                obs.disconnect();
                const t0 = performance.now();
                const tick = (now) => {
                    const p = Math.min((now - t0) / dur, 1);
                    const eased = 1 - Math.pow(1 - p, 3);
                    ratingEl.textContent = (from + (to - from) * eased).toFixed(1);
                    if (p < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            }, { threshold: 0.5 }).observe(ratingEl);
        }

        // ── 6. CAT-CARD SPRING HOVER — lift de 8px con overshoot ─────────────
        if (window.matchMedia('(hover: hover)').matches && !shouldReduceMotion() && window.Motion) {
            document.querySelectorAll('.cat-card').forEach(card => {
                card.addEventListener('mouseenter', () => {
                    window.Motion.animate(card, { y: -8 }, { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] });
                });
                card.addEventListener('mouseleave', () => {
                    window.Motion.animate(card, { y: 0 }, { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] });
                });
            });
        }

        // ── 7. BENEFICIOS STAGGER REVEAL — 4 cards en ola ───────────────────
        const beneficioGrid = document.querySelector('.beneficios-grid');
        if (beneficioGrid && !shouldReduceMotion() && window.Motion) {
            const beneficioCards = beneficioGrid.querySelectorAll('.beneficio-card');
            new IntersectionObserver(([entry], obs) => {
                if (!entry.isIntersecting) return;
                obs.disconnect();
                beneficioCards.forEach(c => c.classList.add('visible'));
                window.Motion.animate(
                    beneficioCards,
                    { opacity: [0, 1], y: [24, 0] },
                    { duration: 0.5, delay: window.Motion.stagger(0.1), ease: [0.25, 0.46, 0.45, 0.94] }
                );
            }, { threshold: 0.15 }).observe(beneficioGrid);
        }

        // ── 11. HERO PARALLAX — imagen se mueve al 30% del scroll ────────────
        const heroSection = document.querySelector('.hero');
        const heroParallaxImg = document.querySelector('.hero-image-wrapper img');
        if (heroSection && heroParallaxImg && !shouldReduceMotion()) {
            setTimeout(() => {
                let ticking = false;
                window.addEventListener('scroll', () => {
                    if (ticking) return;
                    ticking = true;
                    requestAnimationFrame(() => {
                        const rect = heroSection.getBoundingClientRect();
                        if (rect.bottom > 0 && rect.top < window.innerHeight) {
                            heroParallaxImg.style.translate = `0 ${-rect.top * 0.3}px`;
                        }
                        ticking = false;
                    });
                }, { passive: true });
            }, 1200);
        }
    }

    // Centralizar links de WhatsApp y registrar conversión en cada click
    const waUrl = `https://wa.me/${WA_NUMBER}`;
    document.querySelectorAll(`a[href*="wa.me"]`).forEach(a => {
        a.href = waUrl;
        a.addEventListener('click', trackWAClick);
    });

    // Tarjetas de categorías → navegar a página de catálogo con filtro
    crearLightbox();
    if (esCatalogo) {
        cargarInventario();
    } else {
        cargarDestacados();
        iniciarCarruselTestimonios();
    }
    cargarGaleriaClientas();

    // ── 8. BUTTON PRESS FEEDBACK — scale 0.96 → 1 con overshoot ────────────
    if (!shouldReduceMotion() && window.Motion) {
        document.querySelectorAll(
            '.hero-btn, .beneficios-btn-wa, .destacados-btn-ver, .btn-flotante, .hero-btn-wa'
        ).forEach(el => {
            el.addEventListener('pointerdown', () => {
                window.Motion.animate(el, { scale: 0.96 }, { duration: 0.1, ease: 'ease-out' });
            });
            ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => {
                el.addEventListener(ev, () => {
                    window.Motion.animate(el, { scale: 1 }, { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] });
                });
            });
        });
    }

    // FAQ accordion — Motion anima la altura real (sin max-height hack)
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const isOpen = item.classList.contains('open');
            const useMotion = !shouldReduceMotion() && window.Motion;

            // Cerrar todos los abiertos
            document.querySelectorAll('.faq-item.open').forEach(el => {
                const ans = el.querySelector('.faq-answer');
                el.classList.remove('open');
                el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                if (useMotion) {
                    window.Motion.animate(ans,
                        { height: [ans.offsetHeight, 0] },
                        { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }
                    );
                } else {
                    ans.style.height = '0';
                }
            });

            if (!isOpen) {
                item.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
                const ans = item.querySelector('.faq-answer');
                const fullH = ans.scrollHeight;
                if (useMotion) {
                    window.Motion.animate(ans,
                        { height: [0, fullH] },
                        { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }
                    ).then(() => { ans.style.height = 'auto'; });
                } else {
                    ans.style.height = fullH + 'px';
                }
            }
        });
    });
});
