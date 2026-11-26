// 19–20 · Escuelas: directorio y ficha de cada escuela con un único diseño.
import { schools, findSchool, coursesForSchool, pathsForSchool } from './data.js';
import { $, t, tr, esc, params, shapeSvg, onLanguage, setTitle, link } from './ui.js';
import { pathCard, setupPathCards, teacherCards, courseRow } from './edu.js';

function renderDirectory() {
    setTitle(tr('Escuelas', 'Schools'));
    $('school-page').innerHTML = `<section class="page-hero"><div class="container">
            <ol class="breadcrumbs"><li><a href="./">${tr('Inicio', 'Home')}</a></li><li>${tr('Escuelas', 'Schools')}</li></ol>
            <h1>${tr('Escuelas de Solara', 'Solara schools')}</h1>
            <p>${tr('Cada escuela reúne las rutas y los cursos de un área de aprendizaje al aire libre.', 'Each school brings together the paths and courses of one outdoor learning area.')}</p>
        </div></section>
        <section class="container" style="padding-bottom:96px">
            <div class="course-grid-ui">${schools.map((school) => {
                const count = coursesForSchool(school).length;
                const routes = pathsForSchool(school).length;
                return `<a class="school-tile" href="${link('school', school.id)}">
                    <div class="school-media tone-${school.color}" style="height:260px">${shapeSvg(school.shape)}</div>
                    <span class="school-name">${esc(t(school.title))}</span>
                    <span class="result-count" style="margin:0">${routes} ${routes === 1 ? tr('ruta', 'path') : tr('rutas', 'paths')} · ${count} ${count === 1 ? tr('curso', 'course') : tr('cursos', 'courses')}</span>
                </a>`;
            }).join('')}</div>
        </section>`;
}

function renderSchool(school) {
    setTitle(t(school.title));
    const list = coursesForSchool(school);
    const routes = pathsForSchool(school);
    const samples = list.filter((course) => course.sample).length;
    $('school-page').innerHTML = `<section class="page-hero school-hero"><div class="container school-hero-inner">
            <div>
                <ol class="breadcrumbs"><li><a href="./">${tr('Inicio', 'Home')}</a></li><li><a href="./escuelas.html">${tr('Escuelas', 'Schools')}</a></li><li>${esc(t(school.title))}</li></ol>
                <h1>${tr('Escuela de', 'School of')} ${esc(t(school.title))}</h1>
                <p>${esc(t(school.description))}</p>
                <ul class="stat-row">
                    <li><strong>${routes.length}</strong><span>${tr('rutas', 'paths')}</span></li>
                    <li><strong>${list.length}</strong><span>${tr('cursos', 'courses')}</span></li>
                    <li><strong>${samples}</strong><span>${tr('con clases de muestra', 'with sample lessons')}</span></li>
                </ul>
            </div>
            <div class="school-hero-art tone-${school.color}" aria-hidden="true">${shapeSvg(school.shape)}</div>
        </div></section>
        <section class="container" aria-labelledby="routes-title">
            <h2 class="section-title" id="routes-title" style="font-size:1.6rem;margin-bottom:20px">${tr('Rutas', 'Paths')} (${routes.length})</h2>
            ${routes.length ? `<div class="path-grid" id="school-paths">${routes.map(pathCard).join('')}</div>` : `<div class="empty-state"><p>${tr('Esta escuela todavía no tiene rutas.', 'This school has no paths yet.')}</p></div>`}
        </section>
        <section class="container" style="padding-top:64px" aria-labelledby="courses-title">
            <h2 class="section-title" id="courses-title" style="font-size:1.6rem;margin-bottom:20px">${tr('Cursos de la escuela', 'School courses')} (${list.length})</h2>
            <div class="course-row-grid">${list.map((course) => courseRow(course)).join('')}</div>
        </section>
        <section class="container" style="padding:64px 0 96px" aria-labelledby="team-title">
            <h2 class="section-title" id="team-title" style="font-size:1.6rem;margin-bottom:20px">${tr('Quién enseña en esta escuela', 'Who teaches in this school')}</h2>
            ${teacherCards(list.map((course) => course.id))}
        </section>`;
    if ($('school-paths')) setupPathCards($('school-paths'));
}

function renderMissing() {
    setTitle(tr('Escuela no encontrada', 'School not found'));
    $('school-page').innerHTML = `<section class="page-hero"><div class="container">
        <h1>${tr('Escuela no encontrada', 'School not found')}</h1>
        <p>${tr('Elige una de las escuelas disponibles.', 'Choose one of the available schools.')}</p>
        <p><a class="btn btn-primary" href="./escuelas.html">${tr('Ver escuelas', 'View schools')}</a></p>
    </div></section>`;
}

onLanguage(() => {
    const area = document.body.dataset.school ?? params.get('area');
    if (!area) return renderDirectory();
    const school = findSchool(area);
    return school ? renderSchool(school) : renderMissing();
});
