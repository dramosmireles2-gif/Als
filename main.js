// ============================================
// ALS DRESS — main.js
// ============================================

// ---- CONFIGURACIÓN ----
const SHEET_URL  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTq9BmfWGt_CwpP-JSii1fx3BqkNvIvYpf_WJTxpDUR4xF_L6mKWjnF0W7OpoKZX9Q4smw74417ojPu/pub?gid=0&single=true&output=csv';
const APP_NAME   = 'RentaVestidosAPP-250346467';
const TABLE_NAME = 'Inventario';
const WA_NUMBER  = '528991947566';

// ---- ESTADO GLOBAL ----
let todosLosModelos = [];
let filtroActivo    = 'todos';
let tallaActiva     = null;

// ============================================
// 1. HEADER: scroll + menú hamburguesa
// ============================================
const header      = document.getElementById('header');
const menuToggle  = document.getElementById('menuToggle');
const mainNav     = document.getElementById('mainNav');

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
      // Pequeño delay escalonado para elementos del mismo contenedor
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ============================================
// 3. GALERÍA DE INTERIORES
// ============================================
const slides    = document.querySelectorAll('.foto-slide');
const dotsContainer = document.getElementById('galeriaDots');
let slideActual = 0;

// Crear dots
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

// Autoplay cada 4 segundos
setInterval(() => irASlide(slideActual + 1), 4000);

// ============================================
// 4. PARSER CSV (ROBUSTO)
// ============================================
function csvAJSON(csv) {
  const lineas = csv.split('\n').map(l => l.trim()).filter(Boolean);
  if (lineas.length < 2) return [];

  // Buscar la fila de headers (la que contiene "ID")
  let headerIdx = 0;
  for (let i = 0; i < lineas.length; i++) {
    if (lineas[i].toUpperCase().includes('ID')) { headerIdx = i; break; }
  }

  const splitFila = (str) => {
    const result = [];
    let current = '', inQuote = false;
    for (const char of str) {
      if (char === '"') { inQuote = !inQuote; }
      else if (char === ',' && !inQuote) { result.push(current.trim()); current = ''; }
      else current += char;
    }
    result.push(current.trim());
    return result.map(v => v.replace(/^"|"$/g, ''));
  };

  const headers = splitFila(lineas[headerIdx]);
  const result  = [];

  for (let i = headerIdx + 1; i < lineas.length; i++) {
    const valores = splitFila(lineas[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = valores[idx] || ''; });
    if (obj['Nombre']) result.push(obj);
  }
  return result;
}

// ============================================
// 5. CARGA E INVENTARIO
// ============================================
async function cargarInventario() {
  try {
    const resp  = await fetch(SHEET_URL + '&t=' + Date.now());
    const texto = await resp.text();
    let lista   = csvAJSON(texto);

    // Solo vestidos publicados
    lista = lista.filter(v => (v['Publicado'] || '').trim().toUpperCase() === 'SI');

    // Agrupar por nombre de modelo
    const modelos = {};
    lista.forEach(item => {
      const nombre = (item['Nombre'] || '').trim();
      if (!nombre) return;

      if (!modelos[nombre]) {
        modelos[nombre] = {
          ...item,
          tallasDisponibles: [item['Talla']].filter(Boolean),
          hayDisponible: (item['Estado_Actual'] || '').trim() === 'Disponible'
        };
      } else {
        if (item['Talla'] && !modelos[nombre].tallasDisponibles.includes(item['Talla'])) {
          modelos[nombre].tallasDisponibles.push(item['Talla']);
        }
        if ((item['Estado_Actual'] || '').trim() === 'Disponible') {
          modelos[nombre].hayDisponible = true;
        }
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
// 6. FILTROS
// ============================================
function construirFiltrosTallas() {
  const tallaSet = new Set();
  todosLosModelos.forEach(m => m.tallasDisponibles.forEach(t => tallaSet.add(t)));

  const ordenTallas = ['2XS','XS','S','M','L','XL','2XL','3XL'];
  const tallas = [...tallaSet].sort((a, b) => {
    const ia = ordenTallas.indexOf(a), ib = ordenTallas.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  const contenedor = document.getElementById('tallasFiltro');
  tallas.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'filtro-btn';
    btn.textContent = t;
    btn.dataset.talla = t;
    btn.addEventListener('click', () => toggleTalla(t, btn));
    contenedor.appendChild(btn);
  });
}

document.querySelectorAll('[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filtroActivo = btn.dataset.filter;
    renderizarCatalogo();
  });
});

function toggleTalla(talla, btn) {
  if (tallaActiva === talla) {
    tallaActiva = null;
    btn.classList.remove('active');
  } else {
    document.querySelectorAll('#tallasFiltro .filtro-btn').forEach(b => b.classList.remove('active'));
    tallaActiva = talla;
    btn.classList.add('active');
  }
  renderizarCatalogo();
}

// ============================================
// 7. RENDERIZADO
// ============================================
function renderizarCatalogo() {
  const contenedor = document.getElementById('productos-container');
  const msgVacio   = document.getElementById('mensaje-vacio');

  let lista = [...todosLosModelos];

  // Filtro disponibilidad
  if (filtroActivo === 'disponible') {
    lista = lista.filter(m => m.hayDisponible);
  }

  // Filtro talla
  if (tallaActiva) {
    lista = lista.filter(m => m.tallasDisponibles.includes(tallaActiva));
  }

  contenedor.innerHTML = '';

  if (lista.length === 0) {
    msgVacio.classList.remove('hidden');
    return;
  }

  msgVacio.classList.add('hidden');

  lista.forEach((vestido, i) => {
    // URL de la foto
    let urlFoto = 'https://placehold.co/400x500/f5f1eb/8a8a8e?text=Sin+Foto';
    const fotoRaw = (vestido['Foto'] || '').trim();
    if (fotoRaw) {
      if (fotoRaw.startsWith('http')) {
        urlFoto = fotoRaw;
      } else {
        urlFoto = `https://www.appsheet.com/template/gettablefileurl?appName=${encodeURIComponent(APP_NAME)}&tableName=${encodeURIComponent(TABLE_NAME)}&fileName=${encodeURIComponent(fotoRaw)}`;
      }
    }

    const disponible = vestido.hayDisponible;
    const tallas     = vestido.tallasDisponibles.sort().join(', ');
    const precio     = vestido['Precio_Base'] || vestido['Precio'] || '—';
    const nombre     = vestido['Nombre'];

    const textoWA = `Hola Als Dress! Vi en su catálogo el vestido "${nombre}". ¿Tienen disponibilidad en alguna talla?`;
    const urlWA   = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(textoWA)}`;

    const card = document.createElement('div');
    card.className = 'card-producto';
    card.style.animationDelay = `${i * 60}ms`;

    card.innerHTML = `
      <div class="card-img-wrapper">
        <img
          src="${urlFoto}"
          alt="${nombre}"
          loading="lazy"
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
          ? `<button class="btn-accion btn-disponible" onclick="window.open('${urlWA}', '_blank')">Consultar Disponibilidad</button>`
          : `<button class="btn-accion btn-agotado" disabled>Actualmente Rentado</button>`
        }
      </div>`;

    contenedor.appendChild(card);
  });
}

// ============================================
// 8. INIT
// ============================================
document.addEventListener('DOMContentLoaded', cargarInventario);
