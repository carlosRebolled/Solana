// 21–24 · Ruta de aprendizaje: información, requisitos, cursos ordenados y equipo docente.
import { paths, findPath, findCourse, findSchool } from './data.js';
import { $, t, tr, esc, params, courseText, levelText, lessonVideo, videoDuration, formatDuration, onLanguage, setTitle, link } from './ui.js';
import { pathCard, setupPathCards, teacherCards } from './edu.js';

// Duración de un curso: suma de sus videos reales; sin videos se muestra «Por definir».
async function courseDuration(course) {
    if (!course.sample) return null;
    const values = await Promise.all(course.lessons.map((_, index) => videoDuration(lessonVideo(course, index))));
    return values.every(Number.isFinite) ? values.reduce((sum, value) => sum + value, 0) : null;
}

function renderDirectory() {
    setTitle(tr('Rutas de aprendizaje', 'Learning paths'));
    $('path-page').innerHTML = `<section class="page-hero"><div class="container">
            <ol class="breadcrumbs"><li><a href="./">${tr('Inicio', 'Home')}</a></li><li>${tr('Rutas', 'Paths')}</li></ol>
            <h1>${tr('Rutas de aprendizaje', 'Learning paths')}</h1>
            <p>${tr('Cada ruta ordena varios cursos para alcanzar una meta concreta.', 'Each path puts several courses in order to reach a specific goal.')}</p>
        </div></section>
        <section class="container" style="padding-bottom:96px"><div class="path-grid" id="all-paths">${paths.map(pathCard).join('')}</div></section>`;
    setupPathCards($('all-paths'));
}

function renderPath(path) {
    setTitle(t(path.title));
    const school = findSchool(path.school);
    const list = path.courses.map(findCourse);
    const required = path.requires.map(findPath).filter(Boolean);
    $('path-page').innerHTML = `<section class="page-hero"><div class="container">
            <ol class="breadcrumbs"><li><a href="./">${tr('Inicio', 'Home')}</a></li><li><a href="${link('school', school.id)}">${esc(t(school.title))}</a></li><li>${tr('Ruta', 'Path')}</li></ol>
            <p class="eyebrow-tag">${tr('Ruta de aprendizaje', 'Learning path')}</p>
            <h1>${esc(t(path.title))}</h1>
            <p>${esc(t(path.description))}</p>
            <ul class="stat-row"><li><strong>${list.length}</strong><span>${tr('cursos', 'courses')}</span></li><li><strong>${list.filter((course) => course.sample).length}</strong><span>${tr('con clases de muestra', 'with sample lessons')}</span></li></ul>
        </div></section>
        <section class="container" aria-labelledby="requires-title">
            <h2 class="section-title" id="requires-title" style="font-size:1.25rem;margin-bottom:14px">${tr('Para tomar esta ruta conviene saber:', 'Before this path it helps to know:')}</h2>
            ${required.length
                ? `<ul class="chip-links">${required.map((entry) => `<li><a href="${link('path', entry.id)}">${esc(t(entry.title))} →</a></li>`).join('')}</ul>
                   <p class="result-count">${tr('Es una recomendación, no un requisito obligatorio.', 'This is a recommendation, not a mandatory requirement.')}</p>`
                : `<ul class="chip-links"><li><span>${tr('No necesitas conocimientos previos', 'No prior knowledge needed')}</span></li></ul>`}
        </section>
        <section class="container" style="padding-top:48px" aria-labelledby="path-courses-title">
            <h2 class="section-title" id="path-courses-title" style="font-size:1.6rem;margin-bottom:20px">${tr('Cursos', 'Courses')} (${list.length})</h2>
            <ol class="path-courses">${list.map((course) => `<li class="path-course">
                <img src="./media/${course.image}.jpg" alt="" width="96" height="64" loading="lazy">
                <div>
                    <h3><a href="${link('course', course.id)}?ruta=${path.id}">${esc(courseText(course).title)}</a></h3>
                    <ul class="course-meta"><li>${levelText(course.level)}</li><li>${course.lessons.length} ${tr('clases', 'lessons')}</li><li data-course-duration="${course.id}">${course.sample ? tr('Calculando duración…', 'Calculating length…') : tr('Duración por definir', 'Length to be defined')}</li></ul>
                </div>
                <a class="btn btn-outline btn-small" href="${link('course', course.id)}?ruta=${path.id}">${course.sample ? tr('Ver curso', 'View course') : tr('Ver temario', 'View syllabus')}</a>
            </li>`).join('')}</ol>
        </section>
        <section class="container" style="padding:64px 0 96px" aria-labelledby="path-team-title">
            <h2 class="section-title" id="path-team-title" style="font-size:1.6rem;margin-bottom:20px">${tr('Quién enseña en esta ruta', 'Who teaches this path')}</h2>
            ${teacherCards(path.courses)}
        </section>`;
    for (const course of list.filter((entry) => entry.sample)) {
        courseDuration(course).then((seconds) => {
            const node = document.querySelector(`[data-course-duration="${course.id}"]`);
            if (node) node.textContent = seconds === null ? tr('Duración por definir', 'Length to be defined') : `${formatDuration(seconds)} ${tr('de video', 'of video')}`;
        });
    }
}

function renderMissing() {
    setTitle(tr('Ruta no encontrada', 'Path not found'));
    $('path-page').innerHTML = `<section class="page-hero"><div class="container"><h1>${tr('Ruta no encontrada', 'Path not found')}</h1>
        <p><a class="btn btn-primary" href="./ruta.html">${tr('Ver todas las rutas', 'View all paths')}</a></p></div></section>`;
}

onLanguage(() => {
    const pathId = document.body.dataset.path ?? params.get('ruta');
    if (!pathId) return renderDirectory();
    const path = findPath(pathId);
    return path ? renderPath(path) : renderMissing();
});
