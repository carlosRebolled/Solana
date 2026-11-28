import { renderHelpChat } from './help-chat.js';
import { renderEditorial } from './editorial.js';
import { courses, englishCourses, schools, coursesForSchool, findSchool, pageHref } from './data.js';

// Enter verified figures only. Set period to { es: '…', en: '…' } for their reporting period.
const metrics = { students: null, clients: null, graduates: null, hours: null, period: null };
let language = 'es';
const tr = (es, en) => language === 'en' ? en : es;
const getLocale = () => tr('es-CR', 'en-US');

function courseText(course) {
    const [title, description, lessons] = englishCourses[course.id];
    return language === 'en' ? { title, description, lessons } : course;
}

function renderMetrics() {
    const number = new Intl.NumberFormat(getLocale());
    document.querySelectorAll('[data-metric]').forEach((item) => {
        const value = metrics[item.dataset.metric];
        item.textContent = value === null ? tr('Por publicar', 'To be published') : number.format(value);
    });
    document.querySelectorAll('[data-period]').forEach((item) => {
        item.hidden = !metrics.period;
        item.textContent = metrics.period?.[language] ?? '';
    });
}

const translations = [
    ['data-en', null],
    ['data-en-label', 'aria-label'],
    ['data-en-placeholder', 'placeholder']
].flatMap(([attribute, target]) => [...document.querySelectorAll(`[${attribute}]`)].map((element) => ({
    // En las páginas estáticas en inglés, data-es* guarda el texto en español.
    element, target, en: element.getAttribute(attribute),
    es: element.getAttribute(attribute.replace('data-en', 'data-es')) ?? (target ? element.getAttribute(target) : element.textContent)
})));

const baseTitle = document.title;

function renderLanguage() {
    document.documentElement.lang = language;
    // Cada página conserva su título; en inglés usa <body data-title-en> si lo tiene.
    document.title = language === 'en' && document.body.dataset.titleEn && !document.body.classList.contains('info-page')
        ? document.body.dataset.titleEn
        : baseTitle;
    for (const { element, target, es, en } of translations) {
        if (target) element.setAttribute(target, tr(es, en));
        else element.textContent = tr(es, en);
    }
    renderMetrics();
    if ($('course-list')) renderCatalog(catalogPage);
    if ($('featured-course')) renderFeaturedCourse();
    renderDirectories();
    renderEditorial(language);
    renderHelpChat(language);
    if (activeCourse) renderCourse();
    renderCart();
    document.dispatchEvent(new CustomEvent('solara:language', { detail: language }));
}

const $ = (id) => document.getElementById(id);
const currency = (amount) => amount === null || amount === undefined ? tr('Por confirmar', 'To be confirmed') : new Intl.NumberFormat(getLocale(), { style: 'currency', currency: 'USD', currencyDisplay: 'code', maximumFractionDigits: 0 }).format(amount);

function readSet(key) {
    try {
        const stored = JSON.parse(localStorage.getItem(key));
        return new Set(Array.isArray(stored) ? stored : []);
    } catch {
        return new Set();
    }
}

function storeSet(key, values) {
    try {
        localStorage.setItem(key, JSON.stringify([...values]));
    } catch {
        // The current session can still use the catalog when storage is unavailable.
    }
}

const cart = readSet('solara-demo-cart');
const completed = readSet('solara-demo-progress');
const player = $('player');
let featuredCourse = courses[0];
const cartDialog = $('cart-dialog');
const params = new URLSearchParams(location.search);
// En las páginas estáticas el curso va en <body data-course>; en curso.html, en ?curso=.
const activeCourse = player ? courses.find((course) => course.id === (document.body.dataset.course ?? params.get('curso'))) : undefined;
let activeLesson = activeCourse && !params.has('muestra')
    ? Math.max(0, activeCourse.lessons.findIndex((_, index) => !completed.has(lessonKey(index))))
    : 0;

function levelText(level) {
    if (!level) return tr('Nivel por definir', 'Level to be defined');
    return level === 'Inicial' ? tr('Inicial', 'Beginner') : tr('Intermedio', 'Intermediate');
}

function normalize(value) {
    return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function renderFeaturedCourse() {
    const { id, image } = featuredCourse;
    const { title, lessons } = courseText(featuredCourse);
    const count = lessons.filter((_, index) => completed.has(`${id}:${index}`)).length;
    for (const button of $('topic-buttons').querySelectorAll('[data-topic]')) {
        button.setAttribute('aria-pressed', String(button.dataset.topic === id));
    }
    $('featured-course').innerHTML = `
        <img src="./media/${image}.jpg" width="560" height="320" alt="">
        <div class="discovery-body">
            <h3>${title}</h3>
            <p>${lessons[0][0]}</p>
            <div class="featured-progress">
                <progress value="${count}" max="${lessons.length}" aria-label="${tr('Progreso del curso', 'Course progress')}"></progress>
                <span>${count}/${lessons.length} ${tr('lecciones completadas', 'lessons completed')}</span>
            </div>
            <div class="actions">
                <a class="button primary" href="${pageHref('course', id, language)}?muestra=1#lecciones">${tr('Ver clase de muestra', 'Watch sample lesson')}</a>
                <a class="button glass" href="${pageHref('course', id, language)}">${tr('Ver temario', 'View syllabus')}</a>
            </div>
        </div>`;
}

const reducedMotionPref = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// Portada: 6 cursos por página con paginación numerada (en otras páginas se muestran todos).
const coursesPerPage = 6;
let catalogPage = 1;
function renderCatalog(page = 1) {
    catalogPage = typeof page === 'number' ? page : 1;
    const term = normalize($('search').value.trim());
    const level = $('level').value;
    const topic = $('catalog-topic').value;
    $('clear-filters').disabled = !term && !level && !topic;
    const matching = courses.filter((course) =>
        (!level || course.level === level)
        && (!topic || course.topic === topic)
        && normalize([course.title, course.description, courseText(course).title, courseText(course).description, course.level].join(' ')).includes(term)
    );

    $('results').textContent = matching.length
        ? `${matching.length} ${matching.length === 1 ? tr('curso', 'course') : tr('cursos', 'courses')} · ${matching.filter((course) => course.sample).length} ${tr('con clases de muestra', 'with sample lessons')}`
        : tr('No se encontraron cursos. Prueba otra búsqueda o cambia el nivel.', 'No courses found. Try another search or level.');

    const pager = $('course-pages');
    const pages = pager ? Math.max(1, Math.ceil(matching.length / coursesPerPage)) : 1;
    catalogPage = Math.min(Math.max(catalogPage, 1), pages);
    const shown = pager ? matching.slice((catalogPage - 1) * coursesPerPage, catalogPage * coursesPerPage) : matching;
    $('course-list').innerHTML = shown.map(courseCard).join('');
    if (pager) {
        pager.hidden = pages <= 1;
        const pageLabel = (number) => tr(`Página ${number}`, `Page ${number}`);
        pager.innerHTML = `<button class="page-step" type="button" data-page="${catalogPage - 1}" ${catalogPage === 1 ? 'disabled' : ''} aria-label="${tr('Página anterior', 'Previous page')}">←</button>
            <ol>${Array.from({ length: pages }, (_, index) => `<li><button class="page-dot" type="button" data-page="${index + 1}" aria-label="${pageLabel(index + 1)}" ${index + 1 === catalogPage ? 'aria-current="page"' : ''}>${index + 1}</button></li>`).join('')}</ol>
            <button class="page-step" type="button" data-page="${catalogPage + 1}" ${catalogPage === pages ? 'disabled' : ''} aria-label="${tr('Página siguiente', 'Next page')}">→</button>`;
    }
}

function courseCard(course) {
        const { title, description } = courseText(course);
        const levelLabel = levelText(course.level);
        return `
        <article class="card" data-available="${course.sample}">
            <div class="card-media"><img src="./media/${course.image}.jpg" alt="" loading="lazy" width="560" height="320"><span class="card-badge">${course.sample ? tr('Clases de muestra', 'Sample lessons') : tr('Próximamente', 'Coming soon')}</span></div>
            <div class="card-body">
                <p class="card-meta">${levelLabel} · ${course.lessons.length} ${tr('lecciones', 'lessons')}</p>
                <h3>${title}</h3>
                <p>${description}</p>
                <div class="card-bottom">
                    <strong>${course.price === null ? tr('Precio por confirmar', 'Price to be confirmed') : currency(course.price)}</strong>
                    <a class="button outline" href="${pageHref('course', course.id, language)}" aria-label="${tr('Ver curso', 'View course')}: ${title}">${tr('Ver curso', 'View course')}</a>
                </div>
            </div>
        </article>`;
}

function renderDirectories() {
    for (const id of ['school-rail', 'school-directory']) {
        const container = $(id);
        if (!container) continue;
        container.innerHTML = schools.map((school) => {
            const label = tr(...school.title);
            const count = coursesForSchool(school).length;
            return `<a class="school-card" href="${pageHref('school', school.id, language)}">
                <img src="./media/${school.image}.jpg" alt="" width="448" height="240" loading="lazy">
                <div><h2>${label}</h2><p>${count} ${count === 1 ? tr('curso', 'course') : tr('cursos', 'courses')}</p></div>
            </a>`;
        }).join('');
    }

    if ($('school-title') && params.has('area')) {
        const school = findSchool(params.get('area'));
        const title = school ? tr(...school.title) : tr('Escuela no encontrada', 'School not found');
        $('school-title').textContent = title;
        $('school-description').textContent = school
            ? tr('Cursos y lecciones de muestra de esta escuela.', 'Sample courses and lessons from this school.')
            : tr('Elige una de las escuelas disponibles.', 'Choose one of the available schools.');
        if (school) {
            $('school-directory').hidden = true;
            $('school-courses').hidden = false;
            $('school-courses').innerHTML = `
                <div class="section-heading"><h2>${tr('Cursos de la escuela', 'School courses')}</h2>
                    <a class="button outline" href="./escuelas.html">${tr('Todas las escuelas', 'All schools')}</a></div>
                <div class="course-grid">${coursesForSchool(school).map(courseCard).join('')}</div>`;
        }
        document.title = `${title} | Solara Field School`;
    } else if ($('school-title')) {
        document.title = `${tr('Escuelas', 'Schools')} | Solara Field School`;
    }

    if (document.body.classList.contains('directory-page') && $('course-list')) {
        document.title = `${tr('Catálogo', 'Course catalog')} | Solara Field School`;
    }
    if ($('pricing-courses')) {
        $('pricing-courses').innerHTML = courses.map(courseCard).join('');
        document.title = `${tr('Precios de muestra', 'Sample prices')} | Solara Field School`;
    }

    updateSchoolRail();
}

function updateSchoolRail() {
    const rail = $('school-rail');
    if (!rail) return;
    const end = rail.scrollWidth - rail.clientWidth;
    $('school-controls').hidden = end <= 1;
    $('schools-prev').disabled = rail.scrollLeft <= 1;
    $('schools-next').disabled = rail.scrollLeft >= end - 1;
}

const rail = $('school-rail');
if (rail) {
    rail.addEventListener('scroll', updateSchoolRail, { passive: true });
    window.addEventListener('resize', updateSchoolRail);
    for (const [id, direction] of [['schools-prev', -1], ['schools-next', 1]]) {
        $(id).addEventListener('click', () => rail.scrollBy({
            left: direction * rail.clientWidth * .7,
            behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
        }));
    }
}

const navigationToggle = $('navigation-toggle');
if (navigationToggle) {
    const navigation = $('main-navigation');
    const closeMenu = () => navigationToggle.setAttribute('aria-expanded', 'false');
    navigationToggle.addEventListener('click', () => {
        const expanded = navigationToggle.getAttribute('aria-expanded') === 'true';
        navigationToggle.setAttribute('aria-expanded', String(!expanded));
    });
    navigation.addEventListener('click', closeMenu);
    navigationToggle.closest('header').addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navigationToggle.getAttribute('aria-expanded') === 'true') {
            closeMenu();
            navigationToggle.focus();
        }
    });
}

function lessonKey(index) {
    return `${activeCourse.id}:${index}`;
}

function renderProgress() {
    const count = activeCourse.lessons.filter((_, index) => completed.has(lessonKey(index))).length;
    $('progress').textContent = tr(`${count} de ${activeCourse.lessons.length} lecciones completadas`, `${count} of ${activeCourse.lessons.length} lessons completed`);
    if ($('progress-bar')) $('progress-bar').style.width = `${Math.round((count / activeCourse.lessons.length) * 100)}%`;
    $('lessons').innerHTML = courseText(activeCourse).lessons.map(([title], index) => {
        const done = completed.has(lessonKey(index));
        return `<button class="lesson" type="button" data-lesson="${index}" data-done="${done}" aria-current="${index === activeLesson}">
            <span class="check-mark" aria-hidden="true">${done ? '✓' : index + 1}</span>
            <span class="lesson-name">${done ? `<span class="sr-only">${tr('Completada:', 'Completed:')} </span>` : ''}${title}</span>
            ${activeCourse.sample ? `<small class="lesson-time" data-duration-src="./media/${activeCourse.id}-${index + 1}.mp4"></small>` : ''}
        </button>`;
    }).join('');
    document.dispatchEvent(new CustomEvent('solara:progress'));
    $('complete-lesson').textContent = completed.has(lessonKey(activeLesson))
        ? tr('Marcar como pendiente', 'Mark as incomplete')
        : tr('Marcar como completada', 'Mark as complete');
}

function selectLesson(index, focus = false) {
    activeLesson = index;
    const [title, description] = courseText(activeCourse).lessons[index];
    $('lesson-title').textContent = title;
    $('lesson-description').textContent = description;
    $('video-status').textContent = '';
    $('video-language').hidden = language === 'es';
    player.poster = `./media/${activeCourse.image}.jpg`;
    if (!activeCourse.sample) {
        player.removeAttribute('src');
        $('video-status').textContent = tr('Esta lección está en preparación. Puedes ver las clases de muestra de los cursos disponibles.', 'This lesson is being prepared. You can watch the sample lessons of the available courses.');
        renderProgress();
        return;
    }
    const source = `./media/${activeCourse.id}-${index + 1}.mp4`;
    if (player.getAttribute('src') !== source || player.error) player.src = source;
    renderProgress();
    if (focus) $('lessons').querySelector(`[data-lesson="${index}"]`).focus();
}

function renderAddButton() {
    const added = cart.has(activeCourse.id);
    const unavailable = activeCourse.price === null;
    $('add-course').textContent = unavailable ? tr('Próximamente', 'Coming soon') : added ? tr('En el carrito', 'In cart') : tr('Añadir al carrito', 'Add to cart');
    $('add-course').disabled = added || unavailable;
}

function renderCourse() {
    const { title, description, lessons } = courseText(activeCourse);
    document.title = `${title} | Solara Field School`;
    $('course-title').textContent = title;
    $('course-description').textContent = description;
    $('course-level').textContent = levelText(activeCourse.level);
    $('course-count').textContent = lessons.length;
    $('course-price').textContent = currency(activeCourse.price);
    $('course-cover').src = `./media/${activeCourse.image}.jpg`;
    $('course-outcomes').replaceChildren(...lessons.map(([, outcome]) => {
        const item = document.createElement('li');
        item.textContent = outcome;
        return item;
    }));
    $('course-content').hidden = false;
    renderAddButton();
    selectLesson(activeLesson);
}

function renderCart() {
    if (!$('cart-items')) return; // El campus no tiene carrito.
    const selected = courses.filter((course) => cart.has(course.id) && course.price !== null);
    $('cart-count').textContent = selected.length;
    $('cart-items').innerHTML = selected.length ? selected.map((course) => `
        <div class="cart-row"><img class="cart-thumb" src="./media/${course.image}.jpg" alt="" width="64" height="48"><div class="cart-info"><strong>${courseText(course).title}</strong><br>${currency(course.price)}</div>
            <button class="button outline" type="button" data-remove="${course.id}" aria-label="${tr('Quitar', 'Remove')} ${courseText(course).title}">${tr('Quitar', 'Remove')}</button></div>
    `).join('') : `<p class="cart-empty">${tr('Tu carrito está vacío.', 'Your cart is empty.')} <a href="./catalogo.html">${tr('Explorar cursos', 'Browse courses')}</a></p>`;
    $('cart-total').textContent = `Total: ${currency(selected.reduce((sum, course) => sum + course.price, 0))}`;
    $('checkout').disabled = !selected.length;
}

$('search')?.addEventListener('input', renderCatalog);
$('course-pages')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-page]');
    if (!button || button.disabled) return;
    renderCatalog(Number(button.dataset.page));
    const section = $('cursos');
    if (section && section.getBoundingClientRect().top < 0) section.scrollIntoView({ behavior: reducedMotionPref() ? 'auto' : 'smooth', block: 'start' });
    ($('course-pages').querySelector('[aria-current="page"]') ?? $('course-list').querySelector('a'))?.focus({ preventScroll: true });
});
$('level')?.addEventListener('change', renderCatalog);
$('catalog-topic')?.addEventListener('change', renderCatalog);
$('find-lessons')?.addEventListener('click', () => {
    requestAnimationFrame(() => $('search').focus({ preventScroll: true }));
});
$('clear-filters')?.addEventListener('click', () => {
    for (const id of ['search', 'level', 'catalog-topic']) $(id).value = '';
    $('search').focus();
    renderCatalog();
});
$('topic-buttons')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-topic]');
    if (button) {
        featuredCourse = courses.find((course) => course.id === button.dataset.topic);
        renderFeaturedCourse();
    }
});

if (player && !activeCourse) $('course-missing').hidden = false;

if (activeCourse) {
    $('lessons').addEventListener('click', (event) => {
        const button = event.target.closest('[data-lesson]');
        if (button) selectLesson(Number(button.dataset.lesson), true);
    });
    player.addEventListener('error', () => {
        $('video-status').textContent = tr('No se pudo cargar el video. Selecciona la lección de nuevo para reintentar.', 'Could not load the video. Select the lesson again to retry.');
    });
    player.addEventListener('ended', () => {
        completed.add(lessonKey(activeLesson));
        storeSet('solara-demo-progress', completed);
        renderProgress();
    });
    $('complete-lesson').addEventListener('click', () => {
        const key = lessonKey(activeLesson);
        if (completed.has(key)) completed.delete(key);
        else completed.add(key);
        storeSet('solara-demo-progress', completed);
        renderProgress();
    });
    $('add-course').addEventListener('click', () => {
        cart.add(activeCourse.id);
        storeSet('solara-demo-cart', cart);
        renderAddButton();
        renderCart();
        player.pause();
        $('checkout-status').textContent = '';
        cartDialog.showModal();
    });
}

window.addEventListener('storage', ({ key }) => {
    if (key === 'solara-demo-cart') {
        cart.clear();
        for (const id of readSet(key)) cart.add(id);
        renderCart();
        if (activeCourse) renderAddButton();
    }
    if (key === 'solara-demo-progress') {
        completed.clear();
        for (const id of readSet(key)) completed.add(id);
        if (activeCourse) renderProgress();
        if ($('featured-course')) renderFeaturedCourse();
    }
});

$('open-cart')?.addEventListener('click', () => {
    $('checkout-status').textContent = '';
    player?.pause();
    cartDialog.showModal();
});
$('cart-items')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    cart.delete(button.dataset.remove);
    storeSet('solara-demo-cart', cart);
    renderCart();
    if (activeCourse) renderAddButton();
    ($('cart-items').querySelector('[data-remove]') ?? cartDialog.querySelector('form button')).focus();
});
// El carrito lleva a la página de pago (pago.html), donde se elige el medio de pago.
$('checkout')?.addEventListener('click', () => {
    if (!cart.size) return;
    location.href = './pago.html';
});

// Las páginas estáticas (curso-*, course-*, escuela-*…) tienen un idioma propio y enlazan su versión
// en el otro idioma con <link rel="alternate" hreflang>. Si la persona eligió otro idioma, se la lleva ahí.
const pageLanguage = document.documentElement.dataset.pageLang;
// data-file es el archivo local de la versión en ese idioma (href es la dirección pública).
const alternateFor = (lang) => document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`)?.dataset.file;
const goToAlternate = (lang) => {
    const target = alternateFor(lang);
    if (!pageLanguage || lang === pageLanguage || !target) return false;
    location.replace(`./${target}${location.search}${location.hash}`);
    return true;
};
const storedLanguage = readSet('solara-language');
const savedLanguage = storedLanguage.size ? (storedLanguage.has('en') ? 'en' : 'es') : (pageLanguage ?? 'es');
$('language').value = savedLanguage;
language = savedLanguage;
$('language').addEventListener('change', () => {
    language = $('language').value;
    storeSet('solara-language', new Set([language]));
    if (goToAlternate(language)) return;
    renderLanguage();
});
if (!goToAlternate(savedLanguage)) renderLanguage();

if (activeCourse && location.hash === '#lecciones') {
    requestAnimationFrame(() => $('lecciones').scrollIntoView());
}
