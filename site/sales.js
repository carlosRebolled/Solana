// Portada: presenta la ruta «Primeros pasos en el campo». Temario, precio y duraciones salen de
// data.js (cursos reales y duración leída de cada video). La prueba social y la garantía vienen de
// `salesPage` y se marcan como «Dato de ejemplo» mientras `demo` sea true. El catálogo paginado
// y el blog los dibuja app.js.
import { findPath, findCourse, salesPage, testimonials } from './data.js';
import { feedbackForm } from './feedback.js';
import { openHelp } from './help-chat.js';
import { $, t, tr, esc, courseText, levelText, lessonVideo, videoDuration, formatDuration, price, onLanguage, fillDurations, icons, setupCarousel } from './ui.js';

const path = findPath(salesPage.path);
const courses = path.courses.map(findCourse);
const total = courses.reduce((sum, course) => sum + (course.price ?? 0), 0);
const lessonCount = courses.reduce((sum, course) => sum + course.lessons.length, 0);
const durations = Promise.all(courses.map((course) => Promise.all(course.lessons.map((_, index) => videoDuration(lessonVideo(course, index))))));
const seconds = (list) => list.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
const demoTag = (on) => (on ? `<span class="sales-tag is-demo">${tr('Dato de ejemplo', 'Sample data')}</span>` : '');
const number = (value, digits = 0) => new Intl.NumberFormat(tr('es-CR', 'en-US'), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);

// Prueba social junto al CTA: grupo de avatares, alumnos y calificación.
function renderProof() {
    const { students, rating } = salesPage;
    const initials = ['AM', 'JR', 'LS', 'DV'];
    const stars = Array.from({ length: 5 }, (_, index) => `<span class="${index < Math.round(rating.value) ? 'is-on' : ''}">★</span>`).join('');
    $('hero-proof').innerHTML = `<span class="sales-avatars" aria-hidden="true">${initials.map((letters) => `<span>${letters}</span>`).join('')}</span>
        <span class="sales-proof-text">
            <strong>+${number(students.value)} ${tr('alumnos', 'students')}</strong>
            <span class="sales-rating"><span class="sales-stars" aria-hidden="true">${stars}</span> <span>${number(rating.value, 1)} · ${number(rating.reviews)} ${tr('reseñas', 'reviews')}</span></span>
            ${demoTag(students.demo || rating.demo)}
        </span>`;
}

// Temario: un módulo por curso, con sus clases y la duración real de los videos.
function renderCurriculum(times = null) {
    const open = new Set([...document.querySelectorAll('#curriculum details[open]')].map((node) => node.dataset.module));
    if (!document.querySelector('#curriculum details')) open.add(courses[0].id);
    $('curriculum').innerHTML = courses.map((course, position) => {
        const text = courseText(course);
        const own = times?.[position];
        return `<details data-module="${course.id}" ${open.has(course.id) ? 'open' : ''}>
            <summary>
                <span class="sales-module-index" aria-hidden="true">${String(position + 1).padStart(2, '0')}</span>
                <span class="sales-module-title"><span class="sr-only">${tr('Módulo', 'Module')} ${position + 1}: </span>${esc(text.title)}<small>${levelText(course.level)} · ${course.lessons.length} ${course.lessons.length === 1 ? tr('clase', 'lesson') : tr('clases', 'lessons')}</small></span>
                <span class="sales-module-time">${own ? formatDuration(seconds(own)) || '—' : '—'}</span>
                <span class="sales-chevron" aria-hidden="true"></span>
            </summary>
            <ol class="sales-lessons">${text.lessons.map(([title, summary], index) => `<li>
                <span class="sales-lesson-dot" aria-hidden="true">${index + 1}</span>
                <span><strong>${esc(title)}</strong><small>${esc(summary)}</small></span>
                <span class="sales-lesson-time">${own ? formatDuration(own[index]) || '—' : '—'}</span>
            </li>`).join('')}</ol>
        </details>`;
    }).join('');
    syncToggle();
}
function syncToggle() {
    const items = [...document.querySelectorAll('#curriculum details')];
    const allOpen = items.length && items.every((item) => item.open);
    $('curriculum-toggle').textContent = allOpen ? tr('Cerrar todos', 'Close all') : tr('Abrir todos', 'Open all');
    $('curriculum-toggle').setAttribute('aria-pressed', String(allOpen));
}
$('curriculum-toggle').addEventListener('click', () => {
    const items = [...document.querySelectorAll('#curriculum details')];
    const open = !items.every((item) => item.open);
    for (const item of items) item.open = open;
    syncToggle();
});
$('curriculum').addEventListener('toggle', syncToggle, true);

function renderTotals(times = null) {
    const all = times ? seconds(times.flat()) : null;
    for (const node of document.querySelectorAll('[data-total-duration]')) node.textContent = all ? formatDuration(all) : '—';
    for (const node of document.querySelectorAll('[data-lesson-count]')) node.textContent = lessonCount;
    for (const node of document.querySelectorAll('[data-price-total]')) node.textContent = price(total);
    $('curriculum-total').textContent = `${courses.length} ${tr('módulos', 'modules')} · ${lessonCount} ${tr('clases', 'lessons')}${all ? ` · ${formatDuration(all)} ${tr('de video', 'of video')}` : ''}`;
}

// Historias desde el campo: testimonios de EJEMPLO (data.js), cada tarjeta con la etiqueta «Ejemplo».
function renderStories() {
    $('stories-prev').innerHTML = icons.prev;
    $('stories-next').innerHTML = icons.next;
    $('stories-track').innerHTML = testimonials.map((story, index) => `
        <article class="testimonial-card" aria-roledescription="${tr('tarjeta', 'card')}" aria-label="${index + 1} / ${testimonials.length}">
            <div class="testimonial-content">
                <div class="testimonial-person"><strong>${esc(t(story.role))}</strong><span>${esc(t(story.context))}</span></div>
                <blockquote>${esc(t(story.quote))}</blockquote>
                <div class="testimonial-result"><small>${esc(t(story.label))}</small><strong>${esc(t(story.result))}</strong></div>
            </div>
            <figure><img src="./media/${story.image}.jpg" alt="" loading="lazy" width="284" height="304"><span class="demo-badge">${tr('Ejemplo', 'Example')}</span></figure>
        </article>`).join('');
    setupCarousel($('stories-track'), $('stories-prev'), $('stories-next'))?.();
}

// Precio, qué incluye y la garantía.
function renderPricing() {
    const { guarantee } = salesPage;
    $('price-compare').textContent = tr(`Es la suma de los tres cursos por separado: ${courses.map((course) => price(course.price)).join(' + ')}.`, `It is the sum of the three courses bought separately: ${courses.map((course) => price(course.price)).join(' + ')}.`);
    $('guarantee').innerHTML = `<span class="sales-guarantee-seal" aria-hidden="true"><strong>${guarantee.days}</strong><small>${tr('días', 'days')}</small></span>
        <span><strong>${tr(`Garantía de ${guarantee.days} días`, `${guarantee.days}-day guarantee`)}</strong><small>${tr('Si no es para ti, te devolvemos el pago.', 'If it is not for you, we refund your payment.')}</small>${demoTag(guarantee.demo)}</span>`;
    $('faq-guarantee').innerHTML = `${tr(`Tienes ${guarantee.days} días para pedir la devolución completa, sin explicar por qué.`, `You have ${guarantee.days} days to ask for a full refund, no questions asked.`)} ${guarantee.demo ? `<span class="sales-tag is-demo">${tr('Condición por confirmar', 'Terms to be confirmed')}</span>` : ''}`;
}

// Inscripción: agrega los tres cursos al carrito de demostración y lleva a la página de pago.
function enroll(button) {
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('solara-demo-cart')) ?? []; } catch { cart = []; }
    const next = [...new Set([...cart, ...courses.map((course) => course.id)])];
    try { localStorage.setItem('solara-demo-cart', JSON.stringify(next)); } catch {
        $('enroll-status').textContent = tr('No se pudo guardar el carrito en este navegador.', 'The cart could not be saved in this browser.');
        return;
    }
    button.setAttribute('aria-busy', 'true');
    $('enroll-status').textContent = tr('Cursos agregados. Te llevamos al pago…', 'Courses added. Taking you to payment…');
    location.href = './pago.html';
}
document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-enroll]');
    if (button) enroll(button);
});

// Preguntas: una sola abierta a la vez para que la lista no se alargue de golpe.
const faq = $('faq');
faq.addEventListener('toggle', (event) => {
    if (!event.target.open) return;
    for (const other of faq.querySelectorAll('details[open]')) if (other !== event.target) other.open = false;
}, true);
$('faq-open-help').addEventListener('click', () => openHelp());

// Video de la clase de muestra en una ventana.
const dialog = $('video-dialog');
const player = $('video-player');
$('video-open').addEventListener('click', () => {
    if (!player.src) player.src = salesPage.previewVideo;
    dialog.showModal();
    player.play().catch(() => {});
});
const closeVideo = () => { player.pause(); dialog.close(); };
$('video-close').addEventListener('click', closeVideo);
dialog.addEventListener('click', (event) => { if (event.target === dialog) closeVideo(); });
dialog.addEventListener('close', () => { player.pause(); $('video-open').focus(); });

// Antes / después: pestañas con flechas del teclado. En escritorio se ven las dos a la vez.
const tabs = [$('tab-before'), $('tab-after')];
function selectTab(tab, focus = false) {
    for (const other of tabs) {
        const selected = other === tab;
        other.setAttribute('aria-selected', String(selected));
        other.tabIndex = selected ? 0 : -1;
        $(other.getAttribute('aria-controls')).dataset.active = String(selected);
    }
    if (focus) tab.focus();
}
tabs.forEach((tab) => tab.addEventListener('click', () => selectTab(tab)));
$('compare').querySelector('[role="tablist"]').addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    selectTab(tabs[next], true);
});
selectTab($('tab-after'));

// CTA fijo: visible cuando el CTA del hero salió de la pantalla y no se ve el precio ni la banda final.
const sticky = $('sales-sticky');
const seen = new Map();
const watcher = new IntersectionObserver((entries) => {
    for (const entry of entries) seen.set(entry.target, entry.isIntersecting);
    const heroGone = seen.get($('hero-cta')) === false && $('hero-cta').getBoundingClientRect().top < 0;
    const covered = seen.get($('precio')) || seen.get(document.querySelector('.sales-final'));
    const show = heroGone && !covered;
    sticky.dataset.visible = String(show);
    sticky.setAttribute('aria-hidden', String(!show));
    sticky.querySelector('a').tabIndex = show ? 0 : -1;
}, { threshold: 0 });
[$('hero-cta'), $('precio'), document.querySelector('.sales-final')].forEach((node) => watcher.observe(node));

// Cabecera: se marca al hacer scroll.
const header = $('sales-header');
addEventListener('scroll', () => { header.dataset.scrolled = String(scrollY > 8); }, { passive: true });

// Texto alternativo en inglés (app.js traduce textos, etiquetas y marcadores de posición).
function translateAlt() {
    for (const image of document.querySelectorAll('[data-en-alt]')) {
        image.dataset.esAlt ??= image.alt;
        image.alt = tr(image.dataset.esAlt, image.dataset.enAlt);
    }
}

let times = null;
onLanguage(() => {
    renderProof();
    renderCurriculum(times);
    renderTotals(times);
    renderPricing();
    renderStories();
    $('home-feedback').innerHTML = feedbackForm('home');
    translateAlt();
    syncToggle();
});
durations.then((values) => { times = values; renderCurriculum(times); renderTotals(times); });
fillDurations();
