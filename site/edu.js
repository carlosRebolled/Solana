// Componentes educativos compartidos: tarjetas de ruta, vista previa de cursos y equipo docente.
import { findCourse, teachers, pathsForCourse, waves } from './data.js';
import { t, tr, esc, courseText, levelText, price, teacherName, link } from './ui.js';

export function pathCard(path) {
    const list = path.courses.map(findCourse);
    const available = list.filter((course) => course.sample).length;
    return `<article class="path-card">
        <h3><a href="${link('path', path.id)}">${esc(t(path.title))}</a></h3>
        <p>${esc(t(path.description))}</p>
        <ul class="course-meta"><li>${list.length} ${list.length === 1 ? tr('curso', 'course') : tr('cursos', 'courses')}</li><li>${available} ${tr('con clases de muestra', 'with sample lessons')}</li></ul>
        <ul class="path-preview" aria-label="${tr('Cursos de la ruta', 'Courses in the path')}">${list.map((course) => `<li title="${esc(courseText(course).title)}"><img src="./media/${course.image}.jpg" alt="${esc(courseText(course).title)}" width="56" height="56" loading="lazy"></li>`).join('')}</ul>
        <button class="btn btn-outline btn-small path-expand" type="button" aria-expanded="false" aria-controls="path-${path.id}-list">${tr('Ver cursos', 'Show courses')}</button>
        <ol class="path-inline-list" id="path-${path.id}-list" hidden>${list.map((course) => `<li><a href="${link('course', course.id)}?ruta=${path.id}">${esc(courseText(course).title)}</a></li>`).join('')}</ol>
        <a class="btn btn-primary btn-small" href="${link('path', path.id)}">${tr('Abrir ruta', 'Open path')}</a>
    </article>`;
}

export function setupPathCards(container) {
    container.addEventListener('click', (event) => {
        const button = event.target.closest('.path-expand');
        if (!button) return;
        const list = document.getElementById(button.getAttribute('aria-controls'));
        const open = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', String(open));
        list.hidden = !open;
        button.textContent = open ? tr('Ocultar cursos', 'Hide courses') : tr('Ver cursos', 'Show courses');
    });
}

export function teacherCards(courseIds) {
    const list = teachers.filter((teacher) => teacher.courses.some((id) => courseIds.includes(id)));
    return `<div class="teacher-grid">${list.map((teacher) => `<article class="teacher-card">
        <span class="teacher-avatar" aria-hidden="true">${teacher.initials}</span>
        <div><strong>${esc(t(teacher.name))}</strong><span>${esc(t(teacher.role))}</span></div>
    </article>`).join('')}</div>
    <p class="result-count">${tr('Publicaremos los perfiles del equipo docente cuando estén confirmados.', 'We will publish the teaching team’s profiles once they are confirmed.')}</p>`;
}

export function courseRow(course, { pathId } = {}) {
    const { title } = courseText(course);
    const routes = pathsForCourse(course.id).map((path) => t(path.title)).join(' · ');
    return `<a class="course-row" href="${link('course', course.id)}${pathId ? `?ruta=${pathId}` : ''}">
        <img src="./media/${course.image}.jpg" alt="" width="160" height="112" loading="lazy">
        <div>
            <h3>${esc(title)}</h3>
            <p>${course.audience ? `${tr('Para', 'For')}: ${esc(t(course.audience))}` : esc(teacherName(course.id))}</p>
            <ul class="course-meta"><li>${levelText(course.level)}</li><li>${course.lessons.length} ${tr('clases', 'lessons')}</li><li>${esc(price(course.price))}</li>${course.sample ? `<li class="sample-flag">${tr('Clases de muestra', 'Sample lessons')}</li>` : `<li>${course.wave ? esc(t(waves[course.wave])) : tr('En preparación', 'In preparation')}</li>`}</ul>
            ${routes ? `<p class="row-paths">${tr('Rutas', 'Paths')}: ${esc(routes)}</p>` : ''}
        </div>
    </a>`;
}
