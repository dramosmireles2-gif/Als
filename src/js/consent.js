// =============================================
// consent.js: aviso de cookies (Consent Mode v2)
// El consentimiento inicial se define en el partial gtag.hbs. Aquí se
// muestra el aviso, se guarda la elección (6 meses) y se avisa a Google.
// =============================================
const CLAVE = 'als:cookies';
const VIGENCIA = 182 * 864e5; // ~6 meses

const aviso = document.querySelector('[data-cookies]');

function leer() {
    try {
        const g = JSON.parse(localStorage.getItem(CLAVE) || 'null');
        return g && Date.now() - g.fecha < VIGENCIA ? g.eleccion : null;
    } catch {
        return null;
    }
}

// Borra las cookies y datos de medición que ya se hubieran creado
function borrarMedicion() {
    const dominio = location.hostname.replace(/^www\./, '');
    for (const nombre of document.cookie.split(';').map(c => c.trim().split('=')[0])) {
        if (/^(_ga|_gcl)/.test(nombre)) {
            for (const d of ['', `; domain=${dominio}`, `; domain=.${dominio}`]) {
                document.cookie = `${nombre}=; Max-Age=0; path=/${d}`;
            }
        }
    }
    try { localStorage.removeItem('_gcl_ls'); } catch { /* sin almacenamiento */ }
}

function elegir(eleccion) {
    try { localStorage.setItem(CLAVE, JSON.stringify({ eleccion, fecha: Date.now() })); } catch { /* modo privado */ }
    const valor = eleccion === 'aceptadas' ? 'granted' : 'denied';
    if (typeof gtag === 'function') {
        gtag('consent', 'update', { ad_storage: valor, ad_user_data: valor, ad_personalization: valor, analytics_storage: valor });
    }
    if (eleccion === 'rechazadas') borrarMedicion();
    ocultar();
}

function mostrar({ enfocar = false } = {}) {
    if (!aviso) return;
    aviso.hidden = false;
    requestAnimationFrame(() => aviso.classList.add('aviso-cookies--visible'));
    if (enfocar) aviso.querySelector('[data-cookies-aceptar]')?.focus();
}

function ocultar() {
    if (!aviso) return;
    aviso.classList.remove('aviso-cookies--visible');
    aviso.hidden = true;
}

if (aviso) {
    aviso.querySelector('[data-cookies-aceptar]').addEventListener('click', () => elegir('aceptadas'));
    aviso.querySelector('[data-cookies-rechazar]').addEventListener('click', () => elegir('rechazadas'));
    // "Configurar cookies" (footer y política) vuelve a mostrar el aviso
    document.addEventListener('click', e => {
        if (e.target.closest('[data-configurar-cookies]')) {
            e.preventDefault();
            mostrar({ enfocar: true });
        }
    });
    if (!leer()) mostrar();
}
