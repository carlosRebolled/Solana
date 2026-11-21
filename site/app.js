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

const $ = (id) => document.getElementById(id);
const currency = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'USD', currencyDisplay: 'code', maximumFractionDigits: 0 });

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
        && normalize([course.title, course.description, course.level].join(' ')).includes(term)
    );

    $('results').textContent = matching.length
        ? `${matching.length} ${matching.length === 1 ? 'curso disponible' : 'cursos disponibles'}`
        : 'No se encontraron cursos. Prueba otra búsqueda o cambia el nivel.';

    $('course-list').innerHTML = matching.map((course) => `
        <article class="card">
            <img src="./media/${course.image}.jpg" alt="" loading="lazy" width="560" height="320">
            <div class="card-body">
                <p class="card-meta">${course.level} · ${course.lessons.length} lecciones</p>
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <div class="card-bottom">
                    <strong>${currency.format(course.price)}</strong>
                    <button class="button outline" type="button" data-course="${course.id}" aria-label="Ver curso: ${course.title}">Ver curso</button>
                </div>
            </div>
        </article>`).join('');
}

function lessonKey(index) {
    return `${activeCourse.id}:${index}`;
}

function renderProgress() {
    const count = activeCourse.lessons.filter((_, index) => completed.has(lessonKey(index))).length;
    $('progress').textContent = `${count} de ${activeCourse.lessons.length} lecciones completadas`;
    $('lessons').innerHTML = activeCourse.lessons.map(([title], index) => `
        <button class="lesson" type="button" data-lesson="${index}" aria-current="${index === activeLesson}">
            ${completed.has(lessonKey(index)) ? '✓' : index + 1 + '.'} ${title}
        </button>`).join('');
    $('complete-lesson').textContent = completed.has(lessonKey(activeLesson))
        ? 'Marcar como pendiente'
        : 'Marcar como completada';
}

function selectLesson(index, focus = false) {
    activeLesson = index;
    const [title, description] = activeCourse.lessons[index];
    $('lesson-title').textContent = title;
    $('lesson-description').textContent = description;
    $('video-status').textContent = '';
    player.poster = `./media/${activeCourse.image}.jpg`;
    player.src = `./media/${activeCourse.id}-${index + 1}.mp4`;
    renderProgress();
    if (focus) $('lessons').querySelector(`[data-lesson="${index}"]`).focus();
}

function renderAddButton() {
    const added = cart.has(activeCourse.id);
    $('add-course').textContent = added ? 'En el carrito' : 'Añadir al carrito';
    $('add-course').disabled = added;
}

function openCourse(course, firstLesson = false) {
    activeCourse = course;
    $('course-title').textContent = course.title;
    $('course-description').textContent = course.description;
    $('course-price').textContent = `${currency.format(course.price)} · Precio de ejemplo`;
    renderAddButton();
    const next = course.lessons.findIndex((_, index) => !completed.has(lessonKey(index)));
    selectLesson(firstLesson ? 0 : Math.max(next, 0));
    courseDialog.showModal();
}

function renderCart() {
    const selected = courses.filter((course) => cart.has(course.id));
    $('cart-count').textContent = selected.length;
    $('cart-items').innerHTML = selected.length ? selected.map((course) => `
        <div class="cart-row"><div><strong>${course.title}</strong><br>${currency.format(course.price)}</div>
            <button class="button outline" type="button" data-remove="${course.id}" aria-label="Quitar ${course.title}">Quitar</button></div>
    `).join('') : '<p>Tu carrito está vacío.</p>';
    $('cart-total').textContent = `Total: ${currency.format(selected.reduce((sum, course) => sum + course.price, 0))}`;
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
    $('video-status').textContent = 'No se pudo cargar el video. Selecciona la lección de nuevo para reintentar.';
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
    $('checkout-status').textContent = 'Simulación completada. No se realizó ningún cobro. Las lecciones de muestra siguen disponibles en el catálogo.';
    cartDialog.querySelector('form button').focus();
});

renderCatalog();
renderCart();
