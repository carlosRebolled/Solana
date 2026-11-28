// Formulario «Escríbenos»: preguntas que no están en las frecuentes, comentarios, quejas o pedidos
// de ayuda. Se usa en el panel de Ayuda de todas las páginas y en la sección de preguntas de la portada.
// DEMOSTRACIÓN: Solara todavía no tiene un canal para recibir mensajes. Mientras `feedback.endpoint`
// (data.js) sea null, el mensaje se valida y se guarda solo en este navegador, y se avisa que no se
// envió. Con un endpoint real (por ejemplo, un Worker propio) se envía por POST en JSON.
import { feedback } from './data.js';

const storeKey = 'solara-demo-feedback';
const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'es');
const tr = (es, en) => (lang() === 'en' ? en : es);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

const kinds = () => [
    { id: 'pregunta', label: tr('Tengo una pregunta', 'I have a question'), hint: tr('Pregunta lo que no encontraste en las preguntas frecuentes.', 'Ask anything you did not find in the FAQ.'), submit: tr('Enviar pregunta', 'Send question') },
    { id: 'comentario', label: tr('Quiero dejar un comentario', 'I want to leave a comment'), hint: tr('Cuéntanos qué te gustó o qué mejorarías.', 'Tell us what you liked or what you would improve.'), submit: tr('Enviar comentario', 'Send comment') },
    { id: 'queja', label: tr('Quiero presentar una queja', 'I want to make a complaint'), hint: tr('Explica qué pasó y, si aplica, en qué curso o pedido. Lo revisamos con prioridad.', 'Explain what happened and, if relevant, which course or order. We review it first.'), submit: tr('Enviar queja', 'Send complaint') },
    { id: 'ayuda', label: tr('Necesito ayuda', 'I need help'), hint: tr('Describe el problema: qué intentabas hacer y qué viste en la pantalla.', 'Describe the problem: what you were trying to do and what you saw on screen.'), submit: tr('Pedir ayuda', 'Ask for help') }
];
const topics = () => [
    ['', tr('Elige un tema (opcional)', 'Choose a topic (optional)')],
    ['cursos', tr('Cursos y clases', 'Courses and lessons')],
    ['campus', tr('Mi cuenta y campus', 'My account and campus')],
    ['pagos', tr('Pagos y precios', 'Payments and pricing')],
    ['programas', tr('Programas de campo', 'Field programs')],
    ['instituciones', tr('Escuelas e instituciones', 'Schools and institutions')],
    ['otro', tr('Otro', 'Other')]
];

// HTML del formulario. `prefix` evita ids repetidos cuando hay más de uno en la página.
export function feedbackForm(prefix, { compact = false } = {}) {
    const list = kinds();
    return `<form class="feedback-form${compact ? ' is-compact' : ''}" data-feedback="${prefix}" novalidate>
        <fieldset class="feedback-kinds">
            <legend>${tr('¿Qué quieres hacer?', 'What would you like to do?')}</legend>
            ${list.map((kind, index) => `<label class="feedback-kind"><input type="radio" name="kind" value="${kind.id}" ${index === 0 ? 'checked' : ''}><span>${esc(kind.label)}</span></label>`).join('')}
        </fieldset>
        <p class="feedback-hint" id="${prefix}-hint" aria-live="polite">${esc(list[0].hint)}</p>
        <div class="feedback-row">
            <label class="feedback-field"><span>${tr('Tema', 'Topic')}</span>
                <select name="topic">${topics().map(([value, label]) => `<option value="${value}">${esc(label)}</option>`).join('')}</select></label>
            <label class="feedback-field feedback-reference" hidden><span>${tr('Curso o pedido (opcional)', 'Course or order (optional)')}</span>
                <input name="reference" type="text" maxlength="80" autocomplete="off" placeholder="${tr('Ej.: DEMO-0001', 'E.g. DEMO-0001')}"></label>
        </div>
        <label class="feedback-field"><span>${tr('Tu mensaje', 'Your message')}</span>
            <textarea name="message" id="${prefix}-message" rows="${compact ? 4 : 5}" maxlength="1000" required aria-describedby="${prefix}-count ${prefix}-message-error" placeholder="${tr('Escribe con tus palabras…', 'Write in your own words…')}"></textarea>
            <small class="feedback-count" id="${prefix}-count">0/1000</small>
            <small class="feedback-error" id="${prefix}-message-error" hidden></small></label>
        <div class="feedback-row">
            <label class="feedback-field"><span>${tr('Nombre (opcional)', 'Name (optional)')}</span><input name="name" type="text" maxlength="60" autocomplete="name"></label>
            <label class="feedback-field"><span>${tr('Correo para responderte', 'Email to reply to you')}</span><input name="email" id="${prefix}-email" type="email" maxlength="120" autocomplete="email" aria-describedby="${prefix}-email-error">
                <small class="feedback-error" id="${prefix}-email-error" hidden></small></label>
        </div>
        <label class="feedback-check"><input name="anonymous" type="checkbox"> ${tr('Enviar sin correo (no podremos responderte)', 'Send without email (we will not be able to reply)')}</label>
        <div class="feedback-actions">
            <button class="feedback-submit" type="submit">${esc(list[0].submit)}</button>
            <p class="feedback-status" role="status"></p>
        </div>
        <p class="feedback-privacy">${feedback.endpoint
            ? tr('Usamos tus datos solo para responder este mensaje.', 'We use your details only to reply to this message.')
            : tr('Demostración: el mensaje se guarda solo en este navegador y todavía no se envía a Solara.', 'Demo: the message is saved only in this browser and is not sent to Solara yet.')}</p>
    </form>`;
}

function showError(form, field, message) {
    const input = form.elements[field];
    const box = form.querySelector(`#${form.dataset.feedback}-${field}-error`);
    input.toggleAttribute('aria-invalid', Boolean(message));
    box.hidden = !message;
    box.textContent = message ?? '';
}

function validate(form) {
    const message = form.elements.message.value.trim();
    const email = form.elements.email.value.trim();
    const anonymous = form.elements.anonymous.checked;
    const errors = {};
    if (message.length < 10) errors.message = tr('Escribe al menos 10 caracteres para que podamos entenderte.', 'Write at least 10 characters so we can understand you.');
    if (!anonymous && !email) errors.email = tr('Escribe tu correo o marca «Enviar sin correo».', 'Enter your email or tick “Send without email”.');
    else if (email && !validEmail(email)) errors.email = tr('Revisa el correo: debe verse como nombre@dominio.com.', 'Check the email: it should look like name@domain.com.');
    showError(form, 'message', errors.message);
    showError(form, 'email', errors.email);
    return errors;
}

async function deliver(entry) {
    if (feedback.endpoint) {
        const response = await fetch(feedback.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) });
        if (!response.ok) throw new Error(String(response.status));
        return 'sent';
    }
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(storeKey)) ?? []; } catch { saved = []; }
    localStorage.setItem(storeKey, JSON.stringify([...saved, entry].slice(-20)));
    return 'demo';
}

// Un solo manejador para todos los formularios de la página (también los que se dibujan después).
function syncKind(form) {
    const kind = kinds().find((item) => item.id === form.elements.kind.value) ?? kinds()[0];
    form.querySelector('.feedback-hint').textContent = kind.hint;
    form.querySelector('.feedback-submit').textContent = kind.submit;
    form.querySelector('.feedback-reference').hidden = !['queja', 'ayuda'].includes(kind.id);
}
document.addEventListener('change', (event) => {
    const form = event.target.closest('form[data-feedback]');
    if (!form) return;
    if (event.target.name === 'kind') syncKind(form);
    if (event.target.name === 'anonymous') {
        form.elements.email.disabled = event.target.checked;
        if (event.target.checked) showError(form, 'email', null);
    }
});
document.addEventListener('input', (event) => {
    const form = event.target.closest('form[data-feedback]');
    if (!form) return;
    if (event.target.name === 'message') form.querySelector('.feedback-count').textContent = `${event.target.value.length}/1000`;
    if (event.target.matches('[aria-invalid]')) validate(form);
});
document.addEventListener('submit', async (event) => {
    const form = event.target.closest('form[data-feedback]');
    if (!form) return;
    event.preventDefault();
    const status = form.querySelector('.feedback-status');
    const errors = validate(form);
    const first = Object.keys(errors)[0];
    if (first) {
        status.textContent = tr('Revisa los campos marcados.', 'Check the highlighted fields.');
        status.dataset.tone = 'error';
        form.elements[first].focus();
        return;
    }
    const data = new FormData(form);
    const entry = {
        kind: data.get('kind'),
        topic: data.get('topic') || null,
        reference: String(data.get('reference') ?? '').trim() || null,
        message: String(data.get('message')).trim(),
        name: String(data.get('name') ?? '').trim() || null,
        email: form.elements.anonymous.checked ? null : String(data.get('email') ?? '').trim(),
        page: location.pathname.split('/').pop() || 'index.html',
        language: lang(),
        at: new Date().toISOString()
    };
    const button = form.querySelector('.feedback-submit');
    button.disabled = true;
    try {
        const result = await deliver(entry);
        const kind = kinds().find((item) => item.id === entry.kind);
        form.reset();
        syncKind(form);
        form.elements.email.disabled = false;
        form.querySelector('.feedback-count').textContent = '0/1000';
        status.dataset.tone = 'done';
        status.textContent = result === 'sent'
            ? tr(`✓ Recibimos tu mensaje (${kind.label.toLowerCase()}). Te responderemos al correo que dejaste.`, `✓ We received your message (${kind.label.toLowerCase()}). We will reply to the email you left.`)
            : tr('✓ Mensaje listo. Es una demostración: quedó guardado en este navegador y todavía no se envió a Solara.', '✓ Message ready. This is a demo: it was saved in this browser and has not been sent to Solara yet.');
    } catch {
        status.dataset.tone = 'error';
        status.textContent = tr('No se pudo enviar. Inténtalo de nuevo en unos minutos.', 'It could not be sent. Please try again in a few minutes.');
    } finally {
        button.disabled = false;
    }
});
