// Campus de Solara: el área de estudio a la que se llega al iniciar sesión. Tiene su propia
// navegación (barra lateral) y un espacio de clase para ver los cursos, separado del sitio público.
// DEMOSTRACIÓN: la cuenta y sus cursos vienen de `demoAccount` (data.js). El progreso, las notas, la
// actividad, las metas y los logros son los reales de este navegador (localStorage); ver campus-activity.js.
import { demoAccount, findCourse, pathsForCourse } from './data.js';
import { $, t, tr, lang, esc, courseText, levelText, lessonVideo, videoDuration, formatDuration, readProgress, onLanguage, setTitle, getSession, endSession, link, ring, teacherName } from './ui.js';
import {
    keys, store, readActivity, addWatchSeconds, recordLesson, streaks, week, heatmap, readGoal, saveGoal,
    readPosition, savePosition, readMarks, addMark, removeMark, readSaved, toggleSaved, readPrefs, savePrefs,
    readLog, recommendations, badges, clearActivity
} from './campus-activity.js';
import { readProfile, saveProfile, resetProfile, displayName, initials, validEmail, countries, avatarColors, interestOptions, profileKey } from './profile.js';

const progressKey = 'solara-demo-progress';
const notesKey = 'solara-demo-notes';
const lastKey = 'solara-demo-last';

const saveProgress = (set) => store.write(progressKey, [...set]);
const readNotes = () => store.read(notesKey, {});
function saveNote(courseId, text) {
    const notes = readNotes();
    if (text.trim()) notes[courseId] = text; else delete notes[courseId];
    return store.write(notesKey, notes);
}

const locale = () => tr('es-CR', 'en-US');
const day = (date) => new Intl.DateTimeFormat(locale(), { dateStyle: 'long' }).format(date);
const shortDay = (date) => new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short' }).format(date);
const weekday = (date) => new Intl.DateTimeFormat(locale(), { weekday: 'short' }).format(date).replace('.', '');
const count = (n, es, esMany, en, enMany) => `${n} ${n === 1 ? tr(es, en) : tr(esMany, enMany)}`;
const minutes = (seconds) => (seconds < 60 ? `${Math.round(seconds)} s` : `${Math.round(seconds / 60)} min`);
const clock = (seconds) => formatDuration(seconds) || '0:00';
const userName = () => displayName(t(demoAccount.name));
const avatar = (extra = '') => `<span class="teacher-avatar campus-avatar ${extra}" data-color="${readProfile().color}" aria-hidden="true">${esc(initials(userName()))}</span>`;
const demoBadge = () => `<span class="demo-badge">${tr('Demostración', 'Demo')}</span>`;
const statusLabel = (status) => ({ new: tr('Sin empezar', 'Not started'), active: tr('En curso', 'In progress'), done: tr('Completado', 'Completed') })[status];
const actionLabel = (status) => (status === 'done' ? tr('Repasar', 'Review') : status === 'new' ? tr('Empezar', 'Start') : tr('Continuar', 'Continue'));
const lessonHref = (id, index, time) => `#curso/${id}/${index + 1}${time ? `/${Math.floor(time)}` : ''}`;
const typing = (target) => target.closest('input, textarea, select, [contenteditable="true"]');
const normalize = (value) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

function ago(at) {
    const rtf = new Intl.RelativeTimeFormat(tr('es', 'en'), { numeric: 'auto' });
    const seconds = (at - Date.now()) / 1000;
    for (const [unit, size] of [['day', 86400], ['hour', 3600], ['minute', 60]]) {
        if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
    }
    return tr('hace un momento', 'just now');
}

// Avisos breves (clase completada, logro obtenido…). La región es aria-live.
function toast(html, { tone = 'info' } = {}) {
    const box = $('campus-toasts');
    if (!box) return;
    const node = document.createElement('div');
    node.className = 'campus-toast';
    node.dataset.tone = tone;
    node.innerHTML = `<span>${html}</span><button type="button" aria-label="${tr('Cerrar aviso', 'Dismiss')}">✕</button>`;
    node.querySelector('button').addEventListener('click', () => node.remove());
    box.append(node);
    while (box.children.length > 3) box.firstElementChild.remove();
    setTimeout(() => node.remove(), 6000);
}

// Cursos con acceso y su avance.
function library() {
    const progress = readProgress();
    const log = readLog();
    const owned = [
        ...demoAccount.purchases.map((purchase) => ({ id: purchase.course, source: 'purchase' })),
        ...demoAccount.freeAccess.map((id) => ({ id, source: 'free' }))
    ];
    return owned.map((entry, order) => {
        const course = findCourse(entry.id);
        const done = course.lessons.map((_, index) => progress.has(`${course.id}:${index}`));
        const completed = done.filter(Boolean).length;
        const next = done.indexOf(false);
        const status = completed === 0 ? 'new' : completed === course.lessons.length ? 'done' : 'active';
        const recent = log.find((event) => event.course === course.id)?.at ?? -order;
        return { ...entry, course, text: courseText(course), done, completed, total: course.lessons.length, next, status, recent, percent: Math.round((completed / course.lessons.length) * 100) };
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
    const [view = 'inicio', id, lesson, time] = decodeURIComponent(location.hash.slice(1)).split('/');
    const views = ['inicio', 'cursos', 'progreso', 'certificados', 'notas', 'perfil', 'curso'];
    return { view: views.includes(view) ? view : 'inicio', id, lesson: Number(lesson) - 1, time: Number(time) || 0 };
}

const greeting = () => {
    const hour = new Date().getHours();
    return hour < 12 ? tr('Buenos días', 'Good morning') : hour < 19 ? tr('Buenas tardes', 'Good afternoon') : tr('Buenas noches', 'Good evening');
};

function courseCard(item) {
    return `<article class="campus-card" data-status="${item.status}" data-title="${esc(item.text.title)}" data-percent="${item.percent}" data-recent="${item.recent}">
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

function saveButton(id) {
    const saved = readSaved().includes(id);
    return `<button class="btn ${saved ? 'btn-outline' : 'btn-primary'} btn-small" type="button" data-save="${id}" aria-pressed="${saved}">${saved ? `✓ ${tr('Guardado', 'Saved')}` : `+ ${tr('Guardar', 'Save')}`}</button>`;
}

function recoCard({ course, because }) {
    const text = courseText(course);
    return `<article class="reco-card">
        <img src="./media/${course.image}.jpg" alt="" width="320" height="180" loading="lazy">
        <div class="reco-body">
            <p class="reco-why">${tr('Porque estudias', 'Because you study')} <strong>${esc(because.text.title)}</strong></p>
            <h3><a href="${link('course', course.id)}">${esc(text.title)}</a></h3>
            <p class="muted">${count(course.lessons.length, 'clase', 'clases', 'lesson', 'lessons')} · ${course.price === null ? tr('Próximamente', 'Coming soon') : levelText(course.level)}</p>
            <div class="reco-actions">${saveButton(course.id)}<a class="link-arrow" href="${link('course', course.id)}">${tr('Ver curso', 'View course')}</a></div>
        </div>
    </article>`;
}

function logText(event) {
    const course = findCourse(event.course);
    if (!course) return null;
    const text = courseText(course);
    if (event.type === 'lesson') return { icon: '✓', html: `${tr('Completaste', 'You completed')} <a href="${lessonHref(course.id, event.lesson)}">${esc(text.lessons[event.lesson]?.[0] ?? '')}</a> <small>${esc(text.title)}</small>` };
    if (event.type === 'mark') return { icon: '✎', html: `${tr('Guardaste una marca en', 'You saved a mark in')} <a href="${lessonHref(course.id, event.lesson)}">${esc(text.lessons[event.lesson]?.[0] ?? '')}</a>` };
    if (event.type === 'saved') return { icon: '+', html: `${tr('Guardaste', 'You saved')} <a href="${link('course', course.id)}">${esc(text.title)}</a> ${tr('para más adelante', 'for later')}` };
    return null;
}

function activityList(limit) {
    const entries = readLog().map((event) => ({ event, text: logText(event) })).filter((entry) => entry.text).slice(0, limit);
    if (!entries.length) return `<p class="campus-quiet">${tr('Aquí verás lo que vayas haciendo: clases completadas, marcas y cursos guardados.', 'Your activity shows up here: completed lessons, marks and saved courses.')}</p>`;
    return `<ol class="campus-feed">${entries.map(({ event, text }) => `<li><span class="feed-icon" aria-hidden="true">${text.icon}</span><span>${text.html}</span><time datetime="${new Date(event.at).toISOString()}">${ago(event.at)}</time></li>`).join('')}</ol>`;
}

function badgeTile(badge) {
    return `<li class="badge-tile" data-earned="${badge.earned}">
        <span class="badge-seal" aria-hidden="true">${badge.icon}</span>
        <strong>${esc(t(badge.title))}</strong>
        <small>${esc(t(badge.text))}</small>
        <span class="badge-state">${badge.earned ? `${tr('Obtenido', 'Earned')} · ${shortDay(new Date(badge.earnedAt))}` : `<span class="sr-only">${tr('Pendiente:', 'Locked:')} </span>${badge.progress}`}</span>
    </li>`;
}

// Tarjeta «Tu semana»: meta de clases editable, racha y los siete días de la semana.
function weekCard() {
    const goal = readGoal();
    const current = week();
    const streak = streaks();
    const percent = Math.min(100, Math.round((current.lessons / goal) * 100));
    return `<section class="campus-week" aria-labelledby="week-title">
        <div class="week-goal">
            ${ring(percent, 76)}
            <div>
                <h2 id="week-title">${tr('Tu semana', 'Your week')}</h2>
                <p class="muted">${current.lessons >= goal ? tr('Cumpliste tu meta. ¡Muy bien!', 'You reached your goal. Well done!') : tr(`${current.lessons} de ${goal} clases de tu meta`, `${current.lessons} of ${goal} lessons of your goal`)} · ${minutes(current.seconds)} ${tr('de video', 'of video')}</p>
                <div class="goal-stepper" role="group" aria-label="${tr('Meta semanal', 'Weekly goal')}">
                    <button type="button" data-goal="-1" aria-label="${tr('Bajar la meta', 'Lower the goal')}" ${goal <= 1 ? 'disabled' : ''}>−</button>
                    <output id="goal-value" aria-live="polite">${count(goal, 'clase', 'clases', 'lesson', 'lessons')} / ${tr('semana', 'week')}</output>
                    <button type="button" data-goal="1" aria-label="${tr('Subir la meta', 'Raise the goal')}" ${goal >= 14 ? 'disabled' : ''}>+</button>
                </div>
            </div>
        </div>
        <div class="week-streak" data-active="${streak.current > 0}">
            <span class="week-streak-value"><strong id="streak-value">${streak.current}</strong> ${streak.current === 1 ? tr('día', 'day') : tr('días', 'days')}</span>
            <span>${tr('de racha', 'streak')}</span>
            <small>${streak.today ? tr('Hoy ya estudiaste.', 'You studied today.') : streak.current ? tr('Estudia hoy para no perderla.', 'Study today to keep it.') : tr('Completa una clase o mira un video para empezar.', 'Complete a lesson or watch a video to start.')} ${tr('Mejor racha:', 'Best:')} ${streak.best}</small>
        </div>
        <ol class="week-days" aria-label="${tr('Días de esta semana', 'Days this week')}">${current.days.map((entry) => `<li data-active="${entry.active}" data-today="${entry.isToday}" data-future="${entry.future}">
            <span>${weekday(entry.date)}</span>
            <span class="week-dot" aria-hidden="true">${entry.lessons || (entry.active ? '•' : '')}</span>
            <span class="sr-only">${entry.active ? `${count(entry.lessons, 'clase', 'clases', 'lesson', 'lessons')}, ${minutes(entry.seconds)}` : tr('sin estudio', 'no study')}</span>
        </li>`).join('')}</ol>
    </section>`;
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
    const picks = recommendations(items, 3);
    const badgeState = badges(items).list;
    const shown = [...badgeState.filter((badge) => badge.earned).sort((a, b) => b.earnedAt - a.earnedAt), ...badgeState.filter((badge) => !badge.earned)].slice(0, 4);
    return `<section class="campus-hello">
            <div><p class="eyebrow-tag">${day(new Date())}</p>
                <h1 id="view-title">${greeting()}, ${esc(userName())}</h1>
                <p class="muted">${done ? tr(`Llevas ${done} de ${lessons} clases. Sigue a tu ritmo.`, `You have done ${done} of ${lessons} lessons. Keep your own pace.`) : tr('Todavía no empiezas ninguna clase. Te dejamos la primera lista.', 'You have not started any lesson yet. The first one is ready for you.')}</p></div>
            ${ring(percent, 84)}
        </section>
        ${resume ? `<article class="campus-resume">
            <img src="./media/${resume.item.course.image}.jpg" alt="" width="520" height="300">
            <div class="campus-resume-body">
                <p class="eyebrow-tag">${resume.item.status === 'new' ? tr('Empieza aquí', 'Start here') : tr('Continúa donde lo dejaste', 'Pick up where you left off')}</p>
                <h2>${esc(resume.item.text.title)}</h2>
                <p class="campus-resume-lesson"><span class="check-mark" aria-hidden="true">${resume.lesson + 1}</span>${tr('Clase', 'Lesson')} ${resume.lesson + 1}: ${esc(resume.item.text.lessons[resume.lesson][0])}</p>
                ${readPosition(resume.item.id, resume.lesson) > 3 ? `<p class="muted campus-resume-at">${tr('Quedaste en el minuto', 'You stopped at')} ${clock(readPosition(resume.item.id, resume.lesson))}</p>` : ''}
                <div class="campus-card-progress"><span class="cpl-bar" aria-hidden="true"><span style="width:${resume.item.percent}%"></span></span><span>${resume.item.completed}/${resume.item.total} ${tr('clases', 'lessons')}</span></div>
                <a class="btn btn-primary" href="${lessonHref(resume.item.id, resume.lesson)}">▶ ${resume.item.status === 'new' ? tr('Empezar la clase', 'Start the lesson') : tr('Continuar la clase', 'Continue the lesson')}</a>
            </div>
        </article>` : `<p class="campus-empty">${tr('Completaste todas tus clases. Puedes descargar tus certificados.', 'You completed every lesson. You can get your certificates.')} <a href="#certificados">${tr('Ver certificados', 'View certificates')}</a></p>`}
        <dl class="campus-stats">
            <div><dt>${tr('Clases completadas', 'Lessons completed')}</dt><dd>${done}<small>/${lessons}</small></dd></div>
            <div><dt>${tr('Cursos en marcha', 'Courses in progress')}</dt><dd>${items.filter((item) => item.status === 'active').length}<small>/${items.length}</small></dd></div>
            <div><dt>${tr('Video de clases completadas', 'Video of completed lessons')}</dt><dd id="stat-watched">—</dd></div>
            <div><dt>${tr('Certificados', 'Certificates')}</dt><dd>${certificates}<small>/${items.length}</small></dd></div>
        </dl>
        ${weekCard()}
        <div class="campus-section-head"><h2>${tr('Tus cursos', 'Your courses')}</h2><a class="link-arrow" href="#cursos">${tr('Ver todos', 'View all')}</a></div>
        <div class="campus-grid">${items.map(courseCard).join('')}</div>
        ${picks.length ? `<div class="campus-section-head"><div><h2>${tr('Para ti', 'For you')}</h2><p class="muted campus-sub">${tr('Cursos del catálogo con los mismos temas que estás estudiando. Guárdalos para tenerlos a mano.', 'Catalog courses on the topics you are studying. Save them to keep them close.')}</p></div><a class="link-arrow" href="./catalogo.html">${tr('Explorar el catálogo', 'Browse the catalog')}</a></div>
        <div class="reco-grid">${picks.map(recoCard).join('')}</div>` : ''}
        <div class="campus-two">
            <section aria-labelledby="feed-title"><div class="campus-section-head"><h2 id="feed-title">${tr('Actividad reciente', 'Recent activity')}</h2><a class="link-arrow" href="#progreso">${tr('Mi progreso', 'My progress')}</a></div>${activityList(5)}</section>
            <section aria-labelledby="badges-title"><div class="campus-section-head"><h2 id="badges-title">${tr('Logros', 'Achievements')}</h2><span class="muted">${badgeState.filter((badge) => badge.earned).length}/${badgeState.length}</span></div>
                <ul class="badge-grid is-compact">${shown.map(badgeTile).join('')}</ul></section>
        </div>
        ${nextSteps.length ? `<div class="campus-section-head"><h2>${tr('Siguiente en tus rutas', 'Next in your paths')}</h2></div>
        <ul class="campus-next">${nextSteps.map(({ path, course }) => `<li><a href="${link('course', course.id)}">
            <img src="./media/${course.image}.jpg" alt="" width="72" height="48"><span><strong>${esc(courseText(course).title)}</strong><small>${esc(t(path.title))}</small></span>
            <span class="status-pill" data-status="new">${course.price === null ? tr('Próximamente', 'Coming soon') : tr('Ver curso', 'View course')}</span></a></li>`).join('')}</ul>` : ''}`;
}

function coursesView(items) {
    const filters = [['all', tr('Todos', 'All'), items.length], ...['active', 'new', 'done'].map((status) => [status, statusLabel(status), items.filter((item) => item.status === status).length])];
    const saved = readSaved().map(findCourse).filter(Boolean);
    return `<div class="campus-section-head is-first">
            <h1 id="view-title">${tr('Mis cursos', 'My courses')}</h1>
            <div class="campus-toolbar">
                <div class="filter-chips" id="course-filters" role="group" aria-label="${tr('Filtrar por estado', 'Filter by status')}">${filters.map(([id, label, total], index) =>
                    `<button type="button" data-filter="${id}" aria-pressed="${index === 0}">${label} <span>${total}</span></button>`).join('')}</div>
                <label class="campus-select"><span>${tr('Ordenar', 'Sort')}</span>
                    <select id="course-sort"><option value="recent">${tr('Actividad reciente', 'Recent activity')}</option><option value="progress">${tr('Más avance', 'Most progress')}</option><option value="title">${tr('Nombre', 'Name')}</option></select></label>
            </div>
        </div>
        <div class="campus-grid" id="campus-course-grid">${[...items].sort((a, b) => b.recent - a.recent).map(courseCard).join('')}</div>
        <p class="campus-empty" id="courses-empty" hidden>${tr('No tienes cursos con este estado.', 'You have no courses with this status.')}</p>
        <div class="campus-section-head"><h2>${tr('Guardados para más adelante', 'Saved for later')}</h2><span class="muted">${saved.length}</span></div>
        ${saved.length ? `<ul class="campus-next" id="saved-list">${saved.map((course) => `<li><div class="campus-next-row">
            <a href="${link('course', course.id)}"><img src="./media/${course.image}.jpg" alt="" width="72" height="48"><span><strong>${esc(courseText(course).title)}</strong><small>${course.level ? levelText(course.level) : tr('En preparación', 'In preparation')} · ${course.price === null ? tr('Próximamente', 'Coming soon') : tr('Disponible', 'Available')}</small></span></a>
            <button class="btn btn-outline btn-small" type="button" data-save="${course.id}" aria-pressed="true" aria-label="${tr('Quitar de guardados:', 'Remove from saved:')} ${esc(courseText(course).title)}">${tr('Quitar', 'Remove')}</button></div></li>`).join('')}</ul>`
            : `<p class="campus-quiet">${tr('No tienes cursos guardados.', 'You have no saved courses.')}</p>`}
        <div class="campus-section-head"><h2>${tr('Para ti', 'For you')}</h2><a class="link-arrow" href="./catalogo.html">${tr('Explorar el catálogo', 'Browse the catalog')}</a></div>
        <div class="reco-grid">${recommendations(items, 6).map(recoCard).join('')}</div>`;
}

function progressView(items) {
    const streak = streaks();
    const current = week();
    const goal = readGoal();
    const grid = heatmap(16);
    const activity = readActivity();
    const studyDays = Object.values(activity).filter((entry) => entry.lessons > 0 || entry.seconds >= 30).length;
    const totalSeconds = Object.values(activity).reduce((sum, entry) => sum + (entry.seconds ?? 0), 0);
    const marks = readMarks();
    const notes = readNotes();
    const badgeState = badges(items).list;
    const first = grid[0][0].date;
    return `<h1 id="view-title">${tr('Mi progreso', 'My progress')}</h1>
        <p class="muted campus-lead">${tr('Tu actividad de estudio en este navegador: días con clases, tiempo de video, metas y logros.', 'Your study activity in this browser: days with lessons, video time, goals and achievements.')}</p>
        <dl class="campus-stats">
            <div><dt>${tr('Racha actual', 'Current streak')}</dt><dd>${streak.current}<small> ${streak.current === 1 ? tr('día', 'day') : tr('días', 'days')}</small></dd></div>
            <div><dt>${tr('Mejor racha', 'Best streak')}</dt><dd>${streak.best}<small> ${streak.best === 1 ? tr('día', 'day') : tr('días', 'days')}</small></dd></div>
            <div><dt>${tr('Esta semana', 'This week')}</dt><dd>${current.lessons}<small>/${goal} ${tr('clases', 'lessons')}</small></dd></div>
            <div><dt>${tr('Video visto en el campus', 'Video watched in the campus')}</dt><dd>${minutes(totalSeconds)}</dd></div>
        </dl>
        <section class="campus-panel" aria-labelledby="heat-title">
            <div class="campus-section-head is-tight"><h2 id="heat-title">${tr('Días de estudio', 'Study days')}</h2><span class="muted">${count(studyDays, 'día', 'días', 'day', 'days')} · ${tr('últimas 16 semanas', 'last 16 weeks')}</span></div>
            <div class="heatmap-wrap">
                <ol class="heatmap-rows" aria-hidden="true">${[0, 2, 4, 6].map((row) => `<li style="grid-row:${row + 1}">${weekday(grid[0][row].date)}</li>`).join('')}</ol>
                <div class="heatmap" role="img" aria-label="${tr(`Mapa de actividad desde el ${shortDay(first)}: ${studyDays} días con estudio.`, `Activity map since ${shortDay(first)}: ${studyDays} study days.`)}">
                    ${grid.map((column) => `<div class="heat-col">${column.map((cell) => `<span class="heat" data-level="${cell.level}" data-future="${cell.future}" title="${esc(`${shortDay(cell.date)} · ${count(cell.lessons, 'clase', 'clases', 'lesson', 'lessons')} · ${minutes(cell.seconds)}`)}"></span>`).join('')}</div>`).join('')}
                </div>
            </div>
            <p class="heat-legend" aria-hidden="true">${tr('Menos', 'Less')} ${[0, 1, 2, 3, 4].map((level) => `<span class="heat" data-level="${level}"></span>`).join('')} ${tr('Más', 'More')}</p>
        </section>
        <section class="campus-panel" aria-labelledby="courses-progress-title">
            <div class="campus-section-head is-tight"><h2 id="courses-progress-title">${tr('Avance por curso', 'Progress by course')}</h2></div>
            <ul class="campus-course-bars">${items.map((item) => `<li>
                <img src="./media/${item.course.image}.jpg" alt="" width="64" height="44">
                <div><a href="${lessonHref(item.id, Math.max(item.next, 0))}"><strong>${esc(item.text.title)}</strong></a>
                    <span class="cpl-bar" aria-hidden="true"><span style="width:${item.percent}%"></span></span>
                    <small>${item.completed}/${item.total} ${tr('clases', 'lessons')} · ${count(marks.filter((mark) => mark.course === item.id).length, 'marca', 'marcas', 'mark', 'marks')} · ${notes[item.id] ? tr('con notas', 'with notes') : tr('sin notas', 'no notes')}</small></div>
                <span class="status-pill" data-status="${item.status}">${item.percent}%</span>
            </li>`).join('')}</ul>
        </section>
        <section aria-labelledby="all-badges-title">
            <div class="campus-section-head"><h2 id="all-badges-title">${tr('Logros', 'Achievements')}</h2><span class="muted">${badgeState.filter((badge) => badge.earned).length}/${badgeState.length}</span></div>
            <ul class="badge-grid">${badgeState.map(badgeTile).join('')}</ul>
        </section>
        <section aria-labelledby="log-title">
            <div class="campus-section-head"><h2 id="log-title">${tr('Historial', 'History')}</h2></div>
            ${activityList(20)}
        </section>
        <p class="campus-reset"><button class="btn btn-outline btn-small" type="button" id="activity-reset">${tr('Borrar mi actividad de este navegador', 'Clear my activity in this browser')}</button>
            <small class="muted">${tr('Borra la racha, el historial, las posiciones de video y los logros. No toca tu progreso ni tus notas.', 'Clears the streak, history, video positions and achievements. Your progress and notes stay.')}</small></p>`;
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

function markItem(mark, item, { withLesson = false } = {}) {
    const lessonTitle = item.text.lessons[mark.lesson]?.[0] ?? '';
    return `<li class="mark-item" data-mark="${mark.id}">
        <a class="mark-time" href="${lessonHref(item.id, mark.lesson, mark.time)}" data-seek="${mark.time}" aria-label="${tr('Ir a', 'Go to')} ${clock(mark.time)}${withLesson ? ` · ${esc(lessonTitle)}` : ''}">${clock(mark.time)}</a>
        <span class="mark-text">${withLesson ? `<small>${tr('Clase', 'Lesson')} ${mark.lesson + 1} · ${esc(lessonTitle)}</small>` : ''}${esc(mark.text)}</span>
        <button class="icon-btn" type="button" data-remove-mark="${mark.id}" aria-label="${tr('Borrar marca', 'Delete mark')} ${clock(mark.time)}">✕</button>
    </li>`;
}

function notesView(items) {
    const notes = readNotes();
    const marks = readMarks();
    return `<div class="campus-section-head is-first"><h1 id="view-title">${tr('Mis notas', 'My notes')}</h1>
            <div class="campus-toolbar">
                <label class="campus-filter"><span class="sr-only">${tr('Buscar en mis notas', 'Search my notes')}</span><input id="notes-q" type="search" placeholder="${tr('Buscar en mis notas', 'Search my notes')}" autocomplete="off"></label>
                <button class="btn btn-outline btn-small" type="button" id="notes-export">${tr('Descargar en .txt', 'Download as .txt')}</button>
            </div></div>
        <p class="muted campus-lead">${tr('Una libreta por curso y tus marcas con tiempo de cada video. Se guardan mientras escribes, solo en este navegador.', 'One notebook per course plus your timestamped marks from each video. They save as you type, only in this browser.')}</p>
        <div class="campus-notes">${items.map((item) => {
            const own = marks.filter((mark) => mark.course === item.id).sort((a, b) => a.lesson - b.lesson || a.time - b.time);
            return `<article class="campus-note" data-note-card="${item.id}">
            <header><img src="./media/${item.course.image}.jpg" alt="" width="56" height="40"><h2><label for="note-${item.id}">${esc(item.text.title)}</label></h2>
                <a class="link-arrow" href="${lessonHref(item.id, Math.max(item.next, 0))}">${tr('Abrir curso', 'Open course')}</a></header>
            <textarea id="note-${item.id}" data-note="${item.id}" rows="4" placeholder="${tr('Ideas, preguntas o lo que quieras recordar…', 'Ideas, questions or anything you want to remember…')}">${esc(notes[item.id] ?? '')}</textarea>
            <p class="sheet-note-status" role="status" data-note-status="${item.id}"></p>
            ${own.length ? `<h3 class="mark-head">${tr('Marcas en los videos', 'Video marks')} <span>${own.length}</span></h3><ul class="mark-list">${own.map((mark) => markItem(mark, item, { withLesson: true })).join('')}</ul>`
                : `<p class="campus-quiet">${tr('Sin marcas todavía. En una clase, abre «Mis notas» y guarda lo que ves en un momento del video.', 'No marks yet. In a lesson, open “My notes” and save what you see at a moment of the video.')}</p>`}
        </article>`;
        }).join('')}</div>
        <p class="campus-empty" id="notes-empty" hidden>${tr('Ninguna nota coincide con la búsqueda.', 'No notes match your search.')}</p>`;
}

// Mi perfil: formulario editable (demostración, solo en este navegador).
function profileView() {
    const profile = readProfile();
    const prefs = readPrefs();
    const goal = readGoal();
    const updated = profile.updated ? new Intl.DateTimeFormat(locale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(profile.updated)) : null;
    const field = (id, label, input, hint = '') => `<div class="profile-field">
            <label for="${id}">${label}</label>${input}
            ${hint ? `<p class="profile-hint" id="${id}-hint">${hint}</p>` : ''}
            <p class="profile-error" id="${id}-error" hidden></p>
        </div>`;
    return `<div class="campus-section-head is-first"><div><h1 id="view-title">${tr('Mi perfil', 'My profile')}</h1>
            <p class="muted campus-sub">${tr('Cómo apareces en el campus y en tus certificados.', 'How you appear in the campus and on your certificates.')}</p></div>
            ${demoBadge()}</div>
        <p class="profile-demo" role="note">${tr('Cuenta de demostración: los cambios se guardan solo en este navegador y no se envían a ningún servidor. Aquí no se piden contraseñas ni datos de pago.', 'Demo account: changes are saved only in this browser and are not sent to any server. No passwords or payment details are asked for here.')}</p>
        <form class="profile-form" id="profile-form" novalidate>
            <section class="profile-card profile-identity" aria-labelledby="profile-id-title">
                <div class="profile-preview">
                    ${avatar('is-large')}
                    <div><p class="profile-preview-name" id="profile-preview-name">${esc(userName())}</p>
                        <p class="muted" id="profile-preview-role">${esc(profile.role || tr('Sin descripción', 'No description'))}</p></div>
                </div>
                <h2 id="profile-id-title">${tr('Datos personales', 'Personal details')}</h2>
                ${field('profile-name', tr('Nombre completo', 'Full name'), `<input id="profile-name" name="name" type="text" maxlength="60" autocomplete="name" value="${esc(profile.name)}" placeholder="${esc(t(demoAccount.name))}" aria-describedby="profile-name-hint">`, tr('Así aparece en tu saludo y en tus certificados. Si lo dejas vacío, se usa «Cuenta de demostración».', 'Shown in your greeting and on your certificates. Leave it empty to use “Demo account”.'))}
                ${field('profile-role', tr('Cómo te describes', 'How you describe yourself'), `<input id="profile-role" name="role" type="text" maxlength="60" value="${esc(profile.role)}" placeholder="${tr('Ej.: Docente de ciencias, guía de campamento', 'E.g. Science teacher, camp guide')}">`)}
                <div class="profile-row">
                    ${field('profile-email', tr('Correo', 'Email'), `<input id="profile-email" name="email" type="email" maxlength="120" autocomplete="email" value="${esc(profile.email)}" aria-describedby="profile-email-hint" required>`, tr('Solo para la demostración; no se usa para enviarte nada.', 'Demo only; nothing is sent to it.'))}
                    ${field('profile-country', tr('País', 'Country'), `<select id="profile-country" name="country">${countries.map(([code, es, en]) => `<option value="${code}" ${profile.country === code ? 'selected' : ''}>${tr(es, en)}</option>`).join('')}</select>`)}
                </div>
                ${field('profile-bio', tr('Sobre ti', 'About you'), `<textarea id="profile-bio" name="bio" rows="4" maxlength="280" aria-describedby="profile-bio-hint" placeholder="${tr('Dónde trabajas, con qué grupos, qué te gustaría lograr…', 'Where you work, with which groups, what you want to achieve…')}">${esc(profile.bio)}</textarea>`, `<span id="profile-bio-count">${profile.bio.length}</span>/280`)}
                <fieldset class="profile-colors"><legend>${tr('Color del avatar', 'Avatar color')}</legend>
                    ${avatarColors.map(([value, es, en]) => `<label class="color-swatch" data-color="${value}"><input type="radio" name="color" value="${value}" ${profile.color === value ? 'checked' : ''}><span aria-hidden="true">${esc(initials(userName()))}</span><span class="sr-only">${tr(es, en)}</span></label>`).join('')}
                </fieldset>
            </section>
            <section class="profile-card" aria-labelledby="profile-learn-title">
                <h2 id="profile-learn-title">${tr('Lo que quieres aprender', 'What you want to learn')}</h2>
                <fieldset class="profile-interests"><legend class="sr-only">${tr('Intereses', 'Interests')}</legend>
                    ${interestOptions.map((pair, index) => `<label class="interest-chip"><input type="checkbox" name="interests" value="${index}" ${profile.interests.includes(index) ? 'checked' : ''}><span>${esc(t(pair))}</span></label>`).join('')}
                </fieldset>
                <div class="profile-row">
                    ${field('profile-goal', tr('Meta semanal (clases)', 'Weekly goal (lessons)'), `<input id="profile-goal" name="goal" type="number" min="1" max="14" step="1" inputmode="numeric" value="${goal}">`, tr('Entre 1 y 14. Se ve en «Tu semana».', 'From 1 to 14. Shown in “Your week”.'))}
                    ${field('profile-speed', tr('Velocidad de video', 'Video speed'), `<select id="profile-speed" name="speed">${[0.75, 1, 1.25, 1.5, 2].map((speed) => `<option value="${speed}" ${Number(prefs.speed) === speed ? 'selected' : ''}>${String(speed).replace('.', tr(',', '.'))}×</option>`).join('')}</select>`)}
                </div>
                <label class="profile-check"><input type="checkbox" name="autoplay" ${prefs.autoplay ? 'checked' : ''}> ${tr('Pasar sola a la siguiente clase al terminar un video', 'Play the next lesson automatically when a video ends')}</label>
            </section>
            <div class="profile-actions">
                <button class="btn btn-primary" type="submit" id="profile-save">${tr('Guardar cambios', 'Save changes')}</button>
                <button class="btn btn-outline" type="button" id="profile-discard" disabled>${tr('Descartar', 'Discard')}</button>
                <p class="profile-status" id="profile-status" role="status">${updated ? `${tr('Último cambio:', 'Last change:')} ${updated}` : ''}</p>
            </div>
        </form>
        <section class="profile-card profile-account" aria-labelledby="profile-account-title">
            <h2 id="profile-account-title">${tr('Cuenta', 'Account')}</h2>
            <dl class="sheet-stats">
                <div><dt>${tr('Miembro desde', 'Member since')}</dt><dd>${day(new Date(`${demoAccount.memberSince}T12:00`))}</dd></div>
                <div><dt>${tr('Cursos', 'Courses')}</dt><dd>${demoAccount.purchases.length + demoAccount.freeAccess.length}</dd></div>
            </dl>
            <p class="muted">${tr('Los pagos y recibos están en', 'Payments and receipts are in')} <a href="./mi-cuenta.html#pagos">${tr('Cuenta y pagos', 'Account and payments')}</a>.</p>
            <p><button class="link-btn" type="button" id="profile-reset">${tr('Restablecer el perfil de demostración', 'Reset the demo profile')}</button></p>
        </section>`;
}

// Espacio de clase: reproductor, acciones de la clase, pestañas de detalle y temario lateral.
function courseView(items, id, requested) {
    const item = items.find((entry) => entry.id === id);
    if (!item) {
        const course = findCourse(id);
        return `<div class="campus-empty is-block"><h1 id="view-title">${course ? esc(courseText(course).title) : tr('Curso no encontrado', 'Course not found')}</h1>
            <p>${course ? tr('Este curso no está en tu cuenta todavía.', 'This course is not in your account yet.') : tr('Revisa el enlace.', 'Check the link.')}</p>
            <p>${course ? `<a class="btn btn-primary btn-small" href="${link('course', course.id)}">${tr('Ver la ficha del curso', 'View the course page')}</a> ${saveButton(course.id)} ` : ''}<a class="btn btn-outline btn-small" href="#cursos">${tr('Mis cursos', 'My courses')}</a></p></div>`;
    }
    const index = requested >= 0 && requested < item.total ? requested : Math.max(item.next, 0);
    const [title, summary] = item.text.lessons[index];
    const done = item.done[index];
    const note = readNotes()[item.id] ?? '';
    const prefs = readPrefs();
    const courseMarks = readMarks().filter((mark) => mark.course === item.id);
    const marks = courseMarks.filter((mark) => mark.lesson === index).sort((a, b) => a.time - b.time);
    return `<div class="workspace" data-course="${item.id}" data-lesson="${index}">
        <div class="ws-main">
            <div class="ws-crumbs"><ol class="breadcrumbs"><li><a href="#cursos">${tr('Mis cursos', 'My courses')}</a></li><li>${esc(item.text.title)}</li></ol>
                <button class="ws-tool" type="button" id="ws-focus" aria-pressed="${document.body.classList.contains('campus-focus')}" title="${tr('Atajo: F', 'Shortcut: F')}">${tr('Modo enfoque', 'Focus mode')}</button></div>
            <div class="ws-player">
                <video id="ws-player" controls playsinline preload="metadata" poster="./media/${item.course.image}.jpg" src="${lessonVideo(item.course, index)}" aria-label="${tr('Video de la clase', 'Lesson video')}"></video>
            </div>
            <div class="ws-toolbar">
                <p class="ws-resume" id="ws-resume" hidden></p>
                <label class="ws-tool"><span>${tr('Velocidad', 'Speed')}</span>
                    <select id="ws-speed">${[0.75, 1, 1.25, 1.5, 2].map((speed) => `<option value="${speed}" ${Number(prefs.speed) === speed ? 'selected' : ''}>${String(speed).replace('.', tr(',', '.'))}×</option>`).join('')}</select></label>
                <label class="ws-tool ws-switch"><input type="checkbox" id="ws-autoplay" ${prefs.autoplay ? 'checked' : ''}><span>${tr('Pasar sola a la siguiente', 'Autoplay next')}</span></label>
                <button class="ws-tool" type="button" id="ws-keys" aria-haspopup="dialog">⌨ ${tr('Atajos', 'Shortcuts')}</button>
            </div>
            <div class="ws-ended" id="ws-ended" role="status" hidden></div>
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
                ${[['ws-resumen', tr('Resumen', 'Summary')], ['ws-notas', `${tr('Mis notas', 'My notes')}${marks.length ? ` <span class="tab-count">${marks.length}</span>` : ''}`], ['ws-curso', tr('Sobre el curso', 'About the course')]].map(([panel, label], position) =>
                    `<button type="button" role="tab" id="tab-${panel}" aria-controls="${panel}" aria-selected="${position === 0}" tabindex="${position === 0 ? 0 : -1}">${label}</button>`).join('')}
            </div>
            <section class="ws-panel" id="ws-resumen" role="tabpanel" aria-labelledby="tab-ws-resumen" tabindex="0">
                <p>${esc(summary)}</p>
                <div class="ws-reflect">
                    <h3>${tr('Para practicar', 'To practice')}</h3>
                    <ol>
                        <li>${tr('Mira el video y pausa cuando veas algo que quieras recordar.', 'Watch the video and pause when you see something worth remembering.')}</li>
                        <li>${tr('Guárdalo como marca en «Mis notas» para volver a ese minuto.', 'Save it as a mark in “My notes” to come back to that minute.')}</li>
                        <li>${tr('Al terminar, escribe en una frase qué harías distinto en tu próxima salida.', 'When you finish, write one sentence on what you would do differently on your next outing.')}</li>
                    </ol>
                </div>
                <h3>${tr('En este curso', 'In this course')}</h3>
                <p class="muted">${esc(item.text.description)}</p>
            </section>
            <section class="ws-panel" id="ws-notas" role="tabpanel" aria-labelledby="tab-ws-notas" tabindex="0" hidden>
                <form class="mark-form" id="mark-form">
                    <label for="mark-text">${tr('Marca en el video', 'Video mark')} <span class="muted">· ${tr('se guarda con el minuto actual', 'saved with the current time')}</span></label>
                    <div class="mark-form-row">
                        <input id="mark-text" type="text" maxlength="280" autocomplete="off" placeholder="${tr('Lo que observas en este momento…', 'What you notice at this moment…')}">
                        <button class="btn btn-primary btn-small" type="submit" id="mark-save">${tr('Guardar en', 'Save at')} <span id="mark-time">0:00</span></button>
                    </div>
                </form>
                <ul class="mark-list" id="mark-list">${marks.map((mark) => markItem(mark, item)).join('')}</ul>
                <p class="campus-quiet" id="mark-empty" ${marks.length ? 'hidden' : ''}>${tr('Todavía no hay marcas en esta clase. Atajo: B.', 'No marks in this lesson yet. Shortcut: B.')}</p>
                <label class="ws-note-label" for="ws-note">${tr('Libreta del curso', 'Course notebook')}</label>
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
            <ol class="ws-lessons">${item.text.lessons.map(([lessonTitle], position) => {
                const lessonMarks = courseMarks.filter((mark) => mark.lesson === position).length;
                const at = readPosition(item.id, position);
                const meta = [lessonMarks ? `✎ ${lessonMarks}` : '', !item.done[position] && at > 3 ? `${tr('vas en', 'at')} ${clock(at)}` : ''].filter(Boolean).join(' · ');
                return `<li>
                <a href="${lessonHref(item.id, position)}" data-done="${item.done[position]}" ${position === index ? 'aria-current="step"' : ''}>
                    <span class="check-mark" aria-hidden="true">${item.done[position] ? '✓' : position + 1}</span>
                    <span class="ws-lesson-title">${item.done[position] ? `<span class="sr-only">${tr('Completada:', 'Completed:')} </span>` : ''}${esc(lessonTitle)}${meta ? `<small class="ws-lesson-meta">${meta}</small>` : ''}</span>
                    <small class="lesson-time" data-lesson-duration="${position}">—</small>
                </a></li>`;
            }).join('')}</ol>
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
    const streak = streaks();
    $('campus-user').innerHTML = `<a class="campus-streak" id="campus-streak" href="#progreso" data-active="${streak.today}" title="${tr('Racha de estudio', 'Study streak')}"><span aria-hidden="true">◆</span> ${streak.current}<span class="sr-only"> ${tr('días de racha', 'day streak')}</span></a>
        <a class="campus-user-link" href="#perfil" ${route.view === 'perfil' ? 'aria-current="page"' : ''}>${avatar()}<span class="campus-user-name">${esc(userName())}<small>${demoBadge()}</small></span><span class="sr-only"> · ${tr('Mi perfil', 'My profile')}</span></a>`;
}

let previousView = null;
let autoTimer = null;
let flushWatch = null;
function render({ focus = false } = {}) {
    if (!getSession()) {
        location.replace('./login.html');
        return;
    }
    clearInterval(autoTimer);
    flushWatch?.();
    flushWatch = null;
    const items = library();
    const route = readRoute();
    const views = { inicio: homeView, cursos: coursesView, progreso: progressView, certificados: certificatesView, notas: notesView, perfil: profileView };
    $('campus-main').innerHTML = route.view === 'curso' ? courseView(items, route.id, route.lesson) : views[route.view](items);
    $('campus-main').dataset.view = route.view;
    if (route.view !== 'curso') document.body.classList.remove('campus-focus');
    renderSidebar(items, route);
    setTitle(`${$('view-title')?.textContent ?? 'Campus'} · Campus`);
    if (route.view === 'inicio') watchedSeconds(items).then((seconds) => { if ($('stat-watched')) $('stat-watched').textContent = clock(seconds); });
    if (route.view === 'curso') setupWorkspace(items, route);
    const routeKey = location.hash.split('/').slice(0, 3).join('/');
    if (focus || (previousView !== null && previousView !== routeKey)) {
        $('view-title')?.setAttribute('tabindex', '-1');
        $('view-title')?.focus({ preventScroll: true });
        scrollTo({ top: 0 });
    }
    previousView = routeKey;
    announceBadges(items);
}

function announceBadges(items = library()) {
    for (const badge of badges(items).fresh) toast(`<strong>${tr('Logro obtenido', 'Achievement earned')}:</strong> ${esc(t(badge.title))}. <a href="#progreso">${tr('Ver logros', 'View achievements')}</a>`, { tone: 'badge' });
}

function setupWorkspace(items, route) {
    const root = document.querySelector('.workspace');
    if (!root) return;
    const item = items.find((entry) => entry.id === root.dataset.course);
    const index = Number(root.dataset.lesson);
    const player = $('ws-player');
    const prefs = readPrefs();
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
        const had = progress.has(key);
        const next = value ?? !had;
        if (next) progress.add(key); else progress.delete(key);
        saveProgress(progress);
        if (next !== had) recordLesson(item.id, index, next);
        return next && !had;
    };
    const completedToast = () => {
        const after = library().find((entry) => entry.id === item.id);
        toast(`✓ ${tr('Clase completada', 'Lesson completed')} · ${after.completed}/${after.total}${after.status === 'done' ? ` · <a href="#certificados">${tr('Tu certificado está listo', 'Your certificate is ready')}</a>` : ''}`, { tone: 'done' });
    };
    $('ws-complete').addEventListener('click', () => {
        const added = toggle();
        render();
        if (added) completedToast();
        $('ws-complete')?.focus();
    });

    // Velocidad, posición guardada y tiempo de estudio.
    player.playbackRate = Number(prefs.speed) || 1;
    player.addEventListener('loadedmetadata', () => { player.playbackRate = Number(readPrefs().speed) || 1; }, { once: true });
    $('ws-speed').addEventListener('change', (event) => {
        player.playbackRate = Number(event.target.value);
        savePrefs({ speed: Number(event.target.value) });
    });
    $('ws-autoplay').addEventListener('change', (event) => savePrefs({ autoplay: event.target.checked }));
    const resume = $('ws-resume');
    player.addEventListener('loadedmetadata', () => {
        const saved = readPosition(item.id, index);
        const target = route.time || (saved > 3 && saved < player.duration - 5 ? saved : 0);
        if (!target) return;
        player.currentTime = Math.min(target, Math.max(player.duration - 1, 0));
        resume.hidden = false;
        resume.innerHTML = `${route.time ? tr('Desde tu marca en', 'From your mark at') : tr('Seguimos donde quedaste:', 'Resuming where you left off:')} <strong>${clock(target)}</strong> <button class="link-btn" type="button" id="ws-restart">${tr('Empezar desde el inicio', 'Start from the beginning')}</button>`;
        $('ws-restart').addEventListener('click', () => { player.currentTime = 0; resume.hidden = true; player.focus(); });
    }, { once: true });
    let last = 0;
    let pending = 0;
    let lastSave = 0;
    const flush = () => {
        if (pending >= 1) addWatchSeconds(pending);
        pending = 0;
        if (player.currentTime > 0) savePosition(item.id, index, player.currentTime);
    };
    flushWatch = flush;
    player.addEventListener('timeupdate', () => {
        const delta = player.currentTime - last;
        if (!player.paused && delta > 0 && delta < 3) pending += delta / (player.playbackRate || 1);
        last = player.currentTime;
        if ($('mark-time')) $('mark-time').textContent = clock(player.currentTime);
        if (Date.now() - lastSave > 5000) { lastSave = Date.now(); flush(); }
    });
    player.addEventListener('seeked', () => {
        last = player.currentTime;
        if ($('mark-time')) $('mark-time').textContent = clock(player.currentTime);
    });
    player.addEventListener('pause', flush);

    player.addEventListener('ended', () => {
        flush();
        savePosition(item.id, index, player.duration);
        const added = toggle(true);
        const isLast = index === item.total - 1;
        const autoplay = readPrefs().autoplay;
        render();
        if (added) completedToast();
        const message = $('ws-ended');
        message.hidden = false;
        if (isLast) {
            message.innerHTML = `✓ ${tr('Terminaste la última clase del curso.', 'You finished the last lesson of the course.')} <a href="#certificados">${tr('Ver certificados', 'View certificates')}</a>`;
            return;
        }
        const nextHref = lessonHref(item.id, index + 1);
        message.innerHTML = `✓ ${tr('Clase completada.', 'Lesson completed.')} <a class="btn btn-primary btn-small" href="${nextHref}">${tr('Ir a la siguiente clase', 'Go to the next lesson')} →</a>
            ${autoplay ? `<span class="ws-countdown" id="ws-countdown">${tr('Empieza en', 'Starting in')} <strong id="ws-count">5</strong> s <button class="link-btn" type="button" id="ws-cancel">${tr('Cancelar', 'Cancel')}</button></span>` : ''}`;
        if (!autoplay) return;
        let seconds = 5;
        autoTimer = setInterval(() => {
            seconds -= 1;
            if ($('ws-count')) $('ws-count').textContent = seconds;
            if (seconds <= 0) { clearInterval(autoTimer); location.hash = nextHref; }
        }, 1000);
        $('ws-cancel').addEventListener('click', () => {
            clearInterval(autoTimer);
            $('ws-countdown').remove();
            message.querySelector('a')?.focus();
        });
    });
    player.addEventListener('error', () => {
        const message = $('ws-ended');
        message.hidden = false;
        message.textContent = tr('No se pudo cargar el video. Vuelve a abrir la clase para reintentar.', 'The video could not be loaded. Open the lesson again to retry.');
    });

    // Marcas con tiempo.
    $('mark-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const input = $('mark-text');
        if (!input.value.trim()) { input.focus(); input.setAttribute('aria-invalid', 'true'); return; }
        input.removeAttribute('aria-invalid');
        const mark = addMark({ course: item.id, lesson: index, time: player.currentTime, text: input.value });
        input.value = '';
        $('mark-list').insertAdjacentHTML('beforeend', markItem(mark, item));
        const list = [...$('mark-list').children].sort((a, b) => Number(a.querySelector('[data-seek]').dataset.seek) - Number(b.querySelector('[data-seek]').dataset.seek));
        $('mark-list').append(...list);
        $('mark-empty').hidden = true;
        updateMarkCount();
        toast(`✎ ${tr('Marca guardada en', 'Mark saved at')} ${clock(mark.time)}`);
        announceBadges();
        input.focus();
    });
    $('mark-text').addEventListener('focus', () => { if (!player.paused) player.pause(); });

    $('ws-focus').addEventListener('click', () => setFocusMode(!document.body.classList.contains('campus-focus')));
    $('ws-keys').addEventListener('click', () => $('keys-dialog').showModal());

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
    root.selectTab = (panel) => select($(`tab-${panel}`));
    tablist.addEventListener('click', (event) => { const tab = event.target.closest('[role="tab"]'); if (tab) select(tab); });
    tablist.addEventListener('keydown', (event) => {
        const current = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
        const target = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 }[event.key];
        if (target === undefined) return;
        event.preventDefault();
        select(tabs[(target + tabs.length) % tabs.length], true);
    });
    if (route.time) select($('tab-ws-notas'));
}

function updateMarkCount() {
    const tab = $('tab-ws-notas');
    if (!tab) return;
    const total = $('mark-list').children.length;
    tab.querySelector('.tab-count')?.remove();
    if (total) tab.insertAdjacentHTML('beforeend', ` <span class="tab-count">${total}</span>`);
}

function setFocusMode(on) {
    document.body.classList.toggle('campus-focus', on);
    $('ws-focus')?.setAttribute('aria-pressed', String(on));
    toast(on ? tr('Modo enfoque activado. Pulsa F para salir.', 'Focus mode on. Press F to exit.') : tr('Modo enfoque desactivado.', 'Focus mode off.'));
}

// Atajos de teclado: «/» abre el buscador; dentro de una clase, los del reproductor.
document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || typing(event.target) || document.querySelector('dialog[open]')) return;
    if (event.key === '/') { event.preventDefault(); $('campus-q').focus(); return; }
    const player = $('ws-player');
    if (!player) return;
    if (event.key === '?') { event.preventDefault(); $('keys-dialog').showModal(); return; }
    const onControl = event.target.closest('button, a, video');
    const playPause = () => (player.paused ? player.play().catch(() => {}) : player.pause());
    const actions = {
        k: playPause,
        ' ': onControl ? null : playPause,
        j: () => { player.currentTime = Math.max(0, player.currentTime - 10); },
        l: () => { player.currentTime = Math.min(player.duration || 0, player.currentTime + 10); },
        m: () => $('ws-complete').click(),
        n: () => { const next = document.querySelector('[data-step="next"]:not([aria-disabled])'); if (next) location.hash = next.getAttribute('href'); },
        p: () => { const prev = document.querySelector('[data-step="prev"]:not([aria-disabled])'); if (prev) location.hash = prev.getAttribute('href'); },
        f: () => setFocusMode(!document.body.classList.contains('campus-focus')),
        b: () => { document.querySelector('.workspace').selectTab('ws-notas'); $('mark-text').focus(); }
    };
    const action = actions[event.key.toLowerCase()];
    if (!action) return;
    event.preventDefault();
    action();
});

// Saltar a una marca dentro de la misma clase sin recargar el video.
document.addEventListener('click', (event) => {
    const seek = event.target.closest('#mark-list [data-seek]');
    const player = $('ws-player');
    if (!seek || !player) return;
    event.preventDefault();
    player.currentTime = Number(seek.dataset.seek);
    player.play().catch(() => {});
    player.scrollIntoView({ block: 'center', behavior: 'smooth' });
});

// Borrar una marca (en la clase o en «Mis notas»).
document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-mark]');
    if (!button) return;
    removeMark(button.dataset.removeMark);
    const row = button.closest('.mark-item');
    const list = row.parentElement;
    const focusTarget = row.nextElementSibling?.querySelector('[data-remove-mark]') ?? row.previousElementSibling?.querySelector('[data-remove-mark]');
    row.remove();
    if (list.id === 'mark-list') { $('mark-empty').hidden = list.children.length > 0; updateMarkCount(); }
    (focusTarget ?? $('mark-text') ?? $('notes-q'))?.focus();
    toast(tr('Marca borrada.', 'Mark deleted.'));
});

// Meta semanal.
document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-goal]');
    if (!button) return;
    saveGoal(readGoal() + Number(button.dataset.goal));
    render();
    (document.querySelector(`[data-goal="${button.dataset.goal}"]:not([disabled])`) ?? document.querySelector('[data-goal]:not([disabled])'))?.focus();
});

// Guardar o quitar un curso del catálogo.
document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-save]');
    if (!button) return;
    const id = button.dataset.save;
    const saved = toggleSaved(id);
    const title = courseText(findCourse(id)).title;
    render();
    (document.querySelector(`[data-save="${id}"]`) ?? $('view-title'))?.focus();
    toast(saved ? `${tr('Guardaste', 'You saved')} «${esc(title)}». <a href="#cursos">${tr('Ver guardados', 'View saved')}</a>` : `${tr('Quitaste', 'You removed')} «${esc(title)}» ${tr('de guardados.', 'from saved.')}`);
});

// Borrar la actividad del campus.
document.addEventListener('click', (event) => {
    if (!event.target.closest('#activity-reset')) return;
    if (!confirm(tr('¿Borrar tu racha, historial, posiciones de video y logros de este navegador? Tu progreso y tus notas se quedan.', 'Clear your streak, history, video positions and achievements in this browser? Your progress and notes stay.'))) return;
    clearActivity();
    render();
    toast(tr('Actividad borrada.', 'Activity cleared.'));
});

// Perfil: vista previa en vivo, contador, validación y guardado.
const profileForm = () => $('profile-form');
function profileErrors(form) {
    const errors = {};
    const email = form.elements.email.value.trim();
    if (!email) errors['profile-email'] = tr('Escribe un correo.', 'Enter an email.');
    else if (!validEmail(email)) errors['profile-email'] = tr('Revisa el correo: debe verse como nombre@dominio.com.', 'Check the email: it should look like name@domain.com.');
    const goal = Number(form.elements.goal.value);
    if (!Number.isInteger(goal) || goal < 1 || goal > 14) errors['profile-goal'] = tr('Usa un número entero entre 1 y 14.', 'Use a whole number from 1 to 14.');
    for (const id of ['profile-email', 'profile-goal']) {
        const input = $(id);
        const box = $(`${id}-error`);
        input.toggleAttribute('aria-invalid', Boolean(errors[id]));
        input.setAttribute('aria-describedby', [`${id}-hint`, errors[id] ? `${id}-error` : ''].filter(Boolean).join(' '));
        box.hidden = !errors[id];
        box.textContent = errors[id] ?? '';
    }
    return errors;
}
document.addEventListener('input', (event) => {
    const form = event.target.closest('#profile-form');
    if (!form) return;
    const name = form.elements.name.value.trim() || t(demoAccount.name);
    $('profile-preview-name').textContent = name;
    $('profile-preview-role').textContent = form.elements.role.value.trim() || tr('Sin descripción', 'No description');
    for (const node of document.querySelectorAll('.profile-preview .campus-avatar, .color-swatch > span[aria-hidden]')) node.textContent = initials(name);
    document.querySelector('.profile-preview .campus-avatar').dataset.color = form.elements.color.value;
    $('profile-bio-count').textContent = form.elements.bio.value.length;
    $('profile-discard').disabled = false;
    $('profile-status').textContent = tr('Tienes cambios sin guardar.', 'You have unsaved changes.');
    if (event.target.matches('[aria-invalid]')) profileErrors(form);
});
document.addEventListener('change', (event) => {
    if (event.target.closest('#profile-form') && event.target.name === 'color') event.target.dispatchEvent(new Event('input', { bubbles: true }));
});
document.addEventListener('submit', (event) => {
    const form = event.target.closest('#profile-form');
    if (!form) return;
    event.preventDefault();
    const errors = profileErrors(form);
    const first = Object.keys(errors)[0];
    if (first) {
        $('profile-status').textContent = tr('No se guardó: revisa los campos marcados.', 'Not saved: check the highlighted fields.');
        $(first).focus();
        return;
    }
    const data = new FormData(form);
    const saved = saveProfile({
        name: String(data.get('name')).trim(),
        role: String(data.get('role')).trim(),
        email: String(data.get('email')).trim(),
        country: String(data.get('country')),
        bio: String(data.get('bio')).trim(),
        color: String(data.get('color') || 'forest'),
        interests: data.getAll('interests').map(Number)
    });
    saveGoal(Number(data.get('goal')));
    savePrefs({ speed: Number(data.get('speed')), autoplay: data.get('autoplay') === 'on' });
    render();
    $('profile-save')?.focus();
    toast(saved ? `✓ ${tr('Perfil guardado.', 'Profile saved.')}` : tr('No se pudo guardar el perfil en este navegador.', 'The profile could not be saved in this browser.'), { tone: saved ? 'done' : 'info' });
});
document.addEventListener('click', (event) => {
    if (event.target.closest('#profile-discard')) {
        render();
        $('profile-save')?.focus();
        toast(tr('Cambios descartados.', 'Changes discarded.'));
    }
    if (event.target.closest('#profile-reset')) {
        if (!confirm(tr('¿Restablecer el perfil de demostración? Se borran el nombre, la descripción y los intereses guardados en este navegador.', 'Reset the demo profile? The name, description and interests saved in this browser are cleared.'))) return;
        resetProfile();
        render();
        toast(tr('Perfil restablecido.', 'Profile reset.'));
    }
});
// Avisa antes de salir del perfil con cambios sin guardar.
addEventListener('beforeunload', (event) => {
    if ($('profile-discard') && !$('profile-discard').disabled) event.preventDefault();
});

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

// Buscar en «Mis notas».
document.addEventListener('input', (event) => {
    if (event.target.id !== 'notes-q') return;
    const query = normalize(event.target.value.trim());
    let visible = 0;
    for (const card of document.querySelectorAll('[data-note-card]')) {
        const title = normalize(card.querySelector('h2').textContent);
        const note = normalize(card.querySelector('textarea').value);
        let marks = 0;
        for (const row of card.querySelectorAll('.mark-item')) {
            row.hidden = Boolean(query) && !normalize(row.textContent).includes(query) && !title.includes(query);
            if (!row.hidden) marks += 1;
        }
        card.hidden = Boolean(query) && !title.includes(query) && !note.includes(query) && marks === 0;
        if (!card.hidden) visible += 1;
    }
    $('notes-empty').hidden = visible > 0;
});

// Descargar todas las notas y marcas en un archivo de texto.
document.addEventListener('click', (event) => {
    if (!event.target.closest('#notes-export')) return;
    const notes = readNotes();
    const marks = readMarks();
    const text = library().map((item) => {
        const own = marks.filter((mark) => mark.course === item.id).sort((a, b) => a.lesson - b.lesson || a.time - b.time);
        return [`# ${item.text.title}`, '', notes[item.id]?.trim() || tr('(Sin notas)', '(No notes)'), '',
            ...own.map((mark) => `- ${tr('Clase', 'Lesson')} ${mark.lesson + 1}, ${clock(mark.time)}: ${mark.text}`)].join('\n');
    }).join('\n\n');
    const url = URL.createObjectURL(new Blob([`Solara Campus · ${tr('Mis notas', 'My notes')} · ${day(new Date())}\n\n${text}\n`], { type: 'text/plain;charset=utf-8' }));
    const anchor = Object.assign(document.createElement('a'), { href: url, download: 'notas-solara.txt' });
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

// Filtros y orden de «Mis cursos».
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
document.addEventListener('change', (event) => {
    if (event.target.id !== 'course-sort') return;
    const grid = $('campus-course-grid');
    const by = event.target.value;
    const value = (card) => Number(card.dataset[by === 'progress' ? 'percent' : 'recent']);
    grid.append(...[...grid.children].sort((a, b) => (by === 'title' ? a.dataset.title.localeCompare(b.dataset.title, lang()) : value(b) - value(a))));
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
            <p class="certificate-name">${esc(userName())}</p>
            <p>${tr('completó todas las clases del curso', 'completed every lesson of the course')}</p>
            <p class="certificate-course">${esc(courseText(course).title)}</p>
            <p class="certificate-meta">${count(course.lessons.length, 'clase', 'clases', 'lesson', 'lessons')} · ${day(new Date())}</p>
            <p class="certificate-demo">${tr('DEMOSTRACIÓN · sin validez. No es una acreditación profesional oficial.', 'DEMO · not valid. It is not an official professional accreditation.')}</p>
        </div>
        <p class="certificate-actions"><button class="btn btn-primary btn-small" type="button" id="certificate-print">${tr('Imprimir o guardar en PDF', 'Print or save as PDF')}</button></p>`;
    $('certificate-dialog').showModal();
    $('certificate-print').addEventListener('click', () => print());
});
for (const id of ['certificate', 'keys']) {
    $(`${id}-close`).addEventListener('click', () => $(`${id}-dialog`).close());
    $(`${id}-dialog`).addEventListener('click', (event) => { if (event.target === $(`${id}-dialog`)) $(`${id}-dialog`).close(); });
}

// Buscador del campus: cursos, clases, notas y marcas de la cuenta.
function renderResults() {
    const query = normalize($('campus-q').value.trim());
    const box = $('campus-results');
    if (!query) { box.hidden = true; box.innerHTML = ''; return; }
    const items = library();
    const notes = readNotes();
    const matches = [
        ...items.flatMap((item) => [
            ...(normalize(item.text.title).includes(query) ? [{ href: lessonHref(item.id, Math.max(item.next, 0)), title: item.text.title, meta: tr('Curso', 'Course') }] : []),
            ...item.text.lessons.map(([lessonTitle, summary], index) => (normalize(`${lessonTitle} ${summary}`).includes(query)
                ? { href: lessonHref(item.id, index), title: lessonTitle, meta: `${item.text.title} · ${tr('Clase', 'Lesson')} ${index + 1}${item.done[index] ? ' ✓' : ''}` } : null)).filter(Boolean),
            ...(notes[item.id] && normalize(notes[item.id]).includes(query) ? [{ href: '#notas', title: notes[item.id].slice(0, 70), meta: `${tr('Nota', 'Note')} · ${item.text.title}` }] : [])
        ]),
        ...readMarks().filter((mark) => normalize(mark.text).includes(query)).map((mark) => {
            const item = items.find((entry) => entry.id === mark.course);
            return item ? { href: lessonHref(item.id, mark.lesson, mark.time), title: mark.text, meta: `${tr('Marca', 'Mark')} ${clock(mark.time)} · ${item.text.lessons[mark.lesson]?.[0] ?? ''}` } : null;
        }).filter(Boolean)
    ].slice(0, 8);
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

addEventListener('pagehide', () => flushWatch?.());
addEventListener('hashchange', () => {
    setMenu(false);
    render();
});
addEventListener('storage', ({ key }) => {
    if ([progressKey, 'solara-demo-session', keys.saved, keys.goal, keys.marks, profileKey].includes(key)) render();
});
onLanguage(() => render());
