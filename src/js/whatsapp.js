// =============================================
// whatsapp.js: mensajes prellenados para WhatsApp
// La conversión de Google Ads se registra en main.js para cualquier
// link a wa.me (incluidos los que se crean aquí).
// =============================================
export const WA_NUMERO = '528991947566';

export const urlWhatsApp = texto => `https://wa.me/${WA_NUMERO}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;

const SITIO = 'https://alsdress.com.mx';
export const linkPublico = ruta => SITIO + ruta;

// "15 de noviembre" a partir de "2026-11-15"
export function fechaLegible(iso) {
    if (!iso) return '';
    const [a, m, d] = iso.split('-').map(Number);
    const f = new Date(a, m - 1, d);
    return f.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
}

// Urgencia honesta: el evento es en menos de 7 días
export function esUrgente(iso) {
    if (!iso) return false;
    const [a, m, d] = iso.split('-').map(Number);
    const evento = new Date(a, m - 1, d);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const dias = (evento - hoy) / 86400000;
    return dias >= 0 && dias < 7;
}

export function mensajeVestido({ nombre, talla, fecha, ruta }) {
    let t = `Hola, me interesa el vestido "${nombre}"`;
    if (talla) t += ` en talla ${talla}`;
    t += '.';
    if (fecha) t += ` Mi evento es el ${fechaLegible(fecha)}${esUrgente(fecha) ? ' (es urgente)' : ''}.`;
    t += ' ¿Está disponible?';
    if (ruta) t += `\n${linkPublico(ruta)}`;
    return t;
}

export function mensajeLista(items) {
    const n = items.length;
    let t = `Hola, quiero probarme ${n === 1 ? 'este vestido' : `estos ${n} vestidos`}:\n`;
    items.forEach((it, i) => {
        t += `\n${i + 1}. ${it.nombre}${it.talla ? ` (talla ${it.talla})` : ''}\n${linkPublico(it.ruta)}`;
    });
    t += '\n\n¿Me ayudan a revisar si están disponibles?';
    return t;
}

export function mensajeAvisame(talla) {
    return talla
        ? `Hola, ¿me avisan cuando lleguen vestidos nuevos en talla ${talla}?`
        : 'Hola, ¿me avisan cuando lleguen vestidos nuevos?';
}
