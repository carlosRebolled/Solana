const courses = [
    {
        id: 'campo', title: 'Fundamentos de trabajo de campo', level: 'Inicial', price: 29, image: 'field',
        description: 'Convierte una salida en una observación organizada con un registro que puedas consultar después.',
        lessons: [
            ['Antes de salir', 'Define una pregunta que puedas responder con una observación corta.'],
            ['Tu cuaderno de campo', 'Registra fecha, lugar y condiciones antes de anotar lo que observas.']
        ]
    },
    {
        id: 'biodiversidad', title: 'Observación de biodiversidad', level: 'Intermedio', price: 39, image: 'biodiversity',
        description: 'Aprende a describir la diversidad de un lugar y a comparar lo que encuentras en distintos recorridos.',
        lessons: [
            ['Mirar a distintas escalas', 'Compara lo que ves en el suelo con lo que encuentras en el dosel.'],
            ['Comparar observaciones', 'Usa el mismo recorrido y tiempo de observación al comparar dos visitas.']
        ]
    },
    {
        id: 'sendero', title: 'Lectura del paisaje', level: 'Inicial', price: 29, image: 'trail',
        description: 'Interpreta las señales del terreno para reconocer cómo cambian el agua, la luz y la vegetación.',
        lessons: [
            ['Las pistas del terreno', 'Identifica pendientes y puntos bajos para seguir el recorrido del agua.'],
            ['Luz y vegetación', 'Compara una zona abierta con otra bajo sombra y anota sus diferencias.']
        ]
    }
];

const englishCourses = {
    campo: ['Fieldwork fundamentals', 'Turn an outing into a structured observation you can refer back to later.', [
        ['Before you head out', 'Define a specific question. Choose a place and a time to observe.'],
        ['Your field notebook', 'Write down the date, place and weather. Separate what you see from your interpretations.']
    ]],
    biodiversidad: ['Observing biodiversity', 'Describe local diversity and compare what you find on different walks.', [
        ['Looking at different scales', 'Observe the ground, understory and canopy. Describe one difference between each layer.'],
        ['Comparing observations', 'Repeat the same route and observation period. Note what changes between two visits.']
    ]],
    sendero: ['Reading the landscape', 'Read the terrain to understand how water, light and vegetation change.', [
        ['Clues in the terrain', 'Look for slopes, channels and low areas. Draw the likely path of the water.'],
        ['Light and vegetation', 'Choose a sunny spot and a shaded one. Compare moisture and vegetation.']
    ]]
};

// Enter verified figures only. Set period to { es: '…', en: '…' } for their reporting period.
const metrics = { students: null, clients: null, graduates: null, hours: null, period: null };
let language = 'es';
const tr = (es, en) => language === 'en' ? en : es;
const getLocale = () => tr('es-CR', 'en-US');

function courseText(course) {
    const [title, description, lessons] = englishCourses[course.id];
    return language === 'en' ? { title, description, lessons } : course;
}

function renderMetrics() {
    const number = new Intl.NumberFormat(getLocale());
    document.querySelectorAll('[data-metric]').forEach((item) => {
        const value = metrics[item.dataset.metric];
        item.textContent = value === null ? tr('Por publicar', 'To be published') : number.format(value);
    });
    document.querySelectorAll('[data-period]').forEach((item) => {
        item.hidden = !metrics.period;
        item.textContent = metrics.period?.[language] ?? '';
    });
}

const translations = [
    ['data-en', null],
    ['data-en-label', 'aria-label'],
    ['data-en-placeholder', 'placeholder']
].flatMap(([attribute, target]) => [...document.querySelectorAll(`[${attribute}]`)].map((element) => ({
    element, target, es: target ? element.getAttribute(target) : element.textContent, en: element.getAttribute(attribute)
})));

function renderLanguage() {
    document.documentElement.lang = language;
    document.title = tr('Solara Field School | Programas y academia', 'Solara Field School | Programs and academy');
    for (const { element, target, es, en } of translations) {
        if (target) element.setAttribute(target, tr(es, en));
        else element.textContent = tr(es, en);
    }
    renderMetrics();
    renderCatalog();
    renderCart();
}

const $ = (id) => document.getElementById(id);
const currency = (amount) => new Intl.NumberFormat(getLocale(), { style: 'currency', currency: 'USD', currencyDisplay: 'code', maximumFractionDigits: 0 }).format(amount);

function readSet(key) {
    try {
        const stored = JSON.parse(localStorage.getItem(key));
        return new Set(Array.isArray(stored) ? stored : []);
    } catch {
        return new Set();
    }
}

function storeSet(key, values) {
    try {
        localStorage.setItem(key, JSON.stringify([...values]));
    } catch {
        // The current session can still use the catalog when storage is unavailable.
    }
}

const cart = readSet('solara-demo-cart');
const completed = readSet('solara-demo-progress');
const player = $('player');
const courseDialog = $('course-dialog');
const cartDialog = $('cart-dialog');
let activeCourse;
let activeLesson = 0;

function normalize(value) {
    return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function renderCatalog() {
    const term = normalize($('search').value.trim());
    const level = $('level').value;
    const matching = courses.filter((course) =>
        (!level || course.level === level)
        && normalize([course.title, course.description, courseText(course).title, courseText(course).description, course.level].join(' ')).includes(term)
    );

    $('results').textContent = matching.length
        ? `${matching.length} ${matching.length === 1 ? tr('curso de muestra', 'sample course') : tr('cursos de muestra', 'sample courses')}`
        : tr('No se encontraron cursos. Prueba otra búsqueda o cambia el nivel.', 'No courses found. Try another search or level.');

    $('course-list').innerHTML = matching.map((course) => {
        const { title, description } = courseText(course);
        const levelLabel = course.level === 'Inicial' ? tr('Inicial', 'Beginner') : tr('Intermedio', 'Intermediate');
        return `
        <article class="card">
            <img src="./media/${course.image}.jpg" alt="" loading="lazy" width="560" height="320">
            <div class="card-body">
                <p class="card-meta">${levelLabel} · ${course.lessons.length} ${tr('lecciones', 'lessons')}</p>
                <h3>${title}</h3>
                <p>${description}</p>
                <div class="card-bottom">
                    <strong>${currency(course.price)}</strong>
                    <button class="button outline" type="button" data-course="${course.id}" aria-label="${tr('Ver curso', 'View course')}: ${title}">${tr('Ver curso', 'View course')}</button>
                </div>
            </div>
        </article>`;
    }).join('');
}

function lessonKey(index) {
    return `${activeCourse.id}:${index}`;
}

function renderProgress() {
    const count = activeCourse.lessons.filter((_, index) => completed.has(lessonKey(index))).length;
    $('progress').textContent = tr(`${count} de ${activeCourse.lessons.length} lecciones completadas`, `${count} of ${activeCourse.lessons.length} lessons completed`);
    $('lessons').innerHTML = courseText(activeCourse).lessons.map(([title], index) => `
        <button class="lesson" type="button" data-lesson="${index}" aria-current="${index === activeLesson}">
            ${completed.has(lessonKey(index)) ? '✓' : index + 1 + '.'} ${title}
        </button>`).join('');
    $('complete-lesson').textContent = completed.has(lessonKey(activeLesson))
        ? tr('Marcar como pendiente', 'Mark as incomplete')
        : tr('Marcar como completada', 'Mark as complete');
}

function selectLesson(index, focus = false) {
    activeLesson = index;
    const [title, description] = courseText(activeCourse).lessons[index];
    $('lesson-title').textContent = title;
    $('lesson-description').textContent = description;
    $('video-status').textContent = '';
    $('video-language').hidden = language === 'es';
    player.poster = `./media/${activeCourse.image}.jpg`;
    player.src = `./media/${activeCourse.id}-${index + 1}.mp4`;
    renderProgress();
    if (focus) $('lessons').querySelector(`[data-lesson="${index}"]`).focus();
}

function renderAddButton() {
    const added = cart.has(activeCourse.id);
    $('add-course').textContent = added ? tr('En el carrito', 'In cart') : tr('Añadir al carrito', 'Add to cart');
    $('add-course').disabled = added;
}

function openCourse(course, firstLesson = false) {
    activeCourse = course;
    $('course-title').textContent = courseText(course).title;
    $('course-description').textContent = courseText(course).description;
    $('course-price').textContent = `${currency(course.price)} · ${tr('Precio de ejemplo', 'Sample price')}`;
    renderAddButton();
    const next = course.lessons.findIndex((_, index) => !completed.has(lessonKey(index)));
    selectLesson(firstLesson ? 0 : Math.max(next, 0));
    courseDialog.showModal();
}

function renderCart() {
    const selected = courses.filter((course) => cart.has(course.id));
    $('cart-count').textContent = selected.length;
    $('cart-items').innerHTML = selected.length ? selected.map((course) => `
        <div class="cart-row"><div><strong>${courseText(course).title}</strong><br>${currency(course.price)}</div>
            <button class="button outline" type="button" data-remove="${course.id}" aria-label="${tr('Quitar', 'Remove')} ${courseText(course).title}">${tr('Quitar', 'Remove')}</button></div>
    `).join('') : tr('<p>Tu carrito está vacío.</p>', '<p>Your cart is empty.</p>');
    $('cart-total').textContent = `Total: ${currency(selected.reduce((sum, course) => sum + course.price, 0))}`;
    $('checkout').disabled = !selected.length;
}

$('search').addEventListener('input', renderCatalog);
$('level').addEventListener('change', renderCatalog);
$('course-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-course]');
    if (button) openCourse(courses.find((course) => course.id === button.dataset.course));
});
$('open-sample').addEventListener('click', () => openCourse(courses[0], true));
$('lessons').addEventListener('click', (event) => {
    const button = event.target.closest('[data-lesson]');
    if (button) selectLesson(Number(button.dataset.lesson), true);
});
courseDialog.addEventListener('close', () => player.pause());
player.addEventListener('error', () => {
    $('video-status').textContent = tr('No se pudo cargar el video. Selecciona la lección de nuevo para reintentar.', 'Could not load the video. Select the lesson again to retry.');
});
player.addEventListener('ended', () => {
    completed.add(lessonKey(activeLesson));
    storeSet('solara-demo-progress', completed);
    renderProgress();
});
$('complete-lesson').addEventListener('click', () => {
    const key = lessonKey(activeLesson);
    if (completed.has(key)) completed.delete(key);
    else completed.add(key);
    storeSet('solara-demo-progress', completed);
    renderProgress();
});
$('add-course').addEventListener('click', () => {
    cart.add(activeCourse.id);
    storeSet('solara-demo-cart', cart);
    renderAddButton();
    renderCart();
    courseDialog.close();
    $('checkout-status').textContent = '';
    cartDialog.showModal();
});
$('open-cart').addEventListener('click', () => {
    $('checkout-status').textContent = '';
    cartDialog.showModal();
});
$('cart-items').addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    cart.delete(button.dataset.remove);
    storeSet('solara-demo-cart', cart);
    renderCart();
    ($('cart-items').querySelector('[data-remove]') ?? cartDialog.querySelector('form button')).focus();
});
$('checkout').addEventListener('click', () => {
    if (!cart.size) return;
    cart.clear();
    storeSet('solara-demo-cart', cart);
    renderCart();
    $('checkout-status').textContent = tr('Simulación completada. No se realizó ningún cobro.', 'Demo checkout complete. You were not charged.');
    cartDialog.querySelector('form button').focus();
});

const savedLanguage = readSet('solara-language').has('en') ? 'en' : 'es';
$('language').value = savedLanguage;
language = savedLanguage;
$('language').addEventListener('change', () => {
    language = $('language').value;
    storeSet('solara-language', new Set([language]));
    renderLanguage();
});
renderLanguage();
