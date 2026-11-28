// Panel «Mi cuenta» de un cliente que ya compró cursos, organizado en pestañas.
// DEMOSTRACIÓN: la cuenta y sus pagos vienen de `demoAccount` (data.js). El progreso de las clases
// y las notas son los reales de este navegador (localStorage). Con cuentas reales, los mismos
// números saldrían de cloudflare/schema.sql.
import { demoAccount, findCourse, paths, pathsForCourse } from './data.js';
import { readProfile, displayName, countries, interestOptions, avatarMarkup } from './profile.js';
import { $, t, tr, esc, courseText, levelText, lessonVideo, videoDuration, formatDuration, readProgress, onLanguage, setTitle, getSession, endSession, link, ring } from './ui.js';

const money = (amount) => new Intl.NumberFormat(tr('es-CR', 'en-US'), { style: 'currency', currency: 'USD', currencyDisplay: 'code', maximumFractionDigits: 2 }).format(amount);
const day = (iso) => new Intl.DateTimeFormat(tr('es-CR', 'en-US'), { dateStyle: 'medium' }).format(new Date(`${iso}T12:00:00`));
const count = (n, es, esMany, en, enMany) => `${n} ${n === 1 ? tr(es, en) : tr(esMany, enMany)}`;
const demoBadge = () => `<span class="demo-badge">${tr('Demostración', 'Demo')}</span>`;

const progressKey = 'solara-demo-progress';
const notesKey = 'solara-demo-notes';

function saveProgress(set) {
    try { localStorage.setItem(progressKey, JSON.stringify([...set])); } catch { /* sin almacenamiento */ }
}
function readNotes() {
    try { return JSON.parse(localStorage.getItem(notesKey)) ?? {}; } catch { return {}; }
}
function saveNote(courseId, text) {
    const notes = readNotes();
    if (text.trim()) notes[courseId] = text; else delete notes[courseId];
    try { localStorage.setItem(notesKey, JSON.stringify(notes)); return true; } catch { return false; }
}

// Pestañas del panel. El id es también el ancla de la dirección (#mis-cursos, #progreso/campo…).
const tabs = [
    ['resumen', 'Resumen', 'Overview'],
    ['mis-cursos', 'Mis cursos', 'My courses'],
    ['progreso', 'Hoja de progreso', 'Progress sheet'],
    ['rutas', 'Rutas', 'Paths'],
    ['certificados', 'Certificados', 'Certificates'],
    ['pagos', 'Pagos', 'Payments'],
    ['perfil', 'Perfil', 'Profile']
];

function readHash() {
    const [tab, course] = decodeURIComponent(location.hash.slice(1)).split('/');
    return { tab: tabs.some(([id]) => id === tab) ? tab : 'resumen', course };
}

// Cursos con acceso: comprados primero y luego los de acceso gratuito.
function library() {
    const progress = readProgress();
    const owned = [
        ...demoAccount.purchases.map((purchase) => ({ id: purchase.course, source: 'purchase', since: purchase.date, order: purchase.order })),
        ...demoAccount.freeAccess.map((id) => ({ id, source: 'free', since: demoAccount.memberSince }))
    ];
    return owned.map((entry) => {
        const course = findCourse(entry.id);
        const done = course.lessons.map((_, index) => progress.has(`${course.id}:${index}`));
        const completed = done.filter(Boolean).length;
        const next = done.indexOf(false);
        const status = completed === 0 ? 'new' : completed === course.lessons.length ? 'done' : 'active';
        return { ...entry, course, done, completed, total: course.lessons.length, next, status, percent: Math.round((completed / course.lessons.length) * 100) };
    });
}

const statusLabel = (status) => ({ new: tr('Sin empezar', 'Not started'), active: tr('En curso', 'In progress'), done: tr('Completado', 'Completed') })[status];
const actionLabel = (status) => status === 'done' ? tr('Repasar', 'Review') : status === 'new' ? tr('Empezar', 'Start') : tr('Continuar', 'Continue');
const courseHref = (item, lesson = item.next) => `./campus.html#curso/${item.id}/${Math.max(lesson, 0) + 1}`;

async function watchedSeconds(items) {
    const durations = await Promise.all(items.flatMap((item) => item.course.lessons.map((_, index) => item.done[index] ? videoDuration(lessonVideo(item.course, index)) : 0)));
    return durations.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
}

function renderSignedOut() {
    setTitle(tr('Mi cuenta', 'My account'));
    $('account-page').innerHTML = `<section class="container auth-page"><div class="auth-card">
        <h1>${tr('Mi cuenta', 'My account')}</h1>
        <p class="auth-lead">${tr('Inicia sesión para ver tus cursos, tu progreso y tus compras.', 'Sign in to see your courses, your progress and your purchases.')}</p>
        <a class="btn btn-primary auth-demo" href="./login.html">${tr('Iniciar sesión', 'Sign in')}</a>
    </div></section>`;
}

function overviewPanel(items, totals) {
    const resume = items.find((item) => item.status === 'active') ?? items.find((item) => item.status === 'new');
    return `<h2 id="summary-heading">${tr('Resumen', 'Overview')}</h2>
        <dl class="stat-cards">
            <div><dt>${tr('Cursos activos', 'Active courses')}</dt><dd>${items.length}</dd><small>${demoAccount.purchases.length} ${tr('comprados', 'purchased')} · ${demoAccount.freeAccess.length} ${tr('gratis', 'free')}</small></div>
            <div><dt>${tr('Clases completadas', 'Lessons completed')}</dt><dd>${totals.done}<span>/${totals.lessons}</span></dd><small><progress max="${totals.lessons}" value="${totals.done}"></progress></small></div>
            <div><dt>${tr('Progreso general', 'Overall progress')}</dt><dd>${totals.percent}%</dd><small>${count(totals.finished, 'curso completado', 'cursos completados', 'course completed', 'courses completed')}</small></div>
            <div><dt>${tr('Tiempo de video visto', 'Video time watched')}</dt><dd id="stat-watched">—</dd><small>${tr('según las clases completadas', 'based on completed lessons')}</small></div>
            <div><dt>${tr('Total pagado', 'Total paid')}</dt><dd>${money(totals.paid)}</dd><small>${count(demoAccount.purchases.length, 'pedido', 'pedidos', 'order', 'orders')} ${demoBadge()}</small></div>
        </dl>
        ${resume ? `<article class="resume-card">
            <img src="./media/${resume.course.image}.jpg" alt="" width="200" height="120">
            <div>
                <p class="eyebrow-tag">${resume.status === 'new' ? tr('Empieza aquí', 'Start here') : tr('Continúa donde lo dejaste', 'Pick up where you left off')}</p>
                <h3>${esc(courseText(resume.course).title)}</h3>
                <p class="muted">${tr('Clase', 'Lesson')} ${resume.next + 1}: ${esc(courseText(resume.course).lessons[resume.next][0])}</p>
                <div class="resume-actions">
                    <a class="btn btn-primary btn-small" href="${courseHref(resume)}">${actionLabel(resume.status)}</a>
                    <a class="btn btn-outline btn-small" href="#progreso/${resume.id}">${tr('Ver hoja de progreso', 'View progress sheet')}</a>
                </div>
            </div>
        </article>` : `<p class="account-empty">${tr('Completaste todas tus clases. ¡Buen trabajo!', 'You completed all your lessons. Great work!')}</p>`}
        <h3 class="account-sub">${tr('Tu avance por curso', 'Your progress by course')}</h3>
        <ul class="course-progress-list">${items.map((item) => `<li>
            <a href="#progreso/${item.id}">
                <img src="./media/${item.course.image}.jpg" alt="" width="56" height="40">
                <span class="cpl-title">${esc(courseText(item.course).title)}<small>${item.completed}/${item.total} ${tr('clases', 'lessons')} · ${statusLabel(item.status)}</small></span>
                <span class="cpl-bar" aria-hidden="true"><span style="width:${item.percent}%"></span></span>
                <strong>${item.percent}%</strong>
            </a>
        </li>`).join('')}</ul>
        <h3 class="account-sub">${tr('Guardados para más adelante', 'Saved for later')}</h3>
        <ul class="chip-links">${demoAccount.wishlist.map((id) => `<li><a href="${link('course', id)}">${esc(courseText(findCourse(id)).title)}</a></li>`).join('')}</ul>`;
}

function coursesPanel(items) {
    const filters = [['all', tr('Todos', 'All'), items.length], ...['active', 'new', 'done'].map((status) => [status, statusLabel(status), items.filter((item) => item.status === status).length])];
    return `<div class="panel-head">
            <h2 id="courses-heading">${tr('Mis cursos', 'My courses')}</h2>
            <div class="filter-chips" role="group" aria-label="${tr('Filtrar por estado', 'Filter by status')}">${filters.map(([id, label, total], index) =>
                `<button type="button" data-filter="${id}" aria-pressed="${index === 0}">${label} <span>${total}</span></button>`).join('')}</div>
        </div>
        <div class="table-wrap"><table class="data-table">
            <caption class="sr-only">${tr('Cursos con acceso y su progreso', 'Courses you can access and their progress')}</caption>
            <thead><tr><th scope="col">${tr('Curso', 'Course')}</th><th scope="col">${tr('Acceso', 'Access')}</th><th scope="col">${tr('Progreso', 'Progress')}</th><th scope="col">${tr('Estado', 'Status')}</th><th scope="col"><span class="sr-only">${tr('Acciones', 'Actions')}</span></th></tr></thead>
            <tbody>${items.map((item) => `<tr data-status="${item.status}">
                <th scope="row"><div class="cell-course"><img src="./media/${item.course.image}.jpg" alt="" width="56" height="40"><span>${esc(courseText(item.course).title)}<small>${levelText(item.course.level)} · ${item.total} ${tr('clases', 'lessons')}</small></span></div></th>
                <td data-label="${tr('Acceso', 'Access')}">${item.source === 'purchase' ? tr('Comprado', 'Purchased') : tr('Clases gratuitas', 'Free lessons')}<small>${tr('desde', 'since')} ${day(item.since)}</small></td>
                <td data-label="${tr('Progreso', 'Progress')}"><div class="cell-progress"><progress max="${item.total}" value="${item.completed}" aria-label="${item.percent}%"></progress><span>${item.completed}/${item.total}</span></div></td>
                <td data-label="${tr('Estado', 'Status')}"><span class="status-pill" data-status="${item.status}">${statusLabel(item.status)}</span></td>
                <td><div class="row-actions"><a class="btn btn-outline btn-small" href="#progreso/${item.id}">${tr('Progreso', 'Progress')}</a><a class="btn btn-primary btn-small" href="${courseHref(item)}">${actionLabel(item.status)}</a></div></td>
            </tr>`).join('')}</tbody>
        </table></div>
        <p class="account-empty" id="courses-empty" hidden>${tr('No tienes cursos con este estado.', 'You have no courses with this status.')}</p>`;
}

function sheetPanel(items, selectedId) {
    const item = items.find((entry) => entry.id === selectedId) ?? items.find((entry) => entry.status === 'active') ?? items[0];
    const text = courseText(item.course);
    const note = readNotes()[item.id] ?? '';
    const nextInPaths = pathsForCourse(item.id).map((path) => {
        const position = path.courses.indexOf(item.id);
        const nextId = path.courses[position + 1];
        return nextId ? { path, course: findCourse(nextId) } : null;
    }).filter(Boolean);
    return `<h2 id="sheet-heading">${tr('Hoja de progreso', 'Progress sheet')}</h2>
        <div class="sheet-layout">
            <div class="sheet-picker" role="group" aria-label="${tr('Elige un curso', 'Choose a course')}">${items.map((entry) => `
                <a href="#progreso/${entry.id}" ${entry.id === item.id ? 'aria-current="true"' : ''}>
                    <span>${esc(courseText(entry.course).title)}</span>
                    <span class="cpl-bar" aria-hidden="true"><span style="width:${entry.percent}%"></span></span>
                    <small>${entry.completed}/${entry.total} · ${statusLabel(entry.status)}</small>
                </a>`).join('')}
            </div>
            <article class="sheet" data-course="${item.id}">
                <header class="sheet-head">
                    <img src="./media/${item.course.image}.jpg" alt="" width="160" height="100">
                    <div>
                        <p class="eyebrow-tag">${item.source === 'purchase' ? `${tr('Comprado', 'Purchased')} · ${item.order}` : tr('Clases gratuitas', 'Free lessons')}</p>
                        <h3>${esc(text.title)}</h3>
                        <p class="muted">${levelText(item.course.level)} · ${tr('acceso desde', 'access since')} ${day(item.since)}</p>
                    </div>
                    ${ring(item.percent, 76)}
                </header>
                <dl class="sheet-stats">
                    <div><dt>${tr('Clases completadas', 'Lessons completed')}</dt><dd>${item.completed}/${item.total}</dd></div>
                    <div><dt>${tr('Tiempo visto', 'Time watched')}</dt><dd><span id="sheet-watched">—</span> <small>${tr('de', 'of')} <span id="sheet-total">—</span></small></dd></div>
                    <div><dt>${tr('Próxima clase', 'Next lesson')}</dt><dd>${item.next >= 0 ? esc(text.lessons[item.next][0]) : tr('Ninguna: terminaste', 'None: you finished')}</dd></div>
                    <div><dt>${tr('Certificado', 'Certificate')}</dt><dd>${item.status === 'done' ? tr('Disponible', 'Available') : `${item.total - item.completed === 1 ? tr('Falta', 'Remaining:') : tr('Faltan', 'Remaining:')} ${count(item.total - item.completed, 'clase', 'clases', 'lesson', 'lessons')}`}</dd></div>
                </dl>
                <h4 class="sheet-sub">${tr('Clases', 'Lessons')}</h4>
                <ol class="lesson-checklist">${item.course.lessons.map((_, index) => {
                    const [title, summary] = text.lessons[index];
                    const done = item.done[index];
                    return `<li data-done="${done}">
                        <span class="check-mark" aria-hidden="true">${done ? '✓' : index + 1}</span>
                        <div><strong>${esc(title)}</strong><small>${esc(summary)}</small></div>
                        <span class="lesson-time" data-lesson-duration="${index}">—</span>
                        <span class="status-pill" data-status="${done ? 'done' : 'new'}">${done ? tr('Completada', 'Completed') : tr('Pendiente', 'Pending')}</span>
                        <div class="row-actions">
                            <a class="btn btn-outline btn-small" href="${courseHref(item, index)}">${done ? tr('Repasar', 'Review') : tr('Ver clase', 'Watch')}</a>
                            <button class="btn btn-ghost btn-small" type="button" data-toggle-lesson="${index}">${done ? tr('Marcar pendiente', 'Mark as pending') : tr('Marcar completada', 'Mark as complete')}</button>
                        </div>
                    </li>`;
                }).join('')}</ol>
                <h4 class="sheet-sub"><label for="course-note">${tr('Mis notas del curso', 'My course notes')}</label></h4>
                <textarea id="course-note" rows="4" placeholder="${tr('Escribe ideas, preguntas o lo que quieras recordar de este curso…', 'Write ideas, questions or anything you want to remember from this course…')}">${esc(note)}</textarea>
                <p class="sheet-note-status" id="note-status" role="status">${tr('Las notas se guardan solo en este navegador.', 'Notes are saved only in this browser.')}</p>
                ${nextInPaths.length ? `<h4 class="sheet-sub">${tr('Después de este curso', 'After this course')}</h4>
                <ul class="chip-links">${nextInPaths.map(({ path, course }) => `<li><a href="${link('course', course.id)}">${esc(courseText(course).title)} <small>· ${esc(t(path.title))}</small></a></li>`).join('')}</ul>` : ''}
            </article>
        </div>`;
}

function pathsPanel(items) {
    const ownedIds = items.map((item) => item.id);
    const pathProgress = paths.filter((path) => path.courses.some((id) => ownedIds.includes(id))).map((path) => {
        const owned = path.courses.filter((id) => ownedIds.includes(id));
        const done = owned.filter((id) => items.find((item) => item.id === id).status === 'done').length;
        return { path, owned: owned.length, done, total: path.courses.length };
    });
    return `<h2 id="paths-heading">${tr('Rutas en las que avanzas', 'Paths you are progressing in')}</h2>
        <ul class="path-progress">${pathProgress.map(({ path, owned, done, total }) => `<li>
            <a href="${link('path', path.id)}">${esc(t(path.title))}</a>
            <progress max="${total}" value="${done}"></progress>
            <span>${done}/${total} ${tr('cursos completados', 'courses completed')} · ${owned} ${tr('con acceso', 'with access')}</span>
        </li>`).join('')}</ul>`;
}

function certificatesPanel(items) {
    return `<h2 id="certificates-heading">${tr('Certificados de finalización', 'Certificates of completion')}</h2>
        <ul class="certificate-list">${items.map((item) => `<li data-ready="${item.status === 'done'}">
            <strong>${esc(courseText(item.course).title)}</strong>
            <progress max="${item.total}" value="${item.completed}" aria-label="${item.percent}%"></progress>
            <span>${item.status === 'done' ? tr('Disponible: completaste todas las clases', 'Available: you completed every lesson') : `${tr('Disponible al completar', 'Available when you complete')} ${count(item.total - item.completed, 'clase más', 'clases más', 'more lesson', 'more lessons')}`}</span>
        </li>`).join('')}</ul>
        <p class="muted">${tr('Es un certificado de finalización, no una acreditación profesional oficial.', 'This is a certificate of completion, not an official professional accreditation.')}</p>`;
}

function paymentsPanel(paid) {
    return `<h2 id="payments-heading">${tr('Historial de pagos', 'Payment history')} ${demoBadge()}</h2>
        <div class="table-wrap"><table class="data-table">
            <caption class="sr-only">${tr('Pedidos y pagos', 'Orders and payments')}</caption>
            <thead><tr><th scope="col">${tr('Fecha', 'Date')}</th><th scope="col">${tr('Pedido', 'Order')}</th><th scope="col">${tr('Curso', 'Course')}</th><th scope="col">${tr('Medio', 'Method')}</th><th scope="col">${tr('Monto', 'Amount')}</th><th scope="col">${tr('Estado', 'Status')}</th></tr></thead>
            <tbody>${demoAccount.purchases.map((purchase) => `<tr>
                <td data-label="${tr('Fecha', 'Date')}">${day(purchase.date)}</td>
                <th scope="row" data-label="${tr('Pedido', 'Order')}">${purchase.order}</th>
                <td data-label="${tr('Curso', 'Course')}">${esc(courseText(findCourse(purchase.course)).title)}</td>
                <td data-label="${tr('Medio', 'Method')}">${purchase.method}</td>
                <td data-label="${tr('Monto', 'Amount')}">${money(purchase.amount)}</td>
                <td data-label="${tr('Estado', 'Status')}"><span class="status-pill" data-status="done">${tr('Pagado', 'Paid')}</span></td>
            </tr>`).join('')}</tbody>
            <tfoot><tr><th scope="row" colspan="4">${tr('Total', 'Total')}</th><td colspan="2">${money(paid)}</td></tr></tfoot>
        </table></div>
        <p class="muted">${tr('Pagos de demostración: no ocurrieron. Con cuentas reales, aquí aparecerán los recibos de PayPal.', 'Demo payments: they did not happen. With real accounts, PayPal receipts will appear here.')}</p>`;
}

function profilePanel(name) {
    const profile = readProfile();
    const country = countries.find(([code]) => code === profile.country);
    return `<h2 id="profile-heading">${tr('Perfil', 'Profile')}</h2>
        <dl class="profile-list">
            <div><dt>${tr('Nombre', 'Name')}</dt><dd>${esc(name)}</dd></div>
            ${profile.role ? `<div><dt>${tr('Descripción', 'Description')}</dt><dd>${esc(profile.role)}</dd></div>` : ''}
            <div><dt>${tr('Correo', 'Email')}</dt><dd>${esc(profile.email)}</dd></div>
            <div><dt>${tr('País', 'Country')}</dt><dd>${country ? tr(country[1], country[2]) : '—'}</dd></div>
            ${profile.interests.length ? `<div><dt>${tr('Intereses', 'Interests')}</dt><dd>${profile.interests.map((index) => esc(t(interestOptions[index] ?? ''))).filter(Boolean).join(', ')}</dd></div>` : ''}
            <div><dt>${tr('Idioma', 'Language')}</dt><dd>${tr('Español', 'English')}</dd></div>
            <div><dt>${tr('Miembro desde', 'Member since')}</dt><dd>${day(demoAccount.memberSince)}</dd></div>
        </dl>
        <p><a class="btn btn-primary btn-small" href="./campus.html#perfil">${tr('Editar mi perfil', 'Edit my profile')}</a></p>
        <p class="muted">${tr('Cuenta de demostración: el perfil se guarda solo en este navegador.', 'Demo account: the profile is saved only in this browser.')}</p>`;
}

function render() {
    if (!getSession()) return renderSignedOut();
    setTitle(tr('Mi cuenta', 'My account'));
    const items = library();
    const lessons = items.reduce((sum, item) => sum + item.total, 0);
    const done = items.reduce((sum, item) => sum + item.completed, 0);
    const totals = {
        lessons, done,
        percent: lessons ? Math.round((done / lessons) * 100) : 0,
        finished: items.filter((item) => item.status === 'done').length,
        paid: demoAccount.purchases.filter((purchase) => purchase.status === 'paid').reduce((sum, purchase) => sum + purchase.amount, 0)
    };
    const name = displayName(t(demoAccount.name));
    const { tab, course } = readHash();
    const panels = {
        resumen: overviewPanel(items, totals),
        'mis-cursos': coursesPanel(items),
        progreso: sheetPanel(items, course),
        rutas: pathsPanel(items),
        certificados: certificatesPanel(items),
        pagos: paymentsPanel(totals.paid),
        perfil: profilePanel(name)
    };

    $('account-page').innerHTML = `
    <section class="account-hero"><div class="container">
        <div class="account-id">
            ${avatarMarkup({ name, color: readProfile().color, photo: readProfile().photo, extra: 'account-avatar' })}
            <div><p class="eyebrow-tag">${tr('Mi cuenta', 'My account')} ${demoBadge()}</p>
                <h1>${tr('Hola', 'Hello')}, ${esc(name)}</h1>
                <p class="muted">${esc(readProfile().email)} · ${tr('Miembro desde', 'Member since')} ${day(demoAccount.memberSince)}</p></div>
        </div>
        <div class="account-hero-side">
            ${ring(totals.percent, 64)}
            <p><strong>${tr('Progreso general', 'Overall progress')}</strong><span>${totals.done}/${totals.lessons} ${tr('clases', 'lessons')}</span></p>
            <a class="btn btn-primary btn-small" href="./campus.html">${tr('Ir al campus', 'Go to campus')}</a>
            <button class="btn btn-outline btn-small" id="logout" type="button">${tr('Cerrar sesión', 'Sign out')}</button>
        </div>
    </div></section>

    <div class="account-tabs-bar"><div class="container">
        <div class="account-tabs" role="tablist" aria-label="${tr('Secciones de la cuenta', 'Account sections')}">${tabs.map(([id, es, en]) =>
            `<button type="button" role="tab" id="tab-${id}" aria-controls="${id}" aria-selected="${id === tab}" tabindex="${id === tab ? 0 : -1}">${tr(es, en)}</button>`).join('')}</div>
    </div></div>

    <div class="container account-panels">${tabs.map(([id]) =>
        `<section class="account-panel" id="${id}" role="tabpanel" aria-labelledby="tab-${id}" tabindex="0" ${id === tab ? '' : 'hidden'}>${panels[id]}</section>`).join('')}
    </div>`;

    setupInteractions(items);
    watchedSeconds(items).then((seconds) => {
        const node = $('stat-watched');
        if (node) node.textContent = formatDuration(seconds) || '0:00';
    });
    fillSheetDurations(items);
}

async function fillSheetDurations(items) {
    const sheet = document.querySelector('.sheet');
    if (!sheet) return;
    const item = items.find((entry) => entry.id === sheet.dataset.course);
    const durations = await Promise.all(item.course.lessons.map((_, index) => videoDuration(lessonVideo(item.course, index))));
    const valid = (value) => Number.isFinite(value) ? value : 0;
    for (const node of sheet.querySelectorAll('[data-lesson-duration]')) node.textContent = formatDuration(durations[node.dataset.lessonDuration]) || '—';
    const total = durations.reduce((sum, value) => sum + valid(value), 0);
    const watched = durations.reduce((sum, value, index) => sum + (item.done[index] ? valid(value) : 0), 0);
    if ($('sheet-watched')) $('sheet-watched').textContent = formatDuration(watched) || '0:00';
    if ($('sheet-total')) $('sheet-total').textContent = formatDuration(total) || '—';
}

// Cambia de pestaña sin recargar; la dirección guarda la pestaña para compartirla o volver atrás.
function showTab(id, { focus = false } = {}) {
    for (const [tabId] of tabs) {
        const button = $(`tab-${tabId}`);
        const selected = tabId === id;
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
        $(tabId).hidden = !selected;
    }
    if (focus) $(`tab-${id}`).focus();
    $(`tab-${id}`).scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

function setupInteractions(items) {
    $('logout').addEventListener('click', () => {
        endSession();
        location.href = './login.html';
    });

    const tablist = document.querySelector('.account-tabs');
    tablist.addEventListener('click', (event) => {
        const button = event.target.closest('[role="tab"]');
        if (!button) return;
        const id = button.getAttribute('aria-controls');
        history.pushState(null, '', `#${id}`);
        showTab(id);
    });
    tablist.addEventListener('keydown', (event) => {
        const order = tabs.map(([id]) => id);
        const current = order.indexOf(readHash().tab);
        const target = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: order.length - 1 }[event.key];
        if (target === undefined) return;
        event.preventDefault();
        const id = order[(target + order.length) % order.length];
        history.replaceState(null, '', `#${id}`);
        showTab(id, { focus: true });
    });

    // Filtros por estado en «Mis cursos».
    const chips = document.querySelector('#mis-cursos .filter-chips');
    chips?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-filter]');
        if (!button) return;
        for (const chip of chips.querySelectorAll('button')) chip.setAttribute('aria-pressed', String(chip === button));
        const filter = button.dataset.filter;
        let visible = 0;
        for (const row of document.querySelectorAll('#mis-cursos tbody tr')) {
            row.hidden = filter !== 'all' && row.dataset.status !== filter;
            if (!row.hidden) visible += 1;
        }
        $('courses-empty').hidden = visible > 0;
    });

    // Marcar clases desde la hoja de progreso (el mismo registro que usa el reproductor del curso).
    document.querySelector('.lesson-checklist')?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-toggle-lesson]');
        if (!button) return;
        const courseId = document.querySelector('.sheet').dataset.course;
        const key = `${courseId}:${button.dataset.toggleLesson}`;
        const progress = readProgress();
        if (progress.has(key)) progress.delete(key); else progress.add(key);
        saveProgress(progress);
        const index = button.dataset.toggleLesson;
        render();
        document.querySelector(`[data-toggle-lesson="${index}"]`)?.focus();
    });

    // Notas del curso, guardadas mientras se escribe.
    const note = $('course-note');
    let timer;
    note?.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            const saved = saveNote(document.querySelector('.sheet').dataset.course, note.value);
            $('note-status').textContent = saved
                ? tr('Nota guardada en este navegador.', 'Note saved in this browser.')
                : tr('No se pudo guardar la nota en este navegador.', 'The note could not be saved in this browser.');
        }, 400);
    });
}

onLanguage(render);
// Anclas como #progreso/campo cambian de curso en la hoja; #pagos cambia de pestaña.
addEventListener('hashchange', () => {
    if (!getSession()) return;
    const { tab, course } = readHash();
    const sheet = document.querySelector('.sheet');
    if (tab === 'progreso' && course && sheet?.dataset.course !== course) {
        render();
        $('tab-progreso').focus({ preventScroll: true });
    } else if ($(`tab-${tab}`)) {
        showTab(tab);
    }
});
addEventListener('storage', ({ key }) => {
    if (key === progressKey || key === 'solara-demo-session') render();
});
