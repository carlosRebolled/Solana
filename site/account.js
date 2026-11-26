// Panel «Mi cuenta» de un cliente que ya compró cursos.
// DEMOSTRACIÓN: la cuenta y sus pagos vienen de `demoAccount` (data.js); el progreso de las clases
// es el real de este navegador. Con cuentas reales, los mismos números salen de cloudflare/schema.sql.
import { demoAccount, findCourse, paths } from './data.js';
import { $, t, tr, esc, courseText, levelText, lessonVideo, videoDuration, formatDuration, readProgress, onLanguage, setTitle, getSession, endSession, link } from './ui.js';

const money = (amount) => new Intl.NumberFormat(tr('es-CR', 'en-US'), { style: 'currency', currency: 'USD', currencyDisplay: 'code', maximumFractionDigits: 2 }).format(amount);
const day = (iso) => new Intl.DateTimeFormat(tr('es-CR', 'en-US'), { dateStyle: 'medium' }).format(new Date(`${iso}T12:00:00`));
const count = (n, es, esMany, en, enMany) => `${n} ${n === 1 ? tr(es, en) : tr(esMany, enMany)}`;
const demoBadge = () => `<span class="demo-badge">${tr('Demostración', 'Demo')}</span>`;

// Cursos con acceso: comprados primero y luego los de acceso gratuito.
function library() {
    const progress = readProgress();
    const owned = [
        ...demoAccount.purchases.map((purchase) => ({ id: purchase.course, source: 'purchase', since: purchase.date })),
        ...demoAccount.freeAccess.map((id) => ({ id, source: 'free', since: demoAccount.memberSince }))
    ];
    return owned.map((entry) => {
        const course = findCourse(entry.id);
        const done = course.lessons.map((_, index) => progress.has(`${course.id}:${index}`));
        const completed = done.filter(Boolean).length;
        const next = done.indexOf(false);
        const status = completed === 0 ? 'new' : completed === course.lessons.length ? 'done' : 'active';
        return { ...entry, course, completed, total: course.lessons.length, next, status, percent: Math.round((completed / course.lessons.length) * 100) };
    });
}

const statusLabel = (status) => ({ new: tr('Sin empezar', 'Not started'), active: tr('En curso', 'In progress'), done: tr('Completado', 'Completed') })[status];

async function watchedSeconds(items) {
    const progress = readProgress();
    const durations = await Promise.all(items.flatMap(({ course }) => course.lessons.map((_, index) => progress.has(`${course.id}:${index}`) ? videoDuration(lessonVideo(course, index)) : 0)));
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

function render() {
    if (!getSession()) return renderSignedOut();
    setTitle(tr('Mi cuenta', 'My account'));
    const items = library();
    const lessonsDone = items.reduce((sum, item) => sum + item.completed, 0);
    const lessonsTotal = items.reduce((sum, item) => sum + item.total, 0);
    const paid = demoAccount.purchases.filter((purchase) => purchase.status === 'paid').reduce((sum, purchase) => sum + purchase.amount, 0);
    const certificates = items.filter((item) => item.status === 'done');
    const resume = items.find((item) => item.status === 'active') ?? items.find((item) => item.status === 'new');
    const ownedIds = items.map((item) => item.id);
    const pathProgress = paths.filter((path) => path.courses.some((id) => ownedIds.includes(id))).map((path) => {
        const owned = path.courses.filter((id) => ownedIds.includes(id));
        const done = owned.filter((id) => items.find((item) => item.id === id).status === 'done').length;
        return { path, owned: owned.length, done, total: path.courses.length };
    });
    const name = t(demoAccount.name);

    $('account-page').innerHTML = `
    <section class="account-hero"><div class="container">
        <div class="account-id">
            <span class="teacher-avatar account-avatar" aria-hidden="true">CD</span>
            <div><p class="eyebrow-tag">${tr('Mi cuenta', 'My account')} ${demoBadge()}</p>
                <h1>${tr('Hola', 'Hello')}, ${esc(name)}</h1>
                <p class="muted">${esc(demoAccount.email)} · ${tr('Miembro desde', 'Member since')} ${day(demoAccount.memberSince)}</p></div>
        </div>
        <button class="btn btn-outline btn-small" id="logout" type="button">${tr('Cerrar sesión', 'Sign out')}</button>
    </div></section>

    <div class="container account-layout">
        <nav class="account-nav" aria-label="${tr('Secciones de la cuenta', 'Account sections')}">
            <a href="#resumen">${tr('Resumen', 'Overview')}</a>
            <a href="#mis-cursos">${tr('Mis cursos', 'My courses')}</a>
            <a href="#rutas">${tr('Rutas', 'Paths')}</a>
            <a href="#pagos">${tr('Pagos', 'Payments')}</a>
            <a href="#certificados">${tr('Certificados', 'Certificates')}</a>
            <a href="#perfil">${tr('Perfil', 'Profile')}</a>
        </nav>

        <div class="account-main">
            <section id="resumen" aria-labelledby="summary-heading">
                <h2 id="summary-heading">${tr('Resumen', 'Overview')}</h2>
                <dl class="stat-cards">
                    <div><dt>${tr('Cursos activos', 'Active courses')}</dt><dd>${items.length}</dd><small>${demoAccount.purchases.length} ${tr('comprados', 'purchased')} · ${demoAccount.freeAccess.length} ${tr('gratis', 'free')}</small></div>
                    <div><dt>${tr('Clases completadas', 'Lessons completed')}</dt><dd>${lessonsDone}<span>/${lessonsTotal}</span></dd><small><progress max="${lessonsTotal}" value="${lessonsDone}"></progress></small></div>
                    <div><dt>${tr('Progreso general', 'Overall progress')}</dt><dd>${lessonsTotal ? Math.round((lessonsDone / lessonsTotal) * 100) : 0}%</dd><small>${count(certificates.length, 'curso completado', 'cursos completados', 'course completed', 'courses completed')}</small></div>
                    <div><dt>${tr('Tiempo de video visto', 'Video time watched')}</dt><dd id="stat-watched">—</dd><small>${tr('según las clases completadas', 'based on completed lessons')}</small></div>
                    <div><dt>${tr('Total pagado', 'Total paid')}</dt><dd>${money(paid)}</dd><small>${count(demoAccount.purchases.length, 'pedido', 'pedidos', 'order', 'orders')} ${demoBadge()}</small></div>
                </dl>
                ${resume ? `<article class="resume-card">
                    <img src="./media/${resume.course.image}.jpg" alt="" width="200" height="120">
                    <div>
                        <p class="eyebrow-tag">${resume.status === 'new' ? tr('Empieza aquí', 'Start here') : tr('Continúa donde lo dejaste', 'Pick up where you left off')}</p>
                        <h3>${esc(courseText(resume.course).title)}</h3>
                        <p class="muted">${tr('Clase', 'Lesson')} ${resume.next + 1}: ${esc(courseText(resume.course).lessons[resume.next][0])}</p>
                        <a class="btn btn-primary btn-small" href="${link('course', resume.id)}?leccion=${resume.next + 1}">${resume.status === 'new' ? tr('Empezar', 'Start') : tr('Continuar', 'Continue')}</a>
                    </div>
                </article>` : `<p class="muted">${tr('Completaste todas tus clases. ¡Buen trabajo!', 'You completed all your lessons. Great work!')}</p>`}
            </section>

            <section id="mis-cursos" aria-labelledby="courses-heading">
                <h2 id="courses-heading">${tr('Mis cursos', 'My courses')}</h2>
                <div class="table-wrap"><table class="data-table">
                    <caption class="sr-only">${tr('Cursos con acceso y su progreso', 'Courses you can access and their progress')}</caption>
                    <thead><tr><th scope="col">${tr('Curso', 'Course')}</th><th scope="col">${tr('Acceso', 'Access')}</th><th scope="col">${tr('Progreso', 'Progress')}</th><th scope="col">${tr('Estado', 'Status')}</th><th scope="col"><span class="sr-only">${tr('Acción', 'Action')}</span></th></tr></thead>
                    <tbody>${items.map((item) => `<tr>
                        <th scope="row"><div class="cell-course"><img src="./media/${item.course.image}.jpg" alt="" width="56" height="40"><span>${esc(courseText(item.course).title)}<small>${levelText(item.course.level)} · ${item.total} ${tr('clases', 'lessons')}</small></span></div></th>
                        <td data-label="${tr('Acceso', 'Access')}">${item.source === 'purchase' ? tr('Comprado', 'Purchased') : tr('Clases gratuitas', 'Free lessons')}<small>${tr('desde', 'since')} ${day(item.since)}</small></td>
                        <td data-label="${tr('Progreso', 'Progress')}"><div class="cell-progress"><progress max="${item.total}" value="${item.completed}" aria-label="${item.percent}%"></progress><span>${item.completed}/${item.total}</span></div></td>
                        <td data-label="${tr('Estado', 'Status')}"><span class="status-pill" data-status="${item.status}">${statusLabel(item.status)}</span></td>
                        <td><a class="btn btn-outline btn-small" href="${link('course', item.id)}${item.next >= 0 ? `?leccion=${item.next + 1}` : ''}">${item.status === 'done' ? tr('Repasar', 'Review') : item.status === 'new' ? tr('Empezar', 'Start') : tr('Continuar', 'Continue')}</a></td>
                    </tr>`).join('')}</tbody>
                </table></div>
                <h3 class="account-sub">${tr('Guardados para más adelante', 'Saved for later')}</h3>
                <ul class="chip-links">${demoAccount.wishlist.map((id) => `<li><a href="${link('course', id)}">${esc(courseText(findCourse(id)).title)}</a></li>`).join('')}</ul>
            </section>

            <section id="rutas" aria-labelledby="paths-heading">
                <h2 id="paths-heading">${tr('Rutas en las que avanzas', 'Paths you are progressing in')}</h2>
                <ul class="path-progress">${pathProgress.map(({ path, owned, done, total }) => `<li>
                    <a href="${link('path', path.id)}">${esc(t(path.title))}</a>
                    <progress max="${total}" value="${done}"></progress>
                    <span>${done}/${total} ${tr('cursos completados', 'courses completed')} · ${owned} ${tr('con acceso', 'with access')}</span>
                </li>`).join('')}</ul>
            </section>

            <section id="pagos" aria-labelledby="payments-heading">
                <h2 id="payments-heading">${tr('Historial de pagos', 'Payment history')} ${demoBadge()}</h2>
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
                <p class="muted">${tr('Pagos de demostración: no ocurrieron. Con cuentas reales, aquí aparecerán los recibos de PayPal.', 'Demo payments: they did not happen. With real accounts, PayPal receipts will appear here.')}</p>
            </section>

            <section id="certificados" aria-labelledby="certificates-heading">
                <h2 id="certificates-heading">${tr('Certificados de finalización', 'Certificates of completion')}</h2>
                <ul class="certificate-list">${items.map((item) => `<li data-ready="${item.status === 'done'}">
                    <strong>${esc(courseText(item.course).title)}</strong>
                    <span>${item.status === 'done' ? tr('Disponible: completaste todas las clases', 'Available: you completed every lesson') : `${tr('Disponible al completar', 'Available when you complete')} ${count(item.total - item.completed, 'clase más', 'clases más', 'more lesson', 'more lessons')}`}</span>
                </li>`).join('')}</ul>
                <p class="muted">${tr('Es un certificado de finalización, no una acreditación profesional oficial.', 'This is a certificate of completion, not an official professional accreditation.')}</p>
            </section>

            <section id="perfil" aria-labelledby="profile-heading">
                <h2 id="profile-heading">${tr('Perfil', 'Profile')}</h2>
                <dl class="profile-list">
                    <div><dt>${tr('Nombre', 'Name')}</dt><dd>${esc(name)}</dd></div>
                    <div><dt>${tr('Correo', 'Email')}</dt><dd>${esc(demoAccount.email)}</dd></div>
                    <div><dt>${tr('País', 'Country')}</dt><dd>Costa Rica</dd></div>
                    <div><dt>${tr('Idioma', 'Language')}</dt><dd>${tr('Español', 'English')}</dd></div>
                </dl>
                <p class="muted">${tr('En la cuenta de demostración el perfil no se puede editar.', 'The demo account profile cannot be edited.')}</p>
            </section>
        </div>
    </div>`;

    $('logout').addEventListener('click', () => {
        endSession();
        location.href = './login.html';
    });
    watchedSeconds(items).then((seconds) => {
        const node = $('stat-watched');
        if (node) node.textContent = formatDuration(seconds) || '0:00';
    });
}

onLanguage(render);
addEventListener('storage', ({ key }) => {
    if (key === 'solara-demo-progress' || key === 'solara-demo-session') render();
});
