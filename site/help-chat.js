const questions = [
    {
        es: ['¿Cómo empiezo una clase?', 'En el catálogo elige un curso y pulsa «Ver curso». La ficha se abre en otra pestaña, donde puedes ir a «Temario y videos».', 'Abrir catálogo'],
        en: ['How do I start a lesson?', 'Choose a course in the catalog and select “View course.” It opens in another tab, where you can go to “Syllabus and videos.”', 'Open catalog'],
        href: './catalogo.html'
    },
    {
        es: ['¿Necesito una cuenta?', 'Las clases de muestra están abiertas al público. Si marcas una lección como completada, el progreso se guarda en este navegador.'],
        en: ['Do I need an account?', 'Sample lessons are open to everyone. When you mark a lesson complete, your progress is saved in this browser.']
    },
    {
        es: ['¿El carrito cobra dinero?', 'El carrito es de demostración. Puedes comparar precios y simular una compra sin ingresar datos de pago.', 'Ver precios de muestra'],
        en: ['Does the cart charge money?', 'The cart is a demo. You can compare prices and simulate a purchase without entering payment details.', 'View sample prices'],
        href: './precios.html'
    },
    {
        es: ['¿Qué programas ofrece Solara?', 'En Programas puedes consultar las propuestas de giras educativas, retiros, actividades vacacionales, liderazgo CIT y expediciones.', 'Ver programas'],
        en: ['What programs does Solara offer?', 'Visit Programs to explore educational trips, retreats, holiday activities, CIT leadership and expeditions.', 'View programs'],
        href: './#programas'
    },
    {
        es: ['¿Cómo contacto a Solara?', 'El canal oficial se publicará en la sección Contacto.', 'Ir a Contacto'],
        en: ['How do I contact Solara?', 'The official contact channel will be published in the Contact section.', 'Go to Contact'],
        href: './#contacto'
    }
];

const widget = document.createElement('div');
widget.className = 'help-chat';
widget.innerHTML = `
    <section class="help-panel" id="solara-help-panel" aria-labelledby="solara-help-title" hidden>
        <header class="help-header">
            <h2 id="solara-help-title"></h2>
            <button class="help-close" type="button"></button>
        </header>
        <div class="help-body">
            <p class="help-intro"></p>
            <div class="help-questions"></div>
            <div class="help-answer" aria-live="polite" aria-atomic="true"></div>
        </div>
    </section>
    <button class="help-bubble" type="button" aria-expanded="false" aria-controls="solara-help-panel">
        <span class="help-icon" aria-hidden="true"></span><span class="help-label"></span>
    </button>`;
document.body.append(widget);

const bubble = widget.querySelector('.help-bubble');
const panel = widget.querySelector('.help-panel');
const close = widget.querySelector('.help-close');
const choices = widget.querySelector('.help-questions');
const answer = widget.querySelector('.help-answer');
let activeQuestion = null;
let language = 'es';
const tr = (es, en) => language === 'en' ? en : es;

function showAnswer() {
    answer.replaceChildren();
    for (const button of choices.children) {
        button.setAttribute('aria-pressed', String(Number(button.dataset.question) === activeQuestion));
    }
    if (activeQuestion === null) return;

    const entry = questions[activeQuestion];
    const [, message, label] = entry[language];
    const paragraph = document.createElement('p');
    paragraph.textContent = message;
    answer.append(paragraph);
    if (entry.href) {
        const link = document.createElement('a');
        link.href = entry.href;
        link.textContent = label;
        answer.append(link);
    }
}

function setOpen(open) {
    panel.hidden = !open;
    bubble.setAttribute('aria-expanded', String(open));
    (open ? close : bubble).focus();
}

bubble.addEventListener('click', () => setOpen(panel.hidden));
close.addEventListener('click', () => setOpen(false));
widget.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
        event.preventDefault();
        setOpen(false);
    }
});
choices.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-question]');
    if (!button) return;
    activeQuestion = Number(button.dataset.question);
    showAnswer();
});
answer.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
});

export function renderHelpChat(locale) {
    language = locale;
    widget.querySelector('.help-label').textContent = tr('Ayuda', 'Help');
    widget.querySelector('#solara-help-title').textContent = tr('Ayuda Solara', 'Solara Help');
    widget.querySelector('.help-intro').textContent = tr('Elige una pregunta frecuente.', 'Choose a frequently asked question.');
    close.textContent = tr('Cerrar', 'Close');
    choices.replaceChildren(...questions.map((entry, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.question = index;
        button.textContent = entry[language][0];
        return button;
    }));
    showAnswer();
}
