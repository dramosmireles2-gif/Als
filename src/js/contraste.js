// =============================================
// contraste.js: auditoría de contraste WCAG AA
// Revisa cada elemento con texto propio contra su fondo real.
// Uso: auditarContraste(document.body) → { revisados, sinVerificar, fallas }
// =============================================

function parseColor(str) {
    const dentro = str.slice(str.indexOf('(') + 1, str.lastIndexOf(')'));
    const partes = dentro.split(/[ ,/]+/).filter(Boolean).map(parseFloat);
    return { r: partes[0], g: partes[1], b: partes[2], a: partes.length > 3 ? partes[3] : 1 };
}

function mezclar(arriba, abajo) {
    const a = arriba.a;
    return {
        r: arriba.r * a + abajo.r * (1 - a),
        g: arriba.g * a + abajo.g * (1 - a),
        b: arriba.b * a + abajo.b * (1 - a),
        a: 1,
    };
}

function luminancia({ r, g, b }) {
    const c = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function ratio(c1, c2) {
    const l1 = luminancia(c1), l2 = luminancia(c2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function ratioHex(h1, h2) {
    const hex = h => ({ r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16), a: 1 });
    return ratio(hex(h1), hex(h2));
}

// Devuelve el fondo efectivo, o null si hay imagen/degradado (no se puede verificar)
function fondoEfectivo(el) {
    const capas = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
        const bg = parseColor(cs.backgroundColor);
        if (bg.a > 0) {
            capas.push(bg);
            if (bg.a >= 1) break;
        }
    }
    let fondo = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = capas.length - 1; i >= 0; i--) fondo = mezclar(capas[i], fondo);
    return fondo;
}

function tieneTextoPropio(el) {
    for (const n of el.childNodes) {
        if (n.nodeType === 3 && n.textContent.trim()) return true;
    }
    return false;
}

function visible(el) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
        if (parseFloat(getComputedStyle(n).opacity) === 0) return false;
    }
    return true;
}

function describir(el) {
    const clase = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/ +/).join('.') : '';
    return el.tagName.toLowerCase() + clase;
}

export function auditarContraste(raiz = document.body) {
    const fallas = [];
    let revisados = 0, sinVerificar = 0;
    for (const el of raiz.querySelectorAll('*')) {
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'OPTION'].includes(el.tagName)) continue;
        if (!tieneTextoPropio(el) || !visible(el)) continue;
        if (el.closest('[aria-hidden="true"], .sr-only')) continue;
        const cs = getComputedStyle(el);
        const fondo = fondoEfectivo(el);
        if (!fondo) { sinVerificar++; continue; }
        const texto = mezclar(parseColor(cs.color), fondo);
        const size = parseFloat(cs.fontSize);
        const peso = parseInt(cs.fontWeight, 10);
        const grande = size >= 24 || (size >= 18.66 && peso >= 700);
        const minimo = grande ? 3 : 4.5;
        const r = ratio(texto, fondo);
        revisados++;
        if (r < minimo) {
            fallas.push({
                elemento: describir(el),
                texto: el.textContent.trim().slice(0, 40),
                ratio: Math.round(r * 100) / 100,
                minimo,
                color: cs.color,
            });
        }
    }
    return { revisados, sinVerificar, fallas };
}
