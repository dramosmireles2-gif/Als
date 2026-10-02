// =============================================
// carrusel.js: carruseles que avanzan solos
// Avanza un elemento cada `intervalo` ms. Se pausa cuando la clienta lo
// toca, lo arrastra, pasa el mouse o lo enfoca, y sigue unos segundos
// después. Tiene botón de Pausar (WCAG 2.2.2) y no se mueve si el
// teléfono pide "reducir movimiento".
// =============================================

const reducir = window.matchMedia('(prefers-reduced-motion: reduce)');

export function autoCarrusel(pista, { intervalo = 4000, reanudarEn = 6000 } = {}) {
    if (!pista || pista.dataset.auto === 'listo') return;
    pista.dataset.auto = 'listo';
    if (!pista.id) pista.id = `carrusel-${Math.random().toString(36).slice(2, 8)}`;

    let timer = null;
    let espera = null;
    let pausadoPorBoton = false;
    let interaccion = false;
    let visible = false;

    const hayDesborde = () => pista.scrollWidth - pista.clientWidth > 4;

    // Botón Pausar / Reanudar
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'carrusel-pausa';
    boton.setAttribute('aria-controls', pista.id);
    pista.insertAdjacentElement('afterend', boton);

    function pintarBoton() {
        boton.innerHTML = pausadoPorBoton
            ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>Reanudar'
            : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>Pausar';
        boton.hidden = reducir.matches || !hayDesborde();
    }

    function avanzar() {
        const item = pista.firstElementChild;
        if (!item) return;
        const gap = parseFloat(getComputedStyle(pista).columnGap) || 0;
        const paso = item.getBoundingClientRect().width + gap;
        const max = pista.scrollWidth - pista.clientWidth;
        if (pista.scrollLeft >= max - 4) pista.scrollTo({ left: 0, behavior: 'smooth' });
        else pista.scrollBy({ left: paso, behavior: 'smooth' });
    }

    function detener() {
        clearInterval(timer);
        timer = null;
    }

    function arrancar() {
        detener();
        if (reducir.matches || pausadoPorBoton || interaccion || !visible || document.hidden || !hayDesborde()) return;
        timer = setInterval(avanzar, intervalo);
    }

    function pausarPorInteraccion() {
        interaccion = true;
        clearTimeout(espera);
        detener();
    }

    function reanudarLuego() {
        clearTimeout(espera);
        espera = setTimeout(() => {
            interaccion = false;
            arrancar();
        }, reanudarEn);
    }

    boton.addEventListener('click', () => {
        pausadoPorBoton = !pausadoPorBoton;
        pintarBoton();
        arrancar();
    });

    pista.addEventListener('pointerdown', pausarPorInteraccion);
    pista.addEventListener('pointerup', reanudarLuego);
    pista.addEventListener('pointercancel', reanudarLuego);
    pista.addEventListener('wheel', () => { pausarPorInteraccion(); reanudarLuego(); }, { passive: true });
    pista.addEventListener('mouseenter', pausarPorInteraccion);
    pista.addEventListener('mouseleave', reanudarLuego);
    pista.addEventListener('focusin', pausarPorInteraccion);
    pista.addEventListener('focusout', reanudarLuego);

    // Solo se mueve mientras está en pantalla y la pestaña está activa
    new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        arrancar();
    }, { threshold: 0.3 }).observe(pista);
    document.addEventListener('visibilitychange', arrancar);
    reducir.addEventListener('change', () => { pintarBoton(); arrancar(); });
    window.addEventListener('resize', () => { pintarBoton(); arrancar(); }, { passive: true });

    pintarBoton();
}
