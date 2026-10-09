// =============================================
// vestido.js: página de cada vestido  (/vestido/?m=<slug>, o ?id=<id_articulo>)
// =============================================
import { buscarModelo, cargarModelos, prepararFoto, FAMILIAS, urlVestido } from './datos.js';
import { urlWhatsApp, mensajeVestido, linkPublico } from './whatsapp.js';
import { estaEnLista, alternarEnLista, actualizarTalla, mostrarAviso } from './mi-lista.js';
import { crearTarjeta } from './tarjeta.js';

const $ = sel => document.querySelector(sel);
const params = new URLSearchParams(location.search);
let modelo = null;
let tallaElegida = null;

function mostrarNoEncontrado() {
    $('[data-cargando]').hidden = true;
    $('[data-no-encontrado]').hidden = false;
    $('[data-migas-nombre]').textContent = 'No encontrado';
    document.title = 'Vestido no encontrado | Als Dress Reynosa';
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex';
    document.head.appendChild(robots);
}

function actualizarWhatsApp() {
    $('[data-preguntar]').href = urlWhatsApp(mensajeVestido({
        nombre: modelo.nombre,
        talla: tallaElegida,
        fecha: $('[data-fecha]').value,
        ruta: urlVestido(modelo),
    }));
}

function pintarGuardar() {
    const dentro = estaEnLista(modelo.slug);
    const b = $('[data-guardar]');
    b.setAttribute('aria-pressed', String(dentro));
    $('[data-guardar-texto]').textContent = dentro ? 'En Mi lista' : 'Añadir a Mi lista';
}

function pintarTallas() {
    const cont = $('[data-tallas]');
    // Si solo hay una talla disponible, queda elegida de una vez
    const disponibles = modelo.tallas.filter(t => t.disponible);
    if (!tallaElegida && disponibles.length === 1) tallaElegida = disponibles[0].talla;
    cont.replaceChildren(...modelo.tallas.map(t => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = t.disponible ? 'chip' : 'chip chip--agotada';
        b.textContent = t.talla;
        b.disabled = !t.disponible;
        b.setAttribute('aria-pressed', String(t.talla === tallaElegida));
        if (!t.disponible) b.setAttribute('aria-label', `${t.talla}, apartada`);
        b.addEventListener('click', () => {
            tallaElegida = tallaElegida === t.talla ? null : t.talla;
            pintarTallas();
            actualizarWhatsApp();
            if (tallaElegida) actualizarTalla(modelo.slug, tallaElegida);
        });
        return b;
    }));
    $('[data-tallas-ayuda]').hidden = modelo.tallas.every(t => t.disponible);
}

function pintarGaleria() {
    const principal = $('[data-foto-principal]');
    principal.alt = modelo.color ? `${modelo.nombre}, color ${modelo.color.toLowerCase()}` : modelo.nombre;
    prepararFoto(principal, modelo.fotos[0]);
    const mini = $('[data-miniaturas]');
    if (modelo.fotos.length < 2) return;
    mini.hidden = false;
    mini.replaceChildren(...modelo.fotos.map((url, i) => {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ficha__miniatura';
        b.setAttribute('aria-label', `Ver foto ${i + 1} de ${modelo.fotos.length}`);
        b.setAttribute('aria-pressed', String(i === 0));
        const img = document.createElement('img');
        img.alt = '';
        img.width = 120;
        img.height = 160;
        img.loading = 'lazy';
        prepararFoto(img, url);
        b.appendChild(img);
        b.addEventListener('click', () => {
            prepararFoto(principal, url);
            mini.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        });
        li.appendChild(b);
        return li;
    }));
}

async function compartir() {
    const url = linkPublico(urlVestido(modelo));
    const datos = { title: `${modelo.nombre} | Als Dress`, text: `Mira este vestido de Als Dress: ${modelo.nombre}`, url };
    try {
        if (navigator.share) { await navigator.share(datos); return; }
        await navigator.clipboard.writeText(url);
        mostrarAviso('Copiamos el link del vestido. Pégalo donde quieras compartirlo.');
    } catch (e) {
        if (e?.name !== 'AbortError') mostrarAviso('No se pudo compartir. Intenta de nuevo.');
    }
}

async function pintarRelacionados() {
    const todos = await cargarModelos();
    const misTallas = new Set(modelo.tallas.map(t => t.talla));
    const puntaje = m => (m.familia && m.familia === modelo.familia ? 2 : 0)
        + (m.tallas.some(t => t.disponible && misTallas.has(t.talla)) ? 2 : 0)
        + (m.hayDisponible ? 1 : 0);
    const otros = todos
        .filter(m => m.slug !== modelo.slug && m.tipo === modelo.tipo)
        .sort((a, b) => puntaje(b) - puntaje(a) || a.nombre.localeCompare(b.nombre, 'es'))
        .slice(0, 4);
    if (!otros.length) return;
    $('[data-relacionados-lista]').replaceChildren(...otros.map(m => crearTarjeta(m)));
    $('[data-relacionados]').hidden = false;
}

async function iniciar() {
    try {
        modelo = await buscarModelo({ m: params.get('m'), id: params.get('id') });
    } catch (err) {
        console.error('Error cargando vestido:', err);
    }
    if (!modelo) { mostrarNoEncontrado(); return; }

    const familia = FAMILIAS.find(f => f.id === modelo.familia);
    document.title = `${modelo.nombre} en renta | Als Dress Reynosa`;
    document.querySelector('meta[name="description"]').content =
        `${modelo.nombre}: vestido de fiesta en renta en Reynosa. Tallas ${modelo.tallas.map(t => t.talla).join(', ')}. Pregúntanos por WhatsApp.`;
    $('[data-canonical]').href = linkPublico(urlVestido(modelo));
    // Si llegó por ?id=, la URL se deja con el slug (más fácil de compartir)
    if (!params.get('m')) history.replaceState(null, '', urlVestido(modelo));

    $('[data-migas-nombre]').textContent = modelo.nombre;
    $('[data-nombre]').textContent = modelo.nombre;
    const estado = $('[data-estado]');
    estado.className = `badge ${modelo.hayDisponible ? 'badge--disponible' : 'badge--apartado'}`;
    estado.textContent = modelo.hayDisponible ? 'Disponible' : 'Apartado por ahora';
    let meta = modelo.tipo;
    if (modelo.color) meta += ` en color ${modelo.color.toLowerCase()}`;
    else if (familia) meta += ` en tono ${familia.nombre.toLowerCase()}`;
    $('[data-meta]').textContent = meta;

    // La fecha del evento no puede ser en el pasado
    const hoy = new Date();
    $('[data-fecha]').min = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    pintarGaleria();
    pintarTallas();
    pintarGuardar();
    actualizarWhatsApp();

    $('[data-fecha]').addEventListener('input', actualizarWhatsApp);
    $('[data-guardar]').addEventListener('click', () => alternarEnLista(modelo, tallaElegida));
    document.addEventListener('lista:cambio', pintarGuardar);
    $('[data-compartir]').addEventListener('click', compartir);

    $('[data-cargando]').hidden = true;
    $('[data-ficha]').hidden = false;
    pintarRelacionados();
}

iniciar();
