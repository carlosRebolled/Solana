// 25–29 · Ficha de curso. app.js gestiona el reproductor, el progreso y el carrito;
// este módulo añade el hero, el temario plegable, la vista previa, el equipo y las opiniones.
import { courses, findCourse, findPath, pathsForCourse, schools, waves } from './data.js';
import { $, t, tr, esc, params, courseText, lessonVideo, videoDuration, formatDuration, icons, onLanguage, setTitle, readProgress, link, price, levelText, courseCardUI } from './ui.js';
import { teacherCards } from './edu.js';

const course = findCourse(document.body.dataset.course ?? params.get('curso'));

// Opiniones de EJEMPLO para validar el componente. No son reales y se etiquetan así.
const sampleReviews = [
    { initials: 'A', rating: 5, text: ['Ejemplo: las consignas de cada clase son cortas y fáciles de seguir en el campo.', 'Example: each lesson’s instructions are short and easy to follow in the field.'] },
    { initials: 'B', rating: 4, text: ['Ejemplo: me gustaría tener más ejercicios para comparar dos lugares.', 'Example: I would like more exercises to compare two places.'] }
];

function modules() {
    const { lessons } = courseText(course);
    return [{ title: course.sample ? tr('Clases del curso', 'Course lessons') : tr('Temas del curso', 'Course topics'), lessons }];
}

function renderSyllabus() {
    const progress = readProgress();
    let number = 0;
    $('course-syllabus').innerHTML = modules().map((module, moduleIndex) => `<section class="syllabus-module">
        <h3><button class="module-toggle" type="button" aria-expanded="${moduleIndex === 0}" aria-controls="module-${moduleIndex}">
            <span>${esc(module.title)}</span><small>${module.lessons.length} ${tr('clases', 'lessons')}</small></button></h3>
        <div class="module-panel" id="module-${moduleIndex}" data-open="${moduleIndex === 0}">
            <ol>${module.lessons.map(([title], index) => {
                number += 1;
                const done = progress.has(`${course.id}:${index}`);
                return `<li class="lesson-row" data-locked="${!course.sample}">
                    <span class="num">${String(number).padStart(2, '0')}</span>
                    ${course.sample
                        ? `<a class="title" href="#lecciones" data-open-lesson="${index}">${esc(title)}${done ? ` <span class="sr-only">(${tr('completada', 'completed')})</span> ✓` : ''}</a>`
                        : `<span class="title">${esc(title)}</span>`}
                    <span class="duration" ${course.sample ? `data-duration-src="${lessonVideo(course, index)}"` : ''}>${course.sample ? '…' : tr('En preparación', 'In preparation')}</span>
                </li>`;
            }).join('')}</ol>
        </div>
    </section>`).join('');
    for (const node of $('course-syllabus').querySelectorAll('[data-duration-src]')) {
        videoDuration(node.dataset.durationSrc).then((seconds) => { node.textContent = formatDuration(seconds) || '—'; });
    }
}

function renderHero() {
    const school = schools.find((entry) => entry.topic === course.topic);
    const path = findPath(params.get('ruta')) ?? pathsForCourse(course.id)[0];
    const { title } = courseText(course);
    setTitle(title);
    $('course-breadcrumbs').innerHTML = `<li><a href="./catalogo.html">${tr('Cursos', 'Courses')}</a></li>
        ${school ? `<li><a href="${link('school', school.id)}">${esc(t(school.title))}</a></li>` : ''}
        ${path ? `<li><a href="${link('path', path.id)}">${esc(t(path.title))}</a></li>` : ''}`;
    $('course-status').textContent = course.sample ? tr('Curso con clases de muestra', 'Course with sample lessons') : `${tr('Curso', 'Course')} ${String(course.number).padStart(2, '0')} · ${t(waves[course.wave])} · ${tr('en preparación', 'in preparation')}`;
    $('course-audience').hidden = !course.audience;
    $('course-audience').textContent = course.audience ? `${tr('Dirigido a', 'For')}: ${t(course.audience)}` : '';
    $('course-rating').textContent = tr('Sin valoraciones publicadas', 'No published ratings');
    $('course-level').textContent = course.level ? levelText(course.level) : tr('Por definir', 'To be defined');
    $('course-start').textContent = course.sample ? tr('Empezar la clase de muestra', 'Start the sample lesson') : tr('Ver el temario', 'View the syllabus');
    $('course-start').href = course.sample ? '#lecciones' : '#temario';
    $('preview-play').querySelector('span').innerHTML = icons.play;
    $('preview-play').setAttribute('aria-label', course.sample ? tr(`Reproducir la primera clase de ${title}`, `Play the first lesson of ${title}`) : tr('Vista previa no disponible', 'Preview not available'));
    $('preview-caption').textContent = course.sample ? tr('Vista previa: primera clase', 'Preview: first lesson') : tr('Vista previa no disponible todavía', 'Preview not available yet');
    if (course.sample) {
        Promise.all(course.lessons.map((_, index) => videoDuration(lessonVideo(course, index)))).then((values) => {
            $('course-duration').textContent = values.every(Number.isFinite) ? formatDuration(values.reduce((sum, value) => sum + value, 0)) : '—';
        });
    } else {
        $('course-duration').textContent = tr('Por definir', 'To be defined');
    }
}

// 28 · LessonPreview: carga el video bajo demanda, con estado de carga y mensaje de error.
function setupPreview() {
    const preview = $('lesson-preview');
    $('preview-play').addEventListener('click', () => {
        preview.querySelector('.preview-error')?.remove();
        if (!course.sample) {
            preview.insertAdjacentHTML('beforeend', `<p class="preview-error" role="status">${tr('Este curso todavía no tiene videos. Puedes revisar su temario.', 'This course has no videos yet. You can check its syllabus.')}</p>`);
            return;
        }
        preview.dataset.state = 'loading';
        const video = document.createElement('video');
        video.controls = true;
        video.playsInline = true;
        video.poster = `./media/${course.image}.jpg`;
        video.setAttribute('aria-label', tr('Vista previa de la primera clase', 'Preview of the first lesson'));
        video.addEventListener('canplay', () => { preview.dataset.state = 'ready'; video.play().catch(() => {}); }, { once: true });
        video.addEventListener('error', () => {
            preview.dataset.state = 'error';
            preview.insertAdjacentHTML('beforeend', `<p class="preview-error" role="alert">${tr('No se pudo cargar la vista previa. Inténtalo de nuevo.', 'The preview could not be loaded. Please try again.')}</p>`);
            video.remove();
            $('preview-play').hidden = false;
        }, { once: true });
        video.src = lessonVideo(course, 0);
        $('preview-play').hidden = true;
        $('course-cover').hidden = true;
        $('preview-caption').hidden = true;
        preview.prepend(video);
    });
}

function renderReviews() {
    const average = sampleReviews.reduce((sum, review) => sum + review.rating, 0) / sampleReviews.length;
    const stars = (value) => `<span class="stars" aria-hidden="true">${'★'.repeat(Math.round(value))}${'☆'.repeat(5 - Math.round(value))}</span>`;
    $('course-reviews').innerHTML = `<p class="result-count">${tr('Todavía no hay opiniones reales. Las tarjetas siguientes son ejemplos de diseño y no cuentan como valoraciones.', 'There are no real reviews yet. The cards below are design examples and do not count as ratings.')}</p>
        <div class="review-summary"><strong>${average.toFixed(1)}</strong>${stars(average)}<span class="demo-badge">${tr('Ejemplo', 'Example')}</span><span class="muted">${sampleReviews.length} ${tr('opiniones de ejemplo', 'example reviews')}</span></div>
        <div class="review-grid">${sampleReviews.map((review) => `<article class="review-card">
            <header><span class="teacher-avatar" style="width:40px;height:40px" aria-hidden="true">${review.initials}</span>
                <div><strong>${tr('Persona de ejemplo', 'Example person')}</strong><br>${stars(review.rating)}<span class="sr-only">${review.rating} / 5</span></div></header>
            <p>${esc(t(review.text))}</p>
        </article>`).join('')}</div>`;
}

// Las pestañas del curso (y los botones que apuntan a esas secciones) abren la sección en una
// ventana emergente en lugar de desplazar la página. El contenido se mueve a la ventana y vuelve a
// su lugar al cerrarla, así el reproductor y los demás controles siguen siendo los mismos.
const dialogSections = ['aprendizaje', 'temario', 'lecciones', 'docentes', 'opiniones'];

function setupSectionDialog() {
    const dialog = $('section-dialog');
    const body = $('section-dialog-body');
    let current = null;

    const restore = () => {
        if (!current) return;
        current.placeholder.replaceWith(...current.nodes);
        current = null;
        $('player')?.pause();
    };

    const open = (id, trigger) => {
        const section = $(id);
        const heading = section?.querySelector('h2');
        if (!heading) return false;
        // Si ya hay una sección abierta, se devuelve a su lugar y la ventana sigue abierta con la nueva.
        restore();
        const nodes = [];
        for (let node = heading.nextElementSibling; node; node = node.nextElementSibling) nodes.push(node);
        const placeholder = document.createElement('div');
        placeholder.style.minHeight = `${nodes.reduce((sum, node) => sum + node.offsetHeight, 0)}px`;
        nodes[0].before(placeholder);
        body.replaceChildren(...nodes);
        current = { nodes, placeholder, trigger };
        $('section-dialog-title').textContent = heading.textContent;
        dialog.dataset.section = id;
        if (!dialog.open) dialog.showModal();
        body.scrollTop = 0;
        $('section-dialog-close').focus();
        return true;
    };

    dialog.addEventListener('close', () => {
        const trigger = current?.trigger;
        restore();
        if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    });
    // Cerrar al pulsar fuera de la ventana.
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    $('section-dialog-close').addEventListener('click', () => dialog.close());

    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="#"]');
        const id = link?.getAttribute('href').slice(1);
        if (!dialogSections.includes(id)) return;
        event.preventDefault();
        const trigger = dialog.contains(link) ? current?.trigger : link;
        open(id, trigger);
    });
}

// Tarjeta de compra: precio, botones y lo que incluye el curso.
const totalVideo = () => (course.sample
    ? Promise.all(course.lessons.map((_, index) => videoDuration(lessonVideo(course, index)))).then((values) => (values.every(Number.isFinite) ? values.reduce((sum, value) => sum + value, 0) : null))
    : Promise.resolve(null));
const forSale = () => course.price !== null;

function renderBuyCard() {
    const { title } = courseText(course);
    $('buy-card').dataset.forSale = String(forSale());
    $('buy-price').textContent = forSale() ? price(course.price) : tr('Próximamente', 'Coming soon');
    $('buy-price-note').textContent = forSale() ? tr('precio de muestra · pago único', 'sample price · one-time payment') : tr('precio por confirmar', 'price to be confirmed');
    $('buy-now').textContent = forSale() ? tr('Comprar ahora', 'Buy now') : tr('Avísame cuando esté disponible', 'Notify me when available');
    const lessons = course.lessons.length;
    $('buy-includes').innerHTML = [
        `${lessons} ${course.sample ? tr('clases en video', 'video lessons') : tr('temas en el temario', 'syllabus topics')}`,
        course.sample ? `<span id="buy-duration">${tr('Video', 'Video')}</span>` : tr('Formato: curso asíncrono, a tu ritmo', 'Format: self-paced course'),
        tr('Certificado de finalización', 'Certificate of completion'),
        tr('Acceso desde el navegador, en computadora o celular', 'Access from your browser, on computer or phone'),
        course.sample ? tr('Clases en español, textos en español e inglés', 'Lessons in Spanish, text in Spanish and English') : tr('Disponible en español e inglés', 'Available in Spanish and English'),
        ...(course.wave ? [t(waves[course.wave])] : [])
    ].map((item) => `<li>${item}</li>`).join('');
    totalVideo().then((seconds) => {
        if ($('buy-duration') && seconds) $('buy-duration').textContent = `${formatDuration(seconds)} ${tr('de video', 'of video')}`;
    });
    $('sticky-title').textContent = title;
    $('sticky-price').textContent = forSale() ? price(course.price) : tr('Próximamente', 'Coming soon');
    $('sticky-action').textContent = forSale() ? tr('Comprar ahora', 'Buy now') : tr('Avísame', 'Notify me');
}

function buyNow() {
    const message = $('buy-message');
    if (!forSale()) {
        message.textContent = tr('Las notificaciones todavía no están activas. Puedes escribir a Solara desde la página de contacto para recibir novedades de este curso.', 'Notifications are not active yet. You can write to Solara from the contact page to hear about this course.');
        return;
    }
    try {
        const stored = new Set(JSON.parse(localStorage.getItem('solara-demo-cart')) ?? []);
        stored.add(course.id);
        localStorage.setItem('solara-demo-cart', JSON.stringify([...stored]));
    } catch { /* sin almacenamiento: el carrito no se guarda */ }
    location.href = './pago.html';
}

// Para quién es: público del documento maestro, nivel y escuela.
function renderFit() {
    const school = schools.find((entry) => entry.topic === course.topic);
    const items = [
        [tr('Dirigido a', 'Who it’s for'), course.audience ? t(course.audience) : tr('Personas que quieren llevar el aprendizaje al aire libre: estudiantes, familias, docentes y líderes de grupos.', 'People who want to take learning outdoors: students, families, teachers and group leaders.')],
        [tr('Nivel', 'Level'), course.level ? `${levelText(course.level)}. ${tr('No necesitas experiencia previa en el tema.', 'No previous experience in the topic is needed.')}` : tr('Por definir. Indicaremos el nivel y los conocimientos previos al publicar el curso.', 'To be defined. We will state the level and prerequisites when the course is published.')],
        [tr('Área', 'Area'), school ? `<a href="${link('school', school.id)}">${esc(t(school.title))}</a>` : '—'],
        [tr('Alcance', 'Scope'), tr('Curso en línea introductorio. No sustituye una acreditación profesional ni la práctica supervisada en el campo.', 'Introductory online course. It does not replace professional accreditation or supervised field practice.')]
    ];
    $('course-fit').innerHTML = items.map(([label, text]) => `<article class="fit-card"><h3>${label}</h3><p>${label === tr('Área', 'Area') ? text : esc(text)}</p></article>`).join('');
}

function renderFaq() {
    const questions = [
        [tr('¿Cuándo empiezo?', 'When can I start?'), course.sample ? tr('Cuando quieras: las clases de muestra ya están disponibles y avanzas a tu ritmo.', 'Whenever you want: the sample lessons are available now and you go at your own pace.') : tr('El curso está en preparación. Puedes revisar el temario y pedir que te avisemos cuando abra.', 'The course is in preparation. You can review the syllabus and ask to be notified when it opens.')],
        [tr('¿Recibo un certificado?', 'Do I get a certificate?'), tr('Sí, un certificado de finalización al completar todas las clases. No es una acreditación profesional oficial.', 'Yes, a certificate of completion when you finish every lesson. It is not an official professional accreditation.')],
        [tr('¿Cómo pago?', 'How do I pay?'), tr('Con PayPal, que acepta tarjetas. Por ahora los pagos están en vista previa y no se cobra nada.', 'With PayPal, which accepts cards. For now payments are in preview and nothing is charged.')],
        [tr('¿Hay descuentos para grupos o instituciones?', 'Are there discounts for groups or institutions?'), tr('Sí. Escuelas, campamentos y ONG pueden pedir capacitación institucional desde la página de precios.', 'Yes. Schools, camps and NGOs can request institutional training from the pricing page.')]
    ];
    $('course-faq').innerHTML = questions.map(([question, answer]) => `<details><summary>${esc(question)}</summary><p>${esc(answer)}</p></details>`).join('');
}

function renderRelated() {
    const same = courses.filter((entry) => entry.id !== course.id && entry.topic === course.topic);
    const others = courses.filter((entry) => entry.id !== course.id && entry.topic !== course.topic && entry.sample);
    $('related-courses').innerHTML = [...same, ...others].slice(0, 4).map((entry) => courseCardUI(entry)).join('');
}

// La barra fija aparece cuando la tarjeta de compra sale de la pantalla.
function setupStickyBuy() {
    const bar = $('sticky-buy');
    $('sticky-action').addEventListener('click', buyNow);
    $('buy-now').addEventListener('click', buyNow);
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(([entry]) => {
        const show = !entry.isIntersecting;
        bar.dataset.visible = String(show);
        bar.setAttribute('aria-hidden', String(!show));
        $('sticky-action').tabIndex = show ? 0 : -1;
    }).observe($('buy-card'));
}

function render() {
    renderHero();
    renderBuyCard();
    renderFit();
    renderFaq();
    renderRelated();
    renderSyllabus();
    $('course-teachers').innerHTML = teacherCards([course.id]);
    renderReviews();
}

if (course) {
    onLanguage(render);
    setupPreview();
    setupStickyBuy();
    // Plegado accesible de módulos sin saltos: la altura se anima con grid-template-rows.
    $('course-syllabus').addEventListener('click', (event) => {
        const toggle = event.target.closest('.module-toggle');
        if (toggle) {
            const open = toggle.getAttribute('aria-expanded') !== 'true';
            toggle.setAttribute('aria-expanded', String(open));
            $(toggle.getAttribute('aria-controls')).dataset.open = String(open);
        }
        const link = event.target.closest('[data-open-lesson]');
        if (link) {
            requestAnimationFrame(() => document.querySelector(`#lessons [data-lesson="${link.dataset.openLesson}"]`)?.click());
        }
    });
    // Enlace directo a una clase: ?leccion=2 abre la segunda clase en el reproductor.
    const requested = Number(params.get('leccion')) - 1;
    if (course.sample && requested >= 0 && requested < course.lessons.length) {
        addEventListener('load', () => document.querySelector(`#lessons [data-lesson="${requested}"]`)?.click(), { once: true });
    }
    document.addEventListener('click', (event) => {
        if (event.target.closest('#complete-lesson')) requestAnimationFrame(renderSyllabus);
    });
    setupSectionDialog();
} else {
    setTitle(tr('Curso no encontrado', 'Course not found'));
}
