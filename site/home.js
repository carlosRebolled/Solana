// Componentes de la portada: banner, hero, historias, vitrina, escuelas, comunidad, metas y planes.
import { courses, schools, testimonials, events, goals, promotion, paths, findCourse } from './data.js';
import { $, t, tr, esc, params, courseText, lessonVideo, fillDurations, readProgress, teacherName, shapeSvg, icons, setupCarousel, setupReveal, onLanguage, reducedMotion } from './ui.js';
import { renderPlans } from './pricing.js';

/* 02 · PromotionBanner: solo con campaña activa o en vista previa (?promo=preview). */
function renderPromotion() {
    const banner = $('promo-banner');
    const preview = params.get('promo') === 'preview';
    const ends = promotion.endsAt ? new Date(promotion.endsAt) : preview ? new Date(Date.now() + 2 * 86400000) : null;
    const active = (promotion.active && ends && ends > new Date()) || preview;
    banner.hidden = !active;
    if (!active) return;
    const title = promotion.active ? t(promotion.title) : tr('Vista previa del banner promocional', 'Promotional banner preview');
    const subtitle = promotion.active ? t(promotion.subtitle) : tr('No hay una campaña activa. Este bloque solo se muestra con ?promo=preview.', 'There is no active campaign. This block only appears with ?promo=preview.');
    banner.innerHTML = `<div class="container promo-inner">
        <h2 id="promo-title">${esc(title)}</h2>
        ${promotion.price !== null ? `<p class="promo-price">${esc(promotion.price)} ${promotion.previousPrice ? `<s>${esc(promotion.previousPrice)}</s>` : ''}</p>` : `<p class="promo-preview-note">${esc(subtitle)}</p>`}
        <a class="btn" href="${promotion.href}">${tr('Ver precios', 'View prices')}</a>
        <div class="countdown"><span>${tr('Termina en', 'Ends in')}</span><ol id="countdown" aria-live="off"></ol></div>
    </div>`;
    const tick = () => {
        const left = Math.max(0, ends - Date.now());
        const parts = [[Math.floor(left / 86400000), 'd'], [Math.floor(left / 3600000) % 24, 'h'], [Math.floor(left / 60000) % 60, 'm'], [Math.floor(left / 1000) % 60, 's']];
        const list = $('countdown');
        if (!list) return;
        list.innerHTML = parts.map(([value, unit]) => `<li>${String(value).padStart(2, '0')}<small>${unit}</small></li>`).join('');
        if (left === 0) banner.hidden = true;
    };
    tick();
    clearInterval(renderPromotion.timer);
    renderPromotion.timer = setInterval(tick, 1000);
}

/* 03 · HeroVisual: clases de muestra reales con su duración leída del video. */
function renderHeroLessons() {
    if (!$('hero-lessons')) return;
    const tiles = courses.filter((course) => course.sample).flatMap((course) => course.lessons.map((_, index) => ({ course, index })));
    const picks = [tiles[0], tiles[2], tiles[4], tiles[1]].filter(Boolean);
    $('hero-lessons').innerHTML = picks.map(({ course, index }) => {
        const { title, lessons } = courseText(course);
        return `<li class="lesson-tile"><a href="./curso.html?curso=${course.id}&amp;leccion=${index + 1}#lecciones">
            <figure><img src="./media/${course.image}.jpg" alt="" width="300" height="210" loading="eager">
                <span class="tile-meta"><span data-duration-src="${lessonVideo(course, index)}">${tr('Video', 'Video')}</span></span></figure>
            <h3>${esc(lessons[index][0])}</h3>
            <p>${esc(title)} · ${esc(teacherName(course.id))}</p>
        </a></li>`;
    }).join('');
    fillDurations($('hero-lessons'));
}

/* 05 · SignupCTA: demostración local. No envía ni guarda el correo. */
function setupSignup() {
    if (!$('signup-form')) return;
    const form = $('signup-form');
    const input = $('signup-email');
    const message = $('signup-message');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const valid = input.value.trim() !== '' && input.checkValidity();
        input.setAttribute('aria-invalid', String(!valid));
        message.classList.toggle('is-error', !valid);
        message.textContent = valid
            ? tr('Las cuentas de Solara aún no están disponibles y no guardamos tu correo. Mientras tanto, puedes ver las clases de muestra sin registrarte.', 'Solara accounts are not available yet and your email was not stored. Meanwhile, you can watch the sample lessons without signing up.')
            : tr('Escribe un correo con el formato nombre@dominio.com.', 'Enter an email in the format name@domain.com.');
        if (valid) input.value = '';
        else input.focus();
    });
}

/* 06 · TestimonialCarousel con tarjetas de ejemplo. */
function renderStories() {
    $('stories-prev').innerHTML = icons.prev;
    $('stories-next').innerHTML = icons.next;
    $('stories-track').innerHTML = testimonials.map((story, index) => `
        <article class="testimonial-card" aria-roledescription="${tr('tarjeta', 'card')}" aria-label="${index + 1} / ${testimonials.length}">
            <div class="testimonial-content">
                <div class="testimonial-person"><strong>${esc(t(story.role))}</strong><span>${esc(t(story.context))}</span></div>
                <blockquote>${esc(t(story.quote))}</blockquote>
                <div class="testimonial-result"><small>${esc(t(story.label))}</small><strong>${esc(t(story.result))}</strong></div>
            </div>
            <figure><img src="./media/${story.image}.jpg" alt="" loading="lazy" width="284" height="304"><span class="demo-badge">${tr('Ejemplo', 'Example')}</span></figure>
        </article>`).join('');
    setupCarousel($('stories-track'), $('stories-prev'), $('stories-next'))?.();
}

/* 07–09 · Vitrina: el paso activo cambia con el desplazamiento o al pulsar una tarjeta. */
const featureTexts = [
    ['Elige una meta y Solara ordena los cursos de la ruta que mejor encaja.', 'Pick a goal and Solara orders the courses of the path that fits best.'],
    ['Una pantalla clara con el video, las clases y tu progreso, sin distracciones.', 'A clear screen with the video, lessons and your progress, without distractions.'],
    ['Ejercicios cortos en cada clase para comprobar lo que aprendiste.', 'Short exercises in every lesson to check what you learned.']
];
let activeStep = 0;
let selectedPath = paths[0].id;

function setStep(step) {
    activeStep = step;
    for (const card of document.querySelectorAll('.feature-card')) {
        const index = Number(card.dataset.step);
        card.dataset.active = String(index === step);
        card.dataset.done = String(index < step);
    }
    for (const view of document.querySelectorAll('.app-view')) view.dataset.active = String(Number(view.dataset.view) === step);
    document.querySelectorAll('.feature-dots span').forEach((dot, index) => { dot.dataset.active = String(index === step); });
    $('feature-text').textContent = t(featureTexts[step]);
    if (step !== 1) $('focus-video').pause();
}

function renderPathPreview() {
    $('goal-picker').innerHTML = paths.map((path) => `<button type="button" data-path="${path.id}" aria-pressed="${path.id === selectedPath}">${esc(t(path.title))}</button>`).join('');
    const path = paths.find((entry) => entry.id === selectedPath);
    const progress = readProgress();
    $('path-preview').innerHTML = path.courses.map((id) => {
        const course = findCourse(id);
        const done = course.lessons.filter((_, index) => progress.has(`${id}:${index}`)).length;
        return `<li><div><a href="./curso.html?curso=${id}&amp;ruta=${path.id}">${esc(courseText(course).title)}</a><br>
            <small>${course.sample ? `${done}/${course.lessons.length} ${tr('clases completadas', 'lessons completed')}` : tr('En preparación', 'In preparation')}</small></div>
            <a class="btn btn-outline btn-small" href="./ruta.html?ruta=${path.id}">${tr('Ruta', 'Path')}</a></li>`;
    }).join('');
}

let focusLesson = 0;
function renderFocus() {
    const course = findCourse('campo');
    const { lessons } = courseText(course);
    const progress = readProgress();
    $('focus-lessons').innerHTML = lessons.map(([title], index) => `<button type="button" data-lesson="${index}" aria-current="${index === focusLesson}">${index + 1}. ${esc(title)} <span data-duration-src="${lessonVideo(course, index)}"></span></button>`).join('');
    const video = $('focus-video');
    const src = lessonVideo(course, focusLesson);
    if (video.getAttribute('src') !== src) video.src = src;
    const done = lessons.filter((_, index) => progress.has(`campo:${index}`)).length;
    $('focus-progress').value = done;
    $('focus-progress').max = lessons.length;
    $('focus-label').textContent = `${done}/${lessons.length} ${tr('clases', 'lessons')}`;
    fillDurations($('focus-lessons'));
}

const quiz = [
    {
        q: ['Antes de una salida de campo, ¿qué conviene definir primero?', 'Before a field outing, what should you define first?'],
        options: [['Una pregunta que puedas responder observando', 'A question you can answer by observing'], ['La cantidad de fotos que vas a tomar', 'How many photos you will take'], ['El color del cuaderno', 'The color of your notebook']],
        answer: 0,
        explain: ['Una pregunta concreta orienta qué observar y qué registrar.', 'A specific question guides what to observe and record.']
    },
    {
        q: ['Para comparar dos visitas al mismo lugar, ¿qué debes mantener igual?', 'To compare two visits to the same place, what should stay the same?'],
        options: [['La hora del almuerzo', 'Lunch time'], ['El recorrido y el tiempo de observación', 'The route and observation time'], ['Las personas del grupo', 'The people in the group']],
        answer: 1,
        explain: ['Así las diferencias se deben al lugar y no al método.', 'That way differences come from the place, not the method.']
    }
];
let quizIndex = 0;
function renderQuiz() {
    const item = quiz[quizIndex];
    $('quiz-question').textContent = `${quizIndex + 1}/${quiz.length}. ${t(item.q)}`;
    $('quiz-options').innerHTML = item.options.map((option, index) => `<label><input type="radio" name="quiz" value="${index}"> ${esc(t(option))}</label>`).join('');
    $('quiz-result').textContent = '';
    $('quiz-check').hidden = false;
    $('quiz-next').hidden = true;
}

function setupShowcase() {
    const stack = $('feature-stack');
    stack.addEventListener('click', (event) => {
        const card = event.target.closest('.feature-card');
        if (!card) return;
        const step = Number(card.dataset.step);
        const steps = $('showcase-steps');
        if (getComputedStyle(document.querySelector('.showcase-sticky')).position === 'sticky') {
            const range = steps.offsetHeight - innerHeight;
            scrollTo({ top: (steps.getBoundingClientRect().top + scrollY) + (range * (step + .5)) / 3, behavior: reducedMotion() ? 'auto' : 'smooth' });
        } else {
            setStep(step);
        }
    });
    const onScroll = () => {
        const sticky = document.querySelector('.showcase-sticky');
        if (getComputedStyle(sticky).position !== 'sticky') return;
        const steps = $('showcase-steps');
        const range = steps.offsetHeight - innerHeight;
        const progress = Math.min(.999, Math.max(0, (scrollY - (steps.getBoundingClientRect().top + scrollY)) / range));
        const step = Math.floor(progress * 3);
        if (step !== activeStep) setStep(step);
    };
    addEventListener('scroll', onScroll, { passive: true });
    $('goal-picker').addEventListener('click', (event) => {
        const button = event.target.closest('[data-path]');
        if (!button) return;
        selectedPath = button.dataset.path;
        renderPathPreview();
        $('goal-picker').querySelector(`[data-path="${selectedPath}"]`).focus();
    });
    $('focus-lessons').addEventListener('click', (event) => {
        const button = event.target.closest('[data-lesson]');
        if (!button) return;
        focusLesson = Number(button.dataset.lesson);
        renderFocus();
    });
    $('quiz-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const chosen = $('quiz-form').querySelector('input:checked');
        if (!chosen) {
            $('quiz-result').textContent = tr('Elige una respuesta para comprobarla.', 'Choose an answer to check it.');
            return;
        }
        const item = quiz[quizIndex];
        const correct = Number(chosen.value) === item.answer;
        $('quiz-options').querySelectorAll('label').forEach((label, index) => {
            label.classList.toggle('is-correct', index === item.answer);
            label.classList.toggle('is-wrong', index === Number(chosen.value) && !correct);
        });
        $('quiz-result').textContent = `${correct ? tr('¡Correcto!', 'Correct!') : tr('Todavía no.', 'Not quite.')} ${t(item.explain)}`;
        $('quiz-check').hidden = true;
        $('quiz-next').hidden = false;
        $('quiz-next').textContent = quizIndex < quiz.length - 1 ? tr('Siguiente pregunta', 'Next question') : tr('Volver a empezar', 'Start again');
        $('quiz-next').focus();
    });
    $('quiz-next').addEventListener('click', () => {
        quizIndex = (quizIndex + 1) % quiz.length;
        renderQuiz();
        $('quiz-options').querySelector('input')?.focus();
    });
}

/* 10 · SchoolCarousel. */
function renderSchools() {
    $('schools-prev-ui').innerHTML = icons.prev;
    $('schools-next-ui').innerHTML = icons.next;
    $('schools-track').innerHTML = schools.map((school) => `
        <a class="school-tile" href="./escuelas.html?area=${school.id}">
            <div class="school-media tone-${school.color}"><span class="pill">${esc(t(school.title).split(' ')[0])}</span>${shapeSvg(school.shape)}</div>
            <span class="school-name">${esc(t(school.title))}</span>
        </a>`).join('');
    setupCarousel($('schools-track'), $('schools-prev-ui'), $('schools-next-ui'))?.();
}

/* 11–12 · Comunidad: programas reales de Solara. */
function renderCommunity() {
    $('mosaic-shape').innerHTML = shapeSvg('sun');
    $('event-grid').innerHTML = events.map((event) => `
        <a class="event-card tone-${event.color} reveal" href="${event.href}">
            <figure><img src="./media/${event.image}.jpg" alt="" loading="lazy" width="362" height="300"></figure>
            <div><h3>${esc(t(event.title))}</h3><p>${esc(t(event.text))}</p></div>
        </a>`).join('');
    setupReveal($('event-grid'));
}

/* 13 · LearningGoalsSection: etiquetas estáticas alrededor del título (sin interacción en la referencia). */
const chipLayout = [
    ['8%', '6%', 'leaf'], ['44%', '0%', 'lime'], ['74%', '10%', 'sky'], ['2%', '72%', 'clay'],
    ['30%', '86%', 'sun'], ['62%', '84%', 'leaf'], ['82%', '62%', 'moss']
];
function renderGoals() {
    const cloud = $('goal-cloud');
    cloud.querySelector('.goal-chips-row')?.remove();
    const row = document.createElement('div');
    row.className = 'goal-chips-row';
    row.setAttribute('aria-hidden', 'true');
    row.innerHTML = goals.map((goal, index) => {
        const [left, top, tone] = chipLayout[index % chipLayout.length];
        return `<span class="goal-chip tone-${tone}" style="left:${left};top:${top}">${esc(t(goal))}</span>`;
    }).join('');
    cloud.append(row);
}

function renderAll() {
    renderPromotion();
    renderHeroLessons();
    renderStories();
    renderPathPreview();
    renderFocus();
    renderQuiz();
    setStep(activeStep);
    renderSchools();
    renderCommunity();
    renderGoals();
    renderPlans($('home-audience'), $('home-plans'));
}

setupSignup();
onLanguage(renderAll);
setupShowcase();
setupReveal();
addEventListener('storage', ({ key }) => {
    if (key === 'solara-demo-progress') { renderPathPreview(); renderFocus(); }
});
$('focus-video').addEventListener('ended', () => {
    const progress = readProgress();
    progress.add(`campo:${focusLesson}`);
    try { localStorage.setItem('solara-demo-progress', JSON.stringify([...progress])); } catch { /* sin almacenamiento */ }
    renderFocus();
    renderPathPreview();
});
