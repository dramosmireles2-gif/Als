// =============================================
// main.js — Catálogo Als Dress · Supabase
// =============================================

const WA_NUMBER  = '528991947566';
const APP_NAME   = 'RentaVestidosAPP-250346467';
const TABLE_NAME = 'Inventario';

// ---- Estado ----
let todosLosModelos = [];
let filtroDisponible = false;
let tallaActiva      = null;
let categoriaActiva  = 'Vestido';

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

window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
});

mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        mainNav.classList.remove('open');
        menuToggle.classList.remove('open');
        document.body.style.overflow = '';
    });
});

// ============================================
// 2. REVEAL ON SCROLL
// ============================================
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 80);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ============================================
// 3. GALERÍA DE INTERIORES
// ============================================
const slides        = document.querySelectorAll('.foto-slide');
const dotsContainer = document.getElementById('galeriaDots');
let slideActual     = 0;

slides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = `galeria-dot${i === 0 ? ' active' : ''}`;
    dot.addEventListener('click', () => irASlide(i));
    dotsContainer.appendChild(dot);
});

function irASlide(n) {
    slides[slideActual].classList.remove('active');
    dotsContainer.children[slideActual].classList.remove('active');
    slideActual = (n + slides.length) % slides.length;
    slides[slideActual].classList.add('active');
    dotsContainer.children[slideActual].classList.add('active');
}

document.getElementById('btn-prev').addEventListener('click', () => irASlide(slideActual - 1));
document.getElementById('btn-next').addEventListener('click', () => irASlide(slideActual + 1));
setInterval(() => irASlide(slideActual + 1), 6500);

// ============================================
// 4. CARGA DESDE SUPABASE
// ============================================
async function cargarInventario() {
    try {
        const { data, error } = await sb
            .from('inventario')
            .select('*')
            .eq('publicado', true)
            .order('nombre');

        if (error) throw error;

        // Agrupar por nombre de modelo
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

        todosLosModelos = Object.values(modelos);
        construirFiltrosTallas();
        renderizarCatalogo();

    } catch (err) {
        console.error('Error cargando catálogo:', err);
        document.getElementById('productos-container').innerHTML =
            '<p class="mensaje-vacio">No se pudo cargar el catálogo. Intenta más tarde.</p>';
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
    });
});

// Disponibilidad
document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filtroDisponible = btn.dataset.filter === 'disponible';
        renderizarCatalogo();
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

    lista.forEach((vestido, i) => {
        const urlFoto    = obtenerUrlFoto(vestido.foto);
        const disponible = vestido.hayDisponible;
        const nombre     = vestido.nombre;

        const textoWA = `Hola Als Dress! Vi en su catálogo el vestido "${nombre}". ¿Tienen disponibilidad en alguna talla?`;
        const urlWA   = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(textoWA)}`;

        const tallasChips = vestido.tallasDisponibles.sort()
            .map(t => `<span class="card-talla-chip">${t}</span>`).join('');

        const card = document.createElement('div');
        card.className = 'card-producto';
        card.style.animationDelay = `${i * 60}ms`;
        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${urlFoto}" alt="${nombre}" loading="lazy"
                     onerror="this.onerror=null; this.src='https://placehold.co/400x500/f5f1eb/8a8a8e?text=Sin+Foto'">
                <span class="badge-estado ${disponible ? 'badge-disponible' : 'badge-agotado'}">
                    <span class="badge-dot"></span>
                    ${disponible ? 'Disponible' : 'Rentado'}
                </span>
                <button class="card-fav-btn" aria-label="Favorito">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
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
                    ? `<button class="btn-accion btn-disponible" onclick="window.open('${urlWA}','_blank')">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.986-1.418A9.935 9.935 0 0 0 12 22c5.523 0 10-4.477 10-10S17.522 2 12 2z"/></svg>
                        Consultar disponibilidad
                       </button>`
                    : `<button class="btn-accion btn-agotado" disabled>Actualmente rentado</button>`
                }
            </div>`;

        card.querySelector('.card-img-wrapper').addEventListener('click', () => abrirLightbox(vestido, urlFoto));
        card.querySelector('.card-nombre').addEventListener('click', () => abrirLightbox(vestido, urlFoto));
        card.querySelector('.card-fav-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            e.currentTarget.classList.toggle('faved');
        });
        card.style.cursor = 'pointer';
        contenedor.appendChild(card);
    });
}

// ============================================
// 7. LIGHTBOX
// ============================================
const WA_ICON_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.986-1.418A9.935 9.935 0 0 0 12 22c5.523 0 10-4.477 10-10S17.522 2 12 2z"/></svg>`;

function crearLightbox() {
    const lb = document.createElement('div');
    lb.id = 'lightbox';
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
    document.getElementById('lightboxCerrar').addEventListener('click', cerrarLightbox);
    lb.addEventListener('click', (e) => { if (e.target === lb) cerrarLightbox(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarLightbox(); });
}

function abrirLightbox(vestido, urlFoto) {
    const lb         = document.getElementById('lightbox');
    const disponible = vestido.hayDisponible;

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
        btnWa.onclick = () => window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(textoWA)}`, '_blank');
        btnWa.innerHTML = `${WA_ICON_SVG} Consultar por WhatsApp`;
        btnWa.className = 'lightbox-btn-wa';
    } else {
        btnWa.innerHTML = 'No disponible por el momento';
        btnWa.className = 'lightbox-btn-wa deshabilitado';
        btnWa.onclick   = null;
    }

    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function cerrarLightbox() {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
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
    btnWa.onclick   = () => window.open(urlWA, '_blank');

    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
}

// ============================================
// 9. INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Centralizar links de WhatsApp definidos en el HTML
    const waUrl = `https://wa.me/${WA_NUMBER}`;
    document.querySelectorAll(`a[href*="wa.me"]`).forEach(a => a.href = waUrl);

    // Ocultar botones flotantes mientras el hero es visible
    const botonesFlotantes = document.querySelector('.botones-flotantes');
    const heroEl = document.getElementById('inicio');
    if (botonesFlotantes && heroEl) {
        botonesFlotantes.classList.add('oculto');
        new IntersectionObserver(([entry]) => {
            botonesFlotantes.classList.toggle('oculto', entry.isIntersecting);
        }, { threshold: 0.2 }).observe(heroEl);
    }

    // Tarjetas de categorías → scroll a catálogo + activar filtro
    document.querySelectorAll('[data-goto-categoria]').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = card.dataset.gotoCategoria;
            document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
                const btn = document.querySelector(`[data-categoria="${cat}"]`);
                if (btn) btn.click();
            }, 600);
        });
    });

    crearLightbox();
    cargarInventario();
    cargarGaleriaClientas();
});