// 25–29 · Ficha de curso. app.js gestiona el reproductor, el progreso y el carrito;
// este módulo añade el hero, el temario plegable, la vista previa, el equipo y las opiniones.
import { findCourse, findPath, pathsForCourse, schools, waves } from './data.js';
import { $, t, tr, esc, params, courseText, lessonVideo, videoDuration, formatDuration, icons, onLanguage, setTitle, readProgress } from './ui.js';
import { teacherCards } from './edu.js';

const course = findCourse(params.get('curso'));

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
        ${school ? `<li><a href="./escuelas.html?area=${school.id}">${esc(t(school.title))}</a></li>` : ''}
        ${path ? `<li><a href="./ruta.html?ruta=${path.id}">${esc(t(path.title))}</a></li>` : ''}`;
    $('course-status').textContent = course.sample ? tr('Curso con clases de muestra', 'Course with sample lessons') : `${tr('Curso', 'Course')} ${String(course.number).padStart(2, '0')} · ${t(waves[course.wave])} · ${tr('en preparación', 'in preparation')}`;
    $('course-audience').hidden = !course.audience;
    $('course-audience').textContent = course.audience ? `${tr('Dirigido a', 'For')}: ${t(course.audience)}` : '';
    $('course-rating').textContent = tr('Sin valoraciones publicadas', 'No published ratings');
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

function render() {
    renderHero();
    renderSyllabus();
    $('course-teachers').innerHTML = teacherCards([course.id]);
    renderReviews();
}

if (course) {
    onLanguage(render);
    setupPreview();
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
