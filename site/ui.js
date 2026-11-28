// Utilidades compartidas por las páginas con el sistema visual nuevo.
import { courses, englishCourses, footerColumns, contactInfo, findCourse, teachersForCourse, pageHref, pageUrl, findSchool as findSchoolEntry } from './data.js';
const findSchoolId = (id) => findSchoolEntry(id)?.id;

export const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'es');
export const t = (pair) => (Array.isArray(pair) ? pair[lang() === 'en' ? 1 : 0] : pair);
export const tr = (es, en) => (lang() === 'en' ? en : es);
// Dirección limpia de un curso, escuela o ruta en el idioma actual.
export const link = (kind, id) => pageHref(kind, id, lang());
const kinds = { curso: 'course', escuela: 'school', ruta: 'path' };
// Pasa ./curso-x.html, ./escuela-x.html o ./ruta-x.html a la versión del idioma actual.
export const localHref = (href) => href.replace(/^\.\/(curso|escuela|ruta)-([a-z0-9-]+)\.html/,(_, kind, id) => link(kinds[kind], id));
export const $ = (id) => document.getElementById(id);
export const params = new URLSearchParams(location.search);
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const escapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => escapes[char]);

export function courseText(course) {
    const [title, description, lessons] = englishCourses[course.id];
    return lang() === 'en' ? { title, description, lessons } : course;
}

export const levelText = (level) => (!level ? tr('Nivel por definir', 'Level to be defined') : level === 'Inicial' ? tr('Inicial', 'Beginner') : tr('Intermedio', 'Intermediate'));

export function price(amount, { from = false } = {}) {
    if (amount === null || amount === undefined) return tr('Por confirmar', 'To be confirmed');
    if (amount === 0) return tr('Gratis', 'Free');
    const formatted = new Intl.NumberFormat(tr('es-CR', 'en-US'), { style: 'currency', currency: 'USD', currencyDisplay: 'code', maximumFractionDigits: 0 }).format(amount);
    return from ? `${tr('Desde', 'From')} ${formatted}` : formatted;
}

// Duraciones reales leídas de los metadatos de cada video (no se escriben a mano).
const durationCache = new Map();
export function videoDuration(src) {
    if (!durationCache.has(src)) {
        durationCache.set(src, new Promise((resolve) => {
            const probe = document.createElement('video');
            probe.preload = 'metadata';
            probe.muted = true;
            probe.addEventListener('loadedmetadata', () => resolve(probe.duration), { once: true });
            probe.addEventListener('error', () => resolve(null), { once: true });
            probe.src = src;
        }));
    }
    return durationCache.get(src);
}
export const lessonVideo = (course, index) => `./media/${course.id}-${index + 1}.mp4`;
export function formatDuration(seconds) {
    if (!Number.isFinite(seconds)) return '';
    const total = Math.round(seconds);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
export function fillDurations(root = document) {
    for (const node of root.querySelectorAll('[data-duration-src]')) {
        videoDuration(node.dataset.durationSrc).then((seconds) => {
            const text = formatDuration(seconds);
            if (text) node.textContent = text;
        });
    }
}

// Anillo de progreso en SVG (trazo sólido, sin degradados).
export function ring(percent, size = 64) {
    const radius = 26;
    const length = 2 * Math.PI * radius;
    return `<svg class="progress-ring" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="${percent}% ${tr('completado', 'complete')}">
        <circle cx="32" cy="32" r="${radius}" fill="none" stroke-width="7" class="ring-track"/>
        <circle cx="32" cy="32" r="${radius}" fill="none" stroke-width="7" class="ring-value" stroke-linecap="round"
            stroke-dasharray="${length.toFixed(2)}" stroke-dashoffset="${(length * (1 - percent / 100)).toFixed(2)}" transform="rotate(-90 32 32)"/>
        <text x="32" y="36.5" text-anchor="middle">${percent}%</text>
    </svg>`;
}

export function readProgress() {
    try {
        const stored = JSON.parse(localStorage.getItem('solara-demo-progress'));
        return new Set(Array.isArray(stored) ? stored : []);
    } catch {
        return new Set();
    }
}

export const teacherName = (courseId) => {
    const [teacher] = teachersForCourse(courseId);
    return teacher ? t(teacher.name) : tr('Equipo Solara', 'Solara team');
};

// Ilustraciones propias para cada escuela (formas geométricas simples).
const shapes = {
    compass: '<circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" stroke-width="8"/><path d="M60 22 72 60 60 98 48 60Z" fill="currentColor"/><circle cx="60" cy="60" r="7" fill="#F3F5ED"/>',
    leaf: '<path d="M18 102C18 50 52 18 104 18c0 52-32 86-86 84Z" fill="currentColor"/><path d="M26 94 88 32" stroke="#F3F5ED" stroke-width="6" stroke-linecap="round"/>',
    mountain: '<path d="M6 104 44 36l22 34 14-20 34 54Z" fill="currentColor"/><path d="M44 36 54 54 44 50 34 54Z" fill="#F3F5ED"/><circle cx="92" cy="26" r="12" fill="currentColor"/>',
    sun: '<circle cx="60" cy="60" r="26" fill="currentColor"/><g stroke="currentColor" stroke-width="8" stroke-linecap="round"><path d="M60 8v14M60 98v14M8 60h14M98 60h14M23 23l10 10M87 87l10 10M97 23 87 33M33 87 23 97"/></g>',
    people: '<circle cx="38" cy="38" r="16" fill="currentColor"/><circle cx="82" cy="38" r="16" fill="currentColor"/><path d="M8 104c0-24 14-40 30-40s30 16 30 40ZM52 104c0-24 14-40 30-40s30 16 30 40Z" fill="currentColor"/>',
    tent: '<path d="M60 14 8 104h104Z" fill="currentColor"/><path d="M60 50 38 104h44Z" fill="#F3F5ED"/><path d="M60 14V4" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>'
};
export const shapeSvg = (name) => `<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">${shapes[name] ?? shapes.compass}</svg>`;
export const icons = {
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4v16l14-8Z" fill="currentColor"/></svg>'
};

export function courseCardUI(course, { pathId } = {}) {
    const { title } = courseText(course);
    const lessons = course.lessons.length;
    const href = `${link('course', course.id)}${pathId ? `?ruta=${pathId}` : ''}`;
    return `<a class="course-card-ui" href="${href}">
        <figure><img src="./media/${course.image}.jpg" alt="" loading="lazy" width="560" height="315">
            <span class="status ${course.sample ? 'is-sample' : ''}">${course.sample ? tr('Clases de muestra', 'Sample lessons') : tr('En preparación', 'In preparation')}</span></figure>
        <div class="course-card-body">
            <h3>${esc(title)}</h3>
            <ul class="course-meta"><li>${levelText(course.level)}</li><li>${lessons} ${lessons === 1 ? tr('clase', 'lesson') : tr('clases', 'lessons')}</li><li>${esc(price(course.price))}</li></ul>
            <p class="teacher">${esc(teacherName(course.id))}</p>
        </div>
    </a>`;
}

// Carrusel horizontal: botones, arrastre con ratón, teclado y límites.
export function setupCarousel(track, prev, next) {
    if (!track || track.dataset.carousel) return;
    track.dataset.carousel = 'true';
    const step = () => {
        const item = track.firstElementChild;
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        return item ? item.getBoundingClientRect().width + gap : track.clientWidth * .8;
    };
    const update = () => {
        const end = track.scrollWidth - track.clientWidth;
        if (prev) prev.disabled = track.scrollLeft <= 2;
        if (next) next.disabled = track.scrollLeft >= end - 2;
    };
    const move = (direction) => track.scrollBy({ left: direction * step(), behavior: reducedMotion() ? 'auto' : 'smooth' });
    prev?.addEventListener('click', () => move(-1));
    next?.addEventListener('click', () => move(1));
    track.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    track.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    });
    let start = null;
    track.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'mouse' || event.button !== 0) return;
        start = { x: event.clientX, left: track.scrollLeft, moved: false };
    });
    addEventListener('pointermove', (event) => {
        if (!start) return;
        const delta = event.clientX - start.x;
        if (Math.abs(delta) > 4) {
            start.moved = true;
            track.classList.add('is-dragging');
            track.scrollLeft = start.left - delta;
        }
    });
    addEventListener('pointerup', () => {
        if (!start) return;
        const moved = start.moved;
        start = null;
        track.classList.remove('is-dragging');
        if (moved) {
            const width = step();
            track.scrollTo({ left: Math.round(track.scrollLeft / width) * width, behavior: reducedMotion() ? 'auto' : 'smooth' });
            track.addEventListener('click', (event) => event.preventDefault(), { capture: true, once: true });
        }
    });
    update();
    return update;
}

export function setupReveal(root = document) {
    const items = root.querySelectorAll('.reveal:not(.is-visible)');
    if (!('IntersectionObserver' in window) || reducedMotion()) {
        items.forEach((item) => item.classList.add('is-visible'));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        }
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach((item) => observer.observe(item));
}

// Bloque de contacto del pie (todas las páginas). Los datos vienen de `contactInfo` (data.js).
function contactBlock() {
    const pending = `<span class="footer-pending">${tr('Por confirmar', 'To be confirmed')}</span>`;
    const digits = (value) => String(value).replace(/[^d+]/g, '');
    const rows = [
        [tr('Correo', 'Email'), contactInfo.email ? `<a href="mailto:${esc(contactInfo.email)}">${esc(contactInfo.email)}</a>` : pending],
        [tr('Teléfono', 'Phone'), contactInfo.phone ? `<a href="tel:${esc(digits(contactInfo.phone))}">${esc(contactInfo.phone)}</a>` : pending],
        ['WhatsApp', contactInfo.whatsapp ? `<a href="https://wa.me/${esc(digits(contactInfo.whatsapp).replace('+', ''))}" rel="noopener" target="_blank">${esc(contactInfo.whatsapp)}</a>` : pending],
        [tr('Ubicación', 'Location'), esc(t(contactInfo.location))],
        ...(contactInfo.hours ? [[tr('Horario', 'Hours'), esc(t(contactInfo.hours))]] : [])
    ];
    return `<section class="footer-contact" aria-labelledby="footer-contact-title">
        <h3 id="footer-contact-title">${tr('Contacto', 'Contact')}</h3>
        <dl>${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>
        <button class="footer-write" type="button" data-open-help>${tr('Escríbenos un mensaje', 'Send us a message')}</button>
    </section>`;
}
document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-open-help]')) return;
    const bubble = document.querySelector('.help-bubble');
    if (bubble && bubble.getAttribute('aria-expanded') !== 'true') bubble.click();
});

export function renderFooter() {
    for (const slot of document.querySelectorAll('[data-contact-slot]')) slot.innerHTML = contactBlock();
    const footer = $('site-footer');
    if (!footer) return;
    const year = new Date().getFullYear();
    footer.innerHTML = `<div class="container footer-grid">
        <div class="footer-brand">
            <a class="site-brand" href="./"><span class="brand-mark" aria-hidden="true">✳</span><span>Solara<small>FIELD SCHOOL</small></span></a>
            <p>${tr('Educación al aire libre y cursos en video.', 'Outdoor learning and video courses.')}</p>
        </div>
        ${footerColumns.map((column) => `<section class="footer-column ${column.wide ? 'is-wide' : ''}">
            <h3>${esc(t(column.title))}</h3>
            <ul>${column.links.map(([label, href]) => `<li><a href="${localHref(href)}">${esc(t(label))}</a></li>`).join('')}</ul>
        </section>`).join('')}
    </div>
    <div class="container">${contactBlock()}</div>
    <div class="container footer-legal">
        <span>© ${year} Solara Field School</span>
        <span>${tr('Catálogo, precios y compras de demostración. No se realiza ningún cobro.', 'Demo catalog, prices and checkout. No payment is collected.')}</span>
    </div>`;
}

export function markCurrentPage() {
    const page = location.pathname.split('/').pop() || 'index.html';
    for (const link of document.querySelectorAll('#main-navigation a')) {
        const target = link.getAttribute('href').replace('./', '').split('#')[0] || 'index.html';
        if (target === page && !link.getAttribute('href').includes('#')) link.setAttribute('aria-current', 'page');
    }
}

// Ejecuta `render` ahora y cada vez que cambie el idioma (evento de app.js).
export function onLanguage(render) {
    render();
    document.addEventListener('solara:language', () => render());
}

export function setTitle(text) {
    document.title = `${text} | Solara Field School`;
}

// Textos con marcado (por ejemplo <em>): data-en-html guarda la versión inglesa.
const htmlTranslations = [...document.querySelectorAll('[data-en-html]')].map((element) => ({ element, es: element.innerHTML, en: element.dataset.enHtml }));
const renderHtmlTranslations = () => htmlTranslations.forEach(({ element, es, en }) => { element.innerHTML = tr(es, en); });

// Menú móvil: foco dentro del panel al abrir, cierre con Escape desde cualquier punto y por el fondo.
function setupMobileMenu() {
    const toggle = $('navigation-toggle');
    const nav = $('main-navigation');
    if (!toggle || !nav) return;
    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
    const close = () => {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
    };
    toggle.addEventListener('click', () => requestAnimationFrame(() => {
        if (isOpen()) nav.querySelector('a')?.focus();
    }));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isOpen()) close();
        if (event.key === 'Tab' && isOpen() && getComputedStyle(nav).position === 'fixed') {
            const items = [...nav.querySelectorAll('a, button')];
            const first = items[0];
            const last = items.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    });
    document.addEventListener('click', (event) => {
        if (isOpen() && !nav.contains(event.target) && !toggle.contains(event.target)) close();
    });
}

// Sesión de DEMOSTRACIÓN guardada en este navegador. No hay contraseñas ni servidor.
const sessionKey = 'solara-demo-session';
export function getSession() {
    try {
        const stored = JSON.parse(localStorage.getItem(sessionKey));
        return stored?.account === 'demo' ? stored : null;
    } catch {
        return null;
    }
}
export function startDemoSession() {
    try { localStorage.setItem(sessionKey, JSON.stringify({ account: 'demo', since: new Date().toISOString() })); } catch { /* sin almacenamiento */ }
}
export function endSession() {
    try { localStorage.removeItem(sessionKey); } catch { /* sin almacenamiento */ }
}

const personIcon = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

// Botón de acceso arriba a la derecha, en el encabezado nuevo y en el anterior.
function renderAccountLink() {
    const cartButton = $('open-cart');
    if (!cartButton) return;
    let link = $('account-link');
    if (!link) {
        link = document.createElement('a');
        link.id = 'account-link';
        link.className = cartButton.classList.contains('btn') ? 'btn btn-outline btn-small account-link' : 'button outline account-link';
        cartButton.before(link);
    }
    const session = getSession();
    const label = session ? tr('Mi campus', 'My campus') : tr('Iniciar sesión', 'Sign in');
    link.href = session ? './campus.html' : './login.html';
    link.innerHTML = `${personIcon}<span class="account-label">${label}</span>`;
    link.setAttribute('aria-label', label);
    if (/(mi-cuenta|login)\.html$/.test(location.pathname)) link.setAttribute('aria-current', 'page');
}

// Páginas informativas: conservan su propio título (app.js pone el de la portada al cambiar el idioma).
const titleEn = document.body.dataset.titleEn;
const titleEs = document.title.replace(' | Solara Field School', '');
if (titleEn && document.body.classList.contains('info-page')) onLanguage(() => setTitle(tr(titleEs, titleEn)));

// Direcciones antiguas con parámetros (curso.html?curso=, escuelas.html?area=, ruta.html?ruta=):
// la canónica apunta a la página estática equivalente.
function canonicalForParams() {
    const pairs = [['curso', 'course'], ['area', 'school'], ['ruta', 'path']];
    const page = location.pathname.split('/').pop();
    const [param, kind] = pairs.find(([key]) => params.has(key) && page.startsWith({ curso: 'curso.html', area: 'escuelas', ruta: 'ruta.html' }[key])) ?? [];
    if (!param) return;
    let id = params.get(param);
    if (kind === 'school') id = findSchoolId(id);
    if (!id) return;
    const canonical = document.querySelector('link[rel="canonical"]') ?? document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'canonical' }));
    canonical.href = pageUrl(kind, id, 'es');
}
try { canonicalForParams(); } catch { /* identificador desconocido */ }

onLanguage(renderFooter);
onLanguage(renderAccountLink);
addEventListener('storage', ({ key }) => { if (key === sessionKey) renderAccountLink(); });
onLanguage(renderHtmlTranslations);
markCurrentPage();
setupMobileMenu();

export { courses, findCourse };
