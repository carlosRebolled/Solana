// Campus de Solara: el área de estudio a la que se llega al iniciar sesión. Tiene su propia
// navegación (barra lateral) y un espacio de clase para ver los cursos, separado del sitio público.
// DEMOSTRACIÓN: la cuenta y sus cursos vienen de `demoAccount` (data.js). El progreso, las notas y la
// última clase abierta son los reales de este navegador (localStorage), los mismos que usa Mi cuenta.
import { demoAccount, findCourse, pathsForCourse } from './data.js';
import { $, t, tr, lang, esc, courseText, levelText, lessonVideo, videoDuration, formatDuration, readProgress, onLanguage, setTitle, getSession, endSession, link, ring, teacherName } from './ui.js';

const progressKey = 'solara-demo-progress';
const notesKey = 'solara-demo-notes';
const lastKey = 'solara-demo-last';

const store = {
    read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
};
const saveProgress = (set) => store.write(progressKey, [...set]);
const readNotes = () => store.read(notesKey, {});
function saveNote(courseId, text) {
    const notes = readNotes();
    if (text.trim()) notes[courseId] = text; else delete notes[courseId];
    return store.write(notesKey, notes);
}

const day = (date) => new Intl.DateTimeFormat(tr('es-CR', 'en-US'), { dateStyle: 'long' }).format(date);
const count = (n, es, esMany, en, enMany) => `${n} ${n === 1 ? tr(es, en) : tr(esMany, enMany)}`;
const demoBadge = () => `<span class="demo-badge">${tr('Demostración', 'Demo')}</span>`;
const statusLabel = (status) => ({ new: tr('Sin empezar', 'Not started'), active: tr('En curso', 'In progress'), done: tr('Completado', 'Completed') })[status];
const actionLabel = (status) => (status === 'done' ? tr('Repasar', 'Review') : status === 'new' ? tr('Empezar', 'Start') : tr('Continuar', 'Continue'));
const lessonHref = (id, index) => `#curso/${id}/${index + 1}`;

// Cursos con acceso y su avance.
function library() {
    const progress = readProgress();
    const owned = [
        ...demoAccount.purchases.map((purchase) => ({ id: purchase.course, source: 'purchase' })),
        ...demoAccount.freeAccess.map((id) => ({ id, source: 'free' }))
    ];
    return owned.map((entry) => {
        const course = findCourse(entry.id);
        const done = course.lessons.map((_, index) => progress.has(`${course.id}:${index}`));
        const completed = done.filter(Boolean).length;
        const next = done.indexOf(false);
        const status = completed === 0 ? 'new' : completed === course.lessons.length ? 'done' : 'active';
        return { ...entry, course, text: courseText(course), done, completed, total: course.lessons.length, next, status, percent: Math.round((completed / course.lessons.length) * 100) };
    });
}

// La clase para «Continuar»: la última abierta si sigue pendiente; si no, la primera pendiente.
function resumeTarget(items) {
    const last = store.read(lastKey, null);
    const lastItem = items.find((item) => item.id === last?.course);
    if (lastItem && lastItem.status !== 'done') return { item: lastItem, lesson: lastItem.done[last.lesson] ? lastItem.next : last.lesson };
    const item = items.find((entry) => entry.status === 'active') ?? items.find((entry) => entry.status === 'new');
    return item ? { item, lesson: item.next } : null;
}

async function watchedSeconds(items) {
    const values = await Promise.all(items.flatMap((item) => item.course.lessons.map((_, index) => (item.done[index] ? videoDuration(lessonVideo(item.course, index)) : 0))));
    return values.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
}

function readRoute() {
    const [view = 'inicio', id, lesson] = decodeURIComponent(location.hash.slice(1)).split('/');
    const views = ['inicio', 'cursos', 'certificados', 'notas', 'curso'];
    return { view: views.includes(view) ? view : 'inicio', id, lesson: Number(lesson) - 1 };
}

const greeting = () => {
    const hour = new Date().getHours();
    return hour < 12 ? tr('Buenos días', 'Good morning') : hour < 19 ? tr('Buenas tardes', 'Good afternoon') : tr('Buenas noches', 'Good evening');
};

function courseCard(item) {
    return `<article class="campus-card" data-status="${item.status}">
        <img src="./media/${item.course.image}.jpg" alt="" width="400" height="225" loading="lazy">
        <div class="campus-card-body">
            <p class="campus-card-meta"><span class="status-pill" data-status="${item.status}">${statusLabel(item.status)}</span> ${levelText(item.course.level)}</p>
            <h3><a href="${lessonHref(item.id, Math.max(item.next, 0))}">${esc(item.text.title)}</a></h3>
            <p class="muted">${esc(teacherName(item.id))}</p>
            <div class="campus-card-progress"><span class="cpl-bar" aria-hidden="true"><span style="width:${item.percent}%"></span></span><span>${item.completed}/${item.total} · ${item.percent}%</span></div>
            <a class="btn ${item.status === 'done' ? 'btn-outline' : 'btn-primary'} btn-small" href="${lessonHref(item.id, Math.max(item.next, 0))}" tabindex="-1" aria-hidden="true">${actionLabel(item.status)}</a>
        </div>
    </article>`;
}

// ── Vistas ────────────────────────────────────────────────────────────────────────────────

function homeView(items) {
    const lessons = items.reduce((sum, item) => sum + item.total, 0);
    const done = items.reduce((sum, item) => sum + item.completed, 0);
    const percent = lessons ? Math.round((done / lessons) * 100) : 0;
    const certificates = items.filter((item) => item.status === 'done').length;
    const resume = resumeTarget(items);
    const nextSteps = items.flatMap((item) => pathsForCourse(item.id).map((path) => {
        const nextId = path.courses[path.courses.indexOf(item.id) + 1];
        return nextId && !items.some((entry) => entry.id === nextId) ? { path, course: findCourse(nextId) } : null;
    })).filter(Boolean).filter((entry, index, list) => list.findIndex((other) => other.course.id === entry.course.id) === index).slice(0, 4);
    return `<section class="campus-hello">
            <div><p class="eyebrow-tag">${day(new Date())}</p>
                <h1 id="view-title">${greeting()}, ${esc(t(demoAccount.name))}</h1>
                <p class="muted">${done ? tr(`Llevas ${done} de ${lessons} clases. Sigue a tu ritmo.`, `You have done ${done} of ${lessons} lessons. Keep your own pace.`) : tr('Todavía no empiezas ninguna clase. Te dejamos la primera lista.', 'You have not started any lesson yet. The first one is ready for you.')}</p></div>
            ${ring(percent, 84)}
        </section>
        ${resume ? `<article class="campus-resume">
            <img src="./media/${resume.item.course.image}.jpg" alt="" width="520" height="300">
            <div class="campus-resume-body">
                <p class="eyebrow-tag">${resume.item.status === 'new' ? tr('Empieza aquí', 'Start here') : tr('Continúa donde lo dejaste', 'Pick up where you left off')}</p>
                <h2>${esc(resume.item.text.title)}</h2>
                <p class="campus-resume-lesson"><span class="check-mark" aria-hidden="true">${resume.lesson + 1}</span>${tr('Clase', 'Lesson')} ${resume.lesson + 1}: ${esc(resume.item.text.lessons[resume.lesson][0])}</p>
                <div class="campus-card-progress"><span class="cpl-bar" aria-hidden="true"><span style="width:${resume.item.percent}%"></span></span><span>${resume.item.completed}/${resume.item.total} ${tr('clases', 'lessons')}</span></div>
                <a class="btn btn-primary" href="${lessonHref(resume.item.id, resume.lesson)}">▶ ${resume.item.status === 'new' ? tr('Empezar la clase', 'Start the lesson') : tr('Continuar la clase', 'Continue the lesson')}</a>
            </div>
        </article>` : `<p class="campus-empty">${tr('Completaste todas tus clases. Puedes descargar tus certificados.', 'You completed every lesson. You can get your certificates.')} <a href="#certificados">${tr('Ver certificados', 'View certificates')}</a></p>`}
        <dl class="campus-stats">
            <div><dt>${tr('Clases completadas', 'Lessons completed')}</dt><dd>${done}<small>/${lessons}</small></dd></div>
            <div><dt>${tr('Cursos en marcha', 'Courses in progress')}</dt><dd>${items.filter((item) => item.status === 'active').length}<small>/${items.length}</small></dd></div>
            <div><dt>${tr('Tiempo de video visto', 'Video watched')}</dt><dd id="stat-watched">—</dd></div>
            <div><dt>${tr('Certificados', 'Certificates')}</dt><dd>${certificates}<small>/${items.length}</small></dd></div>
        </dl>
        <div class="campus-section-head"><h2>${tr('Tus cursos', 'Your courses')}</h2><a class="link-arrow" href="#cursos">${tr('Ver todos', 'View all')}</a></div>
        <div class="campus-grid">${items.map(courseCard).join('')}</div>
        ${nextSteps.length ? `<div class="campus-section-head"><h2>${tr('Siguiente en tus rutas', 'Next in your paths')}</h2></div>
        <ul class="campus-next">${nextSteps.map(({ path, course }) => `<li><a href="${link('course', course.id)}">
            <img src="./media/${course.image}.jpg" alt="" width="72" height="48"><span><strong>${esc(courseText(course).title)}</strong><small>${esc(t(path.title))}</small></span>
            <span class="status-pill" data-status="new">${course.price === null ? tr('Próximamente', 'Coming soon') : tr('Ver curso', 'View course')}</span></a></li>`).join('')}</ul>` : ''}`;
}

function coursesView(items) {
    const filters = [['all', tr('Todos', 'All'), items.length], ...['active', 'new', 'done'].map((status) => [status, statusLabel(status), items.filter((item) => item.status === status).length])];
    return `<div class="campus-section-head is-first">
            <h1 id="view-title">${tr('Mis cursos', 'My courses')}</h1>
            <div class="filter-chips" id="course-filters" role="group" aria-label="${tr('Filtrar por estado', 'Filter by status')}">${filters.map(([id, label, total], index) =>
                `<button type="button" data-filter="${id}" aria-pressed="${index === 0}">${label} <span>${total}</span></button>`).join('')}</div>
        </div>
        <div class="campus-grid" id="campus-course-grid">${items.map(courseCard).join('')}</div>
        <p class="campus-empty" id="courses-empty" hidden>${tr('No tienes cursos con este estado.', 'You have no courses with this status.')}</p>
        <div class="campus-section-head"><h2>${tr('Guardados para más adelante', 'Saved for later')}</h2></div>
        <ul class="campus-next">${demoAccount.wishlist.map((id) => findCourse(id)).map((course) => `<li><a href="${link('course', course.id)}">
            <img src="./media/${course.image}.jpg" alt="" width="72" height="48"><span><strong>${esc(courseText(course).title)}</strong><small>${course.level ? levelText(course.level) : tr('En preparación', 'In preparation')}</small></span>
            <span class="status-pill" data-status="new">${tr('Próximamente', 'Coming soon')}</span></a></li>`).join('')}</ul>`;
}

function certificatesView(items) {
    return `<h1 id="view-title">${tr('Certificados', 'Certificates')}</h1>
        <p class="muted campus-lead">${tr('Al completar todas las clases de un curso se desbloquea su certificado de finalización. No es una acreditación profesional oficial.', 'Completing every lesson of a course unlocks its certificate of completion. It is not an official professional accreditation.')}</p>
        <ul class="campus-certs">${items.map((item) => `<li data-ready="${item.status === 'done'}">
            <span class="campus-cert-seal" aria-hidden="true">${item.status === 'done' ? '✓' : `${item.percent}%`}</span>
            <div><strong>${esc(item.text.title)}</strong>
                <span class="cpl-bar" aria-hidden="true"><span style="width:${item.percent}%"></span></span>
                <small>${item.status === 'done' ? tr('Disponible', 'Available') : `${tr('Te falta', 'Remaining:')} ${count(item.total - item.completed, 'clase', 'clases', 'lesson', 'lessons')}`}</small></div>
            ${item.status === 'done'
                ? `<button class="btn btn-primary btn-small" type="button" data-certificate="${item.id}">${tr('Ver certificado', 'View certificate')}</button>`
                : `<a class="btn btn-outline btn-small" href="${lessonHref(item.id, item.next)}">${actionLabel(item.status)}</a>`}
        </li>`).join('')}</ul>`;
}

function notesView(items) {
    const notes = readNotes();
    return `<h1 id="view-title">${tr('Mis notas', 'My notes')}</h1>
        <p class="muted campus-lead">${tr('Una libreta por curso. Se guardan mientras escribes, solo en este navegador.', 'One notebook per course. They save as you type, only in this browser.')}</p>
        <div class="campus-notes">${items.map((item) => `<article class="campus-note">
            <header><img src="./media/${item.course.image}.jpg" alt="" width="56" height="40"><h2><label for="note-${item.id}">${esc(item.text.title)}</label></h2>
                <a class="link-arrow" href="${lessonHref(item.id, Math.max(item.next, 0))}">${tr('Abrir curso', 'Open course')}</a></header>
            <textarea id="note-${item.id}" data-note="${item.id}" rows="4" placeholder="${tr('Ideas, preguntas o lo que quieras recordar…', 'Ideas, questions or anything you want to remember…')}">${esc(notes[item.id] ?? '')}</textarea>
            <p class="sheet-note-status" role="status" data-note-status="${item.id}"></p>
        </article>`).join('')}</div>`;
}

// Espacio de clase: reproductor, acciones de la clase, pestañas de detalle y temario lateral.
function courseView(items, id, requested) {
    const item = items.find((entry) => entry.id === id);
    if (!item) {
        const course = findCourse(id);
        return `<div class="campus-empty is-block"><h1 id="view-title">${course ? esc(courseText(course).title) : tr('Curso no encontrado', 'Course not found')}</h1>
            <p>${course ? tr('Este curso no está en tu cuenta todavía.', 'This course is not in your account yet.') : tr('Revisa el enlace.', 'Check the link.')}</p>
            <p>${course ? `<a class="btn btn-primary btn-small" href="${link('course', course.id)}">${tr('Ver la ficha del curso', 'View the course page')}</a> ` : ''}<a class="btn btn-outline btn-small" href="#cursos">${tr('Mis cursos', 'My courses')}</a></p></div>`;
    }
    const index = requested >= 0 && requested < item.total ? requested : Math.max(item.next, 0);
    const [title, summary] = item.text.lessons[index];
    const done = item.done[index];
    const note = readNotes()[item.id] ?? '';
    return `<div class="workspace" data-course="${item.id}" data-lesson="${index}">
        <div class="ws-main">
            <ol class="breadcrumbs"><li><a href="#cursos">${tr('Mis cursos', 'My courses')}</a></li><li>${esc(item.text.title)}</li></ol>
            <div class="ws-player">
                <video id="ws-player" controls playsinline preload="metadata" poster="./media/${item.course.image}.jpg" src="${lessonVideo(item.course, index)}" aria-label="${tr('Video de la clase', 'Lesson video')}"></video>
            </div>
            <p class="ws-ended" id="ws-ended" role="status" hidden></p>
            <div class="ws-lesson-head">
                <div><p class="eyebrow-tag">${tr('Clase', 'Lesson')} ${index + 1} ${tr('de', 'of')} ${item.total} · <span id="ws-duration">—</span></p>
                    <h1 id="view-title">${esc(title)}</h1></div>
                <div class="ws-actions">
                    <a class="btn btn-outline btn-small" href="${lessonHref(item.id, index - 1)}" ${index === 0 ? 'aria-disabled="true" tabindex="-1"' : ''} data-step="prev">← ${tr('Anterior', 'Previous')}</a>
                    <button class="btn ${done ? 'btn-outline' : 'btn-primary'} btn-small" id="ws-complete" type="button" aria-pressed="${done}">${done ? `✓ ${tr('Completada', 'Completed')}` : tr('Marcar como completada', 'Mark as complete')}</button>
                    <a class="btn btn-outline btn-small" href="${lessonHref(item.id, index + 1)}" ${index === item.total - 1 ? 'aria-disabled="true" tabindex="-1"' : ''} data-step="next">${tr('Siguiente', 'Next')} →</a>
                </div>
            </div>
            ${lang() === 'en' ? '<p class="muted ws-language">Sample video in Spanish. The lesson text is available in English.</p>' : ''}
            <div class="ws-tabs" role="tablist" aria-label="${tr('Detalle de la clase', 'Lesson details')}">
                ${[['ws-resumen', tr('Resumen', 'Summary')], ['ws-notas', tr('Mis notas', 'My notes')], ['ws-curso', tr('Sobre el curso', 'About the course')]].map(([panel, label], position) =>
                    `<button type="button" role="tab" id="tab-${panel}" aria-controls="${panel}" aria-selected="${position === 0}" tabindex="${position === 0 ? 0 : -1}">${label}</button>`).join('')}
            </div>
            <section class="ws-panel" id="ws-resumen" role="tabpanel" aria-labelledby="tab-ws-resumen" tabindex="0">
                <p>${esc(summary)}</p>
                <h3>${tr('En este curso', 'In this course')}</h3>
                <p class="muted">${esc(item.text.description)}</p>
            </section>
            <section class="ws-panel" id="ws-notas" role="tabpanel" aria-labelledby="tab-ws-notas" tabindex="0" hidden>
                <label class="sr-only" for="ws-note">${tr('Mis notas del curso', 'My course notes')}</label>
                <textarea id="ws-note" data-note="${item.id}" rows="6" placeholder="${tr('Escribe lo que observaste en esta clase…', 'Write what you observed in this lesson…')}">${esc(note)}</textarea>
                <p class="sheet-note-status" role="status" data-note-status="${item.id}">${tr('Se guardan mientras escribes, solo en este navegador.', 'They save as you type, only in this browser.')}</p>
            </section>
            <section class="ws-panel" id="ws-curso" role="tabpanel" aria-labelledby="tab-ws-curso" tabindex="0" hidden>
                <dl class="sheet-stats">
                    <div><dt>${tr('Nivel', 'Level')}</dt><dd>${levelText(item.course.level)}</dd></div>
                    <div><dt>${tr('Clases', 'Lessons')}</dt><dd>${item.total}</dd></div>
                    <div><dt>${tr('Video total', 'Total video')}</dt><dd id="ws-total">—</dd></div>
                    <div><dt>${tr('Docente', 'Teacher')}</dt><dd>${esc(teacherName(item.id))}</dd></div>
                </dl>
                <p><a class="link-arrow" href="${link('course', item.id)}">${tr('Ver la ficha pública del curso', 'View the public course page')}</a></p>
            </section>
        </div>
        <aside class="ws-outline" aria-labelledby="outline-title">
            <header>${ring(item.percent, 64)}<div><h2 id="outline-title">${esc(item.text.title)}</h2><p class="muted">${tr(`${item.completed} de ${item.total} clases`, `${item.completed} of ${item.total} lessons`)}</p></div></header>
            <ol class="ws-lessons">${item.text.lessons.map(([lessonTitle], position) => `<li>
                <a href="${lessonHref(item.id, position)}" data-done="${item.done[position]}" ${position === index ? 'aria-current="step"' : ''}>
                    <span class="check-mark" aria-hidden="true">${item.done[position] ? '✓' : position + 1}</span>
                    <span class="ws-lesson-title">${item.done[position] ? `<span class="sr-only">${tr('Completada:', 'Completed:')} </span>` : ''}${esc(lessonTitle)}</span>
                    <small class="lesson-time" data-lesson-duration="${position}">—</small>
                </a></li>`).join('')}</ol>
            ${item.status === 'done'
                ? `<div class="ws-cert is-ready"><strong>${tr('Certificado disponible', 'Certificate available')}</strong><button class="btn btn-primary btn-small" type="button" data-certificate="${item.id}">${tr('Ver certificado', 'View certificate')}</button></div>`
                : `<div class="ws-cert"><strong>${tr('Certificado', 'Certificate')}</strong><span>${tr('Se desbloquea al completar', 'Unlocks after')} ${count(item.total - item.completed, 'clase más', 'clases más', 'more lesson', 'more lessons')}</span></div>`}
        </aside>
    </div>`;
}

// ── Montaje ───────────────────────────────────────────────────────────────────────────────

function renderSidebar(items, route) {
    for (const anchor of document.querySelectorAll('#campus-nav a')) {
        if (anchor.dataset.view === route.view) anchor.setAttribute('aria-current', 'page'); else anchor.removeAttribute('aria-current');
    }
    $('campus-side-courses').innerHTML = items.map((item) => `<li><a href="${lessonHref(item.id, Math.max(item.next, 0))}" ${route.view === 'curso' && route.id === item.id ? 'aria-current="page"' : ''}>
        <span>${esc(item.text.title)}</span><span class="cpl-bar" aria-hidden="true"><span style="width:${item.percent}%"></span></span></a></li>`).join('');
    $('campus-user').innerHTML = `<span class="teacher-avatar" aria-hidden="true">CD</span><span>${esc(t(demoAccount.name))}<small>${demoBadge()}</small></span>`;
}

let previousView = null;
function render({ focus = false } = {}) {
    if (!getSession()) {
        location.replace('./login.html');
        return;
    }
    const items = library();
    const route = readRoute();
    const views = { inicio: homeView, cursos: coursesView, certificados: certificatesView, notas: notesView };
    $('campus-main').innerHTML = route.view === 'curso' ? courseView(items, route.id, route.lesson) : views[route.view](items);
    $('campus-main').dataset.view = route.view;
    renderSidebar(items, route);
    setTitle(`${$('view-title')?.textContent ?? 'Campus'} · Campus`);
    if (route.view === 'inicio') watchedSeconds(items).then((seconds) => { if ($('stat-watched')) $('stat-watched').textContent = formatDuration(seconds) || '0:00'; });
    if (route.view === 'curso') setupWorkspace(items);
    if (focus || (previousView && previousView !== location.hash)) {
        $('view-title')?.setAttribute('tabindex', '-1');
        $('view-title')?.focus({ preventScroll: true });
        scrollTo({ top: 0 });
    }
    previousView = location.hash;
}

function setupWorkspace(items) {
    const root = document.querySelector('.workspace');
    if (!root) return;
    const item = items.find((entry) => entry.id === root.dataset.course);
    const index = Number(root.dataset.lesson);
    store.write(lastKey, { course: item.id, lesson: index });
    const durations = Promise.all(item.course.lessons.map((_, position) => videoDuration(lessonVideo(item.course, position))));
    durations.then((values) => {
        for (const node of root.querySelectorAll('[data-lesson-duration]')) node.textContent = formatDuration(values[node.dataset.lessonDuration]) || '—';
        if ($('ws-duration')) $('ws-duration').textContent = formatDuration(values[index]) || '—';
        if ($('ws-total')) $('ws-total').textContent = formatDuration(values.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0)) || '—';
    });

    const toggle = (value) => {
        const progress = readProgress();
        const key = `${item.id}:${index}`;
        if (value ?? !progress.has(key)) progress.add(key); else progress.delete(key);
        saveProgress(progress);
    };
    $('ws-complete').addEventListener('click', () => {
        toggle();
        render();
        $('ws-complete')?.focus();
    });
    const player = $('ws-player');
    player.addEventListener('ended', () => {
        toggle(true);
        const isLast = index === item.total - 1;
        render();
        const message = $('ws-ended');
        message.hidden = false;
        message.innerHTML = isLast
            ? `✓ ${tr('Terminaste la última clase del curso.', 'You finished the last lesson of the course.')} <a href="#certificados">${tr('Ver certificados', 'View certificates')}</a>`
            : `✓ ${tr('Clase completada.', 'Lesson completed.')} <a class="btn btn-primary btn-small" href="${lessonHref(item.id, index + 1)}">${tr('Ir a la siguiente clase', 'Go to the next lesson')} →</a>`;
    });
    player.addEventListener('error', () => {
        const message = $('ws-ended');
        message.hidden = false;
        message.textContent = tr('No se pudo cargar el video. Vuelve a abrir la clase para reintentar.', 'The video could not be loaded. Open the lesson again to retry.');
    });

    // Pestañas de detalle (Resumen, Mis notas, Sobre el curso) con flechas del teclado.
    const tablist = root.querySelector('.ws-tabs');
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const select = (tab, focus) => {
        for (const other of tabs) {
            const selected = other === tab;
            other.setAttribute('aria-selected', String(selected));
            other.tabIndex = selected ? 0 : -1;
            $(other.getAttribute('aria-controls')).hidden = !selected;
        }
        if (focus) tab.focus();
    };
    tablist.addEventListener('click', (event) => { const tab = event.target.closest('[role="tab"]'); if (tab) select(tab); });
    tablist.addEventListener('keydown', (event) => {
        const current = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
        const target = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 }[event.key];
        if (target === undefined) return;
        event.preventDefault();
        select(tabs[(target + tabs.length) % tabs.length], true);
    });
}

// Libreta: guarda la nota mientras se escribe (en el espacio de clase y en «Mis notas»).
let noteTimer;
document.addEventListener('input', (event) => {
    const area = event.target.closest('textarea[data-note]');
    if (!area) return;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => {
        const saved = saveNote(area.dataset.note, area.value);
        const status = document.querySelector(`[data-note-status="${area.dataset.note}"]`);
        if (status) status.textContent = saved ? tr('Nota guardada en este navegador.', 'Note saved in this browser.') : tr('No se pudo guardar la nota.', 'The note could not be saved.');
    }, 400);
});

// Filtros de «Mis cursos».
document.addEventListener('click', (event) => {
    const chip = event.target.closest('#course-filters [data-filter]');
    if (!chip) return;
    for (const other of chip.parentElement.children) other.setAttribute('aria-pressed', String(other === chip));
    let visible = 0;
    for (const card of document.querySelectorAll('#campus-course-grid .campus-card')) {
        card.hidden = chip.dataset.filter !== 'all' && card.dataset.status !== chip.dataset.filter;
        if (!card.hidden) visible += 1;
    }
    $('courses-empty').hidden = visible > 0;
});

// Certificado de finalización (vista previa imprimible, marcada como demostración).
document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-certificate]');
    if (!button) return;
    const course = findCourse(button.dataset.certificate);
    $('certificate-body').innerHTML = `<div class="certificate">
            <p class="certificate-brand"><span class="brand-mark" aria-hidden="true">✳</span> Solara Field School</p>
            <p class="certificate-kicker">${tr('Certificado de finalización', 'Certificate of completion')}</p>
            <p>${tr('Se certifica que', 'This certifies that')}</p>
            <p class="certificate-name">${esc(t(demoAccount.name))}</p>
            <p>${tr('completó todas las clases del curso', 'completed every lesson of the course')}</p>
            <p class="certificate-course">${esc(courseText(course).title)}</p>
            <p class="certificate-meta">${count(course.lessons.length, 'clase', 'clases', 'lesson', 'lessons')} · ${day(new Date())}</p>
            <p class="certificate-demo">${tr('DEMOSTRACIÓN · sin validez. No es una acreditación profesional oficial.', 'DEMO · not valid. It is not an official professional accreditation.')}</p>
        </div>
        <p class="certificate-actions"><button class="btn btn-primary btn-small" type="button" id="certificate-print">${tr('Imprimir o guardar en PDF', 'Print or save as PDF')}</button></p>`;
    $('certificate-dialog').showModal();
    $('certificate-print').addEventListener('click', () => print());
});
$('certificate-close').addEventListener('click', () => $('certificate-dialog').close());
$('certificate-dialog').addEventListener('click', (event) => { if (event.target === $('certificate-dialog')) $('certificate-dialog').close(); });

// Buscador del campus: cursos y clases de la cuenta.
const normalize = (value) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
function renderResults() {
    const query = normalize($('campus-q').value.trim());
    const box = $('campus-results');
    if (!query) { box.hidden = true; box.innerHTML = ''; return; }
    const matches = library().flatMap((item) => [
        ...(normalize(item.text.title).includes(query) ? [{ href: lessonHref(item.id, Math.max(item.next, 0)), title: item.text.title, meta: tr('Curso', 'Course') }] : []),
        ...item.text.lessons.map(([lessonTitle, summary], index) => (normalize(`${lessonTitle} ${summary}`).includes(query)
            ? { href: lessonHref(item.id, index), title: lessonTitle, meta: `${item.text.title} · ${tr('Clase', 'Lesson')} ${index + 1}${item.done[index] ? ' ✓' : ''}` } : null)).filter(Boolean)
    ]).slice(0, 8);
    box.hidden = false;
    box.innerHTML = matches.length
        ? `<ul>${matches.map((match) => `<li><a href="${match.href}"><strong>${esc(match.title)}</strong><small>${esc(match.meta)}</small></a></li>`).join('')}</ul>`
        : `<p>${tr('Sin resultados en tus cursos.', 'No results in your courses.')} <a href="./catalogo.html">${tr('Buscar en el catálogo', 'Search the catalog')}</a></p>`;
}
$('campus-q').addEventListener('input', renderResults);
$('campus-search').addEventListener('submit', (event) => {
    event.preventDefault();
    $('campus-results').querySelector('a')?.click();
});
$('campus-search').addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { $('campus-q').value = ''; renderResults(); }
});
$('campus-results').addEventListener('click', (event) => {
    if (event.target.closest('a[href^="#"]')) { $('campus-q').value = ''; renderResults(); }
});
document.addEventListener('click', (event) => { if (!event.target.closest('#campus-search')) $('campus-results').hidden = true; });

// Barra lateral en móvil: se abre como panel y se cierra con Escape, el fondo o al navegar.
const setMenu = (open) => {
    $('campus-menu').setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('campus-menu-open', open);
    $('campus-backdrop').hidden = !open;
    if (open) $('campus-side').querySelector('a')?.focus();
};
$('campus-menu').addEventListener('click', () => setMenu($('campus-menu').getAttribute('aria-expanded') !== 'true'));
$('campus-backdrop').addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('campus-menu-open')) { setMenu(false); $('campus-menu').focus(); }
});

$('campus-logout').addEventListener('click', () => {
    endSession();
    location.href = './login.html';
});

addEventListener('hashchange', () => {
    setMenu(false);
    render();
});
addEventListener('storage', ({ key }) => {
    if ([progressKey, 'solara-demo-session'].includes(key)) render();
});
onLanguage(() => render());
