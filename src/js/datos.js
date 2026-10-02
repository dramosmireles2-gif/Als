// =============================================
// datos.js: lectura del catálogo (la web SOLO lee)
// Agrupa las filas de `inventario` por modelo (un modelo con varias tallas
// = varias filas), calcula el slug para los links y la familia de color.
// =============================================

// Supabase se descarga solo cuando hace falta
export const obtenerSb = () => import('./supabase.js').then(m => m.sb);

// ---- Fotos: AppSheet (viejas), Google Drive o Supabase Storage (nuevas) ----
const APP_NAME = 'RentaVestidosAPP-250346467';
const TABLE_NAME = 'Inventario';
export const FOTO_VACIA = 'https://placehold.co/600x800/f2ddd1/5b5160?text=Sin+foto';

export function obtenerUrlFoto(foto) {
    if (!foto) return FOTO_VACIA;
    if (foto.startsWith('http')) return foto;
    return `https://www.appsheet.com/template/gettablefileurl?appName=${encodeURIComponent(APP_NAME)}&tableName=${encodeURIComponent(TABLE_NAME)}&fileName=${encodeURIComponent(foto)}`;
}

// Prepara una <img> de producto: sin "referer" (Google Drive bloquea fotos
// enlazadas desde otros sitios), un reintento y luego la imagen "Sin foto".
export function prepararFoto(img, url) {
    img.referrerPolicy = 'no-referrer';
    img.decoding = 'async';
    let reintentos = 0;
    img.addEventListener('error', function alFallar() {
        if (reintentos === 0 && url !== FOTO_VACIA) {
            reintentos++;
            setTimeout(() => { img.src = url + (url.includes('?') ? '&' : '?') + 'r=1'; }, 1200);
        } else {
            img.removeEventListener('error', alFallar);
            img.src = FOTO_VACIA;
        }
    });
    img.src = url;
}

// ---- Tallas ----
const ORDEN_TALLAS = ['XXS', '2XS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'];
export function ordenarTallas(tallas) {
    return [...tallas].sort((a, b) => {
        const ia = ORDEN_TALLAS.indexOf(a), ib = ORDEN_TALLAS.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return String(a).localeCompare(String(b), 'es', { numeric: true });
    });
}

// ---- Texto ----
export const sinAcentos = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export const slug = t => sinAcentos(t).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ---- Familias de color ----
// En el admin los colores vienen en inglés y español ("Green", "Verde Esmeralda"…).
// Se agrupan por familia; si la fila no tiene color, se intenta deducir del nombre.
export const FAMILIAS = [
    { id: 'negro',    nombre: 'Negro',          muestra: '#1A141C', claves: ['negro', 'black'] },
    { id: 'rojo',     nombre: 'Rojo y vino',    muestra: '#8E1F2E', claves: ['rojo', 'red', 'vino', 'burdeos', 'guinda', 'tinto', 'wine'] },
    { id: 'rosa',     nombre: 'Rosa',           muestra: '#E9B7C4', claves: ['rosa', 'pink', 'fucsia', 'fuchsia', 'coral'] },
    { id: 'morado',   nombre: 'Morado y lila',  muestra: '#7A4E9A', claves: ['morado', 'purple', 'lila', 'lavanda', 'violeta', 'uva'] },
    { id: 'azul',     nombre: 'Azul',           muestra: '#2F4A7A', claves: ['azul', 'blue', 'marino', 'navy', 'rey', 'cielo', 'turquesa', 'aqua', 'agua', 'neblina'] },
    { id: 'verde',    nombre: 'Verde',          muestra: '#2F6B4F', claves: ['verde', 'green', 'esmeralda', 'olivo', 'jade', 'menta', 'salvia'] },
    { id: 'dorado',   nombre: 'Dorado y nude',  muestra: '#C9A574', claves: ['dorado', 'oro', 'gold', 'champagne', 'champan', 'camel', 'nude', 'beige', 'arena'] },
    { id: 'plata',    nombre: 'Plata y gris',   muestra: '#BFC2C7', claves: ['plata', 'silver', 'gris', 'gray', 'grey'] },
    { id: 'blanco',   nombre: 'Blanco y marfil', muestra: '#F4F0E8', claves: ['blanco', 'white', 'marfil', 'ivory', 'crema'] },
    { id: 'naranja',  nombre: 'Naranja y amarillo', muestra: '#E08A3C', claves: ['naranja', 'orange', 'amarillo', 'yellow', 'mostaza'] },
];

export function familiaDe(color, nombre) {
    const buscar = texto => {
        const t = ' ' + sinAcentos(texto).replace(/[^a-z]+/g, ' ') + ' ';
        // "oro rosa" cuenta como dorado: se revisa la primera palabra que coincida
        let mejor = null, pos = Infinity;
        for (const f of FAMILIAS) for (const c of f.claves) {
            const i = t.indexOf(' ' + c + ' ');
            if (i !== -1 && i < pos) { pos = i; mejor = f.id; }
        }
        return mejor;
    };
    return buscar(color) || buscar(nombre);
}

// ---- Carga y agrupación por modelo ----
function agrupar(filas) {
    const modelos = new Map();
    for (const fila of filas) {
        const nombre = (fila.nombre || '').trim();
        if (!nombre) continue;
        let m = modelos.get(nombre);
        if (!m) {
            m = {
                nombre,
                slug: slug(nombre),
                tipo: fila.tipo || 'Vestido',
                color: (fila.color || '').trim(),
                fotos: [],
                tallas: [],
                ids: [],
                destacado: false,
                ocasion: [],
            };
            modelos.set(nombre, m);
        }
        if (!m.color && fila.color) m.color = fila.color.trim();
        // Cada talla trae su propia copia de la foto principal: se usa solo una.
        // Las fotos extra (foto2, foto3) sí se suman.
        if (!m.fotos.length && fila.foto) m.fotos.push(obtenerUrlFoto(fila.foto));
        for (const f of [fila.foto2, fila.foto3]) {
            const url = f ? obtenerUrlFoto(f) : null;
            if (url && !m.fotos.includes(url)) m.fotos.push(url);
        }
        const disponible = fila.estado_actual === 'Disponible';
        const existente = m.tallas.find(t => t.talla === fila.talla);
        if (existente) existente.disponible = existente.disponible || disponible;
        else if (fila.talla) m.tallas.push({ talla: fila.talla, disponible, id: fila.id_articulo });
        m.ids.push(fila.id_articulo);
        if (fila.destacado) m.destacado = true;
        if (Array.isArray(fila.ocasion)) for (const o of fila.ocasion) if (!m.ocasion.includes(o)) m.ocasion.push(o);
    }
    return [...modelos.values()].map(m => {
        const orden = ordenarTallas(m.tallas.map(t => t.talla));
        m.tallas.sort((a, b) => orden.indexOf(a.talla) - orden.indexOf(b.talla));
        m.hayDisponible = m.tallas.some(t => t.disponible);
        m.familia = familiaDe(m.color, m.nombre);
        if (!m.fotos.length) m.fotos.push(FOTO_VACIA);
        return m;
    });
}

let cache = null;
// Todos los modelos publicados (una sola consulta por página)
export function cargarModelos() {
    if (!cache) {
        cache = obtenerSb()
            .then(sb => sb.from('inventario').select('*').eq('publicado', true).order('nombre'))
            .then(({ data, error }) => {
                if (error) throw error;
                return agrupar(data || []);
            })
            .catch(err => { cache = null; throw err; });
    }
    return cache;
}

// Busca un modelo por slug (?m=) o por id_articulo (?id=) como respaldo
export async function buscarModelo({ m, id }) {
    const modelos = await cargarModelos();
    return modelos.find(x => (m && x.slug === m) || (id && x.ids.includes(id))) || null;
}

export const urlVestido = modelo => `/vestido/?m=${encodeURIComponent(modelo.slug)}`;
