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
setInterval(() => irASlide(slideActual + 1), 4000);

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
        const tallas     = vestido.tallasDisponibles.sort().join(', ');
        const precio     = vestido.precio_base || '—';
        const nombre     = vestido.nombre;

        const textoWA = `Hola Als Dress! Vi en su catálogo el vestido "${nombre}". ¿Tienen disponibilidad en alguna talla?`;
        const urlWA   = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(textoWA)}`;

        const card = document.createElement('div');
        card.className = 'card-producto';
        card.style.animationDelay = `${i * 60}ms`;
        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${urlFoto}" alt="${nombre}" loading="lazy"
                     onerror="this.onerror=null; this.src='https://placehold.co/400x500/f5f1eb/8a8a8e?text=Sin+Foto'">
                <span class="badge-estado ${disponible ? 'badge-disponible' : 'badge-agotado'}">
                    ${disponible ? '● Disponible' : 'Todo Rentado'}
                </span>
            </div>
            <div class="card-info">
                <h3 class="card-nombre">${nombre}</h3>
                <div class="card-detalles">
                    <span class="card-precio">$${precio}</span>
                    <span class="card-tallas">Talla: ${tallas}</span>
                </div>
                ${disponible
                    ? `<button class="btn-accion btn-disponible" onclick="window.open('${urlWA}','_blank')">Consultar Disponibilidad</button>`
                    : `<button class="btn-accion btn-agotado" disabled>Actualmente Rentado</button>`
                }
            </div>`;

        card.querySelector('.card-img-wrapper').addEventListener('click', () => abrirLightbox(vestido, urlFoto));
        card.querySelector('.card-nombre').addEventListener('click', () => abrirLightbox(vestido, urlFoto));
        card.style.cursor = 'pointer';
        contenedor.appendChild(card);
    });
}

// ============================================
// 7. LIGHTBOX
// ============================================
function crearLightbox() {
    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.innerHTML = `
        <button class="lightbox-cerrar" id="lightboxCerrar">✕</button>
        <div class="lightbox-inner">
            <div class="lightbox-img-wrap">
                <img id="lightbox-img" src="" alt="">
            </div>
            <div class="lightbox-info">
                <h2 class="lightbox-nombre" id="lightbox-nombre"></h2>
                <p class="lightbox-precio"  id="lightbox-precio"></p>
                <div class="lightbox-tallas">
                    <span>Tallas disponibles</span>
                    <div class="lightbox-tallas-chips" id="lightbox-tallas"></div>
                </div>
                <span class="lightbox-badge" id="lightbox-badge"></span>
                <button class="lightbox-btn-wa" id="lightbox-btn-wa"></button>
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
    document.getElementById('lightbox-nombre').textContent   = vestido.nombre;
    document.getElementById('lightbox-precio').textContent   = '$' + (vestido.precio_base || '—');

    const chipsEl = document.getElementById('lightbox-tallas');
    chipsEl.innerHTML = vestido.tallasDisponibles.sort()
        .map(t => `<span class="talla-chip">${t}</span>`).join('');

    const badge = document.getElementById('lightbox-badge');
    badge.textContent = disponible ? '● Disponible' : 'Actualmente Rentado';
    badge.className   = `lightbox-badge ${disponible ? 'disponible' : 'agotado'}`;

    const btnWa = document.getElementById('lightbox-btn-wa');
    if (disponible) {
        const textoWA = `Hola Als Dress! Vi en su catálogo el vestido "${vestido.nombre}". ¿Tienen disponibilidad en alguna talla?`;
        btnWa.onclick = () => window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(textoWA)}`, '_blank');
        btnWa.innerHTML = '💬 Consultar por WhatsApp';
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
        .order('created_at', { ascending: false })
        .limit(12);

    if (error || !data || data.length === 0) {
        document.getElementById('sec-galeria-clientas').classList.add('hidden');
        return;
    }

    document.getElementById('sec-galeria-clientas').classList.remove('hidden');
    contenedor.innerHTML = '';
    data.forEach(foto => {
        const div = document.createElement('div');
        div.className = 'galeria-cliente-item';
        div.style.cursor = 'pointer';
        div.innerHTML = `
            <img src="${foto.foto_url}" alt="${foto.nombre || 'Clienta Als Dress'}" loading="lazy"
                 onerror="this.parentElement.style.display='none'">
            ${foto.nombre ? `<div class="galeria-overlay"><p>${foto.nombre}</p></div>` : ''}`;
        div.onclick = () => abrirLightboxClientas(foto.foto_url, foto.nombre);
        contenedor.appendChild(div);
    });
}

// ============================================
// 8B. LIGHTBOX CLIENTAS
// ============================================
function abrirLightboxClientas(url, nombre) {
    const lb     = document.getElementById('lightbox');
    const msgWA  = `Hola Als Dress! Vi las fotos de sus clientas y me encantó. ¿Me pueden ayudar a encontrar mi vestido ideal?`;
    const urlWA  = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msgWA)}`;

    document.getElementById('lightbox-img').src  = url;
    document.getElementById('lightbox-img').alt  = nombre || 'Clienta Als Dress';

    // Nombre
    document.getElementById('lightbox-nombre').textContent = nombre || 'Als Dress';

    // Subtítulo en lugar del precio
    document.getElementById('lightbox-precio').innerHTML =
        '<span style="font-size:0.95rem; color:#555; font-family:var(--font-body); font-style:italic;">✨ Lució increíble en su evento</span>';

    // Chip de marca en lugar de tallas
    document.getElementById('lightbox-tallas').innerHTML =
        '<span class="talla-chip" style="background:#fce4ec; color:#a0255f;">Als Dress · Reynosa</span>';

    // Sin badge de estado
    document.getElementById('lightbox-badge').textContent = '';
    document.getElementById('lightbox-badge').className   = 'lightbox-badge';

    // Botón WhatsApp activo
    const btnWa = document.getElementById('lightbox-btn-wa');
    btnWa.innerHTML  = '💬 ¡Quiero lucir así también!';
    btnWa.className  = 'lightbox-btn-wa';
    btnWa.onclick    = () => window.open(urlWA, '_blank');

    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
}

// ============================================
// 9. INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    crearLightbox();
    cargarInventario();
    cargarGaleriaClientas();
});