// 16–18 · Catálogo: filtros sincronizados con la URL y cursos agrupados por escuela.
import { courses, schools, paths, findCourse, findPath } from './data.js';
import { $, t, tr, esc, courseText, levelText, onLanguage, setTitle, link } from './ui.js';
import { courseRow } from './edu.js';

const normalize = (value) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const fields = { q: 'catalog-search', escuela: 'catalog-school', ruta: 'catalog-path', nivel: 'catalog-level' };

function readUrl() {
    const query = new URLSearchParams(location.search);
    for (const [key, id] of Object.entries(fields)) $(id).value = query.get(key) ?? '';
    $('catalog-samples').checked = query.get('muestra') === '1';
}

function writeUrl() {
    const query = new URLSearchParams();
    for (const [key, id] of Object.entries(fields)) if ($(id).value) query.set(key, $(id).value);
    if ($('catalog-samples').checked) query.set('muestra', '1');
    const next = `${location.pathname}${query.size ? `?${query}` : ''}`;
    if (next !== `${location.pathname}${location.search}`) history.replaceState(null, '', next);
}

function renderOptions() {
    const keep = { school: $('catalog-school').value, path: $('catalog-path').value };
    $('catalog-school').innerHTML = `<option value="">${tr('Todas las escuelas', 'All schools')}</option>${schools.map((school) => `<option value="${school.id}">${esc(t(school.title))}</option>`).join('')}`;
    $('catalog-path').innerHTML = `<option value="">${tr('Todas las rutas', 'All paths')}</option>${paths.map((path) => `<option value="${path.id}">${esc(t(path.title))}</option>`).join('')}`;
    $('catalog-level').innerHTML = `<option value="">${tr('Todos los niveles', 'All levels')}</option><option value="Inicial">${levelText('Inicial')}</option><option value="Intermedio">${levelText('Intermedio')}</option>`;
    $('catalog-school').value = keep.school;
    $('catalog-path').value = keep.path;
}

function render() {
    const term = normalize($('catalog-search').value.trim());
    const schoolId = $('catalog-school').value;
    const pathId = $('catalog-path').value;
    const level = $('catalog-level').value;
    const samples = $('catalog-samples').checked;
    const path = findPath(pathId);
    const matching = courses.filter((course) => {
        const text = courseText(course);
        return (!schoolId || schools.find((school) => school.id === schoolId)?.topic === course.topic)
            && (!path || path.courses.includes(course.id))
            && (!level || course.level === level)
            && (!samples || course.sample)
            && (!term || normalize(`${course.title} ${course.description} ${text.title} ${text.description}`).includes(term));
    });
    const active = term || schoolId || pathId || level || samples;
    $('catalog-reset').disabled = !active;
    $('catalog-count').textContent = `${matching.length} ${matching.length === 1 ? tr('curso', 'course') : tr('cursos', 'courses')}`;
    writeUrl();

    if (!matching.length) {
        $('catalog-results').innerHTML = `<div class="empty-state"><p>${tr('No hay cursos con estos filtros.', 'No courses match these filters.')}</p>
            <button class="btn btn-outline" type="button" data-reset>${tr('Quitar filtros', 'Clear filters')}</button></div>`;
        return;
    }
    // Con una ruta elegida, se respeta su orden; si no, se agrupa por escuela.
    if (path) {
        $('catalog-results').innerHTML = `<section class="course-section"><h2>${esc(t(path.title))}</h2>
            <div class="course-row-grid">${path.courses.map(findCourse).filter((course) => matching.includes(course)).map((course) => courseRow(course, { pathId: path.id })).join('')}</div></section>`;
        return;
    }
    $('catalog-results').innerHTML = schools.map((school) => {
        // Primero los cursos que ya tienen clases, luego los que están en preparación.
        const list = matching.filter((course) => course.topic === school.topic).sort((a, b) => Number(b.sample) - Number(a.sample));
        if (!list.length) return '';
        return `<section class="course-section" aria-labelledby="group-${school.id}">
            <div class="section-head" style="margin-bottom:20px"><h2 id="group-${school.id}">${esc(t(school.title))}</h2><a class="link-arrow" href="${link('school', school.id)}">${tr('Ver escuela', 'View school')}</a></div>
            <div class="course-row-grid">${list.map((course) => courseRow(course)).join('')}</div>
        </section>`;
    }).join('');
}

function reset() {
    for (const id of Object.values(fields)) $(id).value = '';
    $('catalog-samples').checked = false;
    render();
    $('catalog-search').focus();
}

readUrl();
onLanguage(() => {
    renderOptions();
    readUrl();
    render();
    setTitle(tr('Catálogo de cursos', 'Course catalog'));
});
for (const id of [...Object.values(fields), 'catalog-samples']) $(id).addEventListener(id === 'catalog-search' ? 'input' : 'change', render);
$('catalog-reset').addEventListener('click', reset);
$('catalog-results').addEventListener('click', (event) => { if (event.target.closest('[data-reset]')) reset(); });
