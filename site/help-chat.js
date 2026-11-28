// Panel de Ayuda en todas las páginas: abre directo el formulario «Escríbenos» (preguntas propias,
// comentarios, quejas o pedidos de ayuda). Las preguntas frecuentes están en la portada.
import { feedbackForm } from './feedback.js';

const widget = document.createElement('div');
widget.className = 'help-chat';
widget.innerHTML = `
    <section class="help-panel" id="solara-help-panel" aria-labelledby="solara-help-title" hidden>
        <header class="help-header">
            <h2 id="solara-help-title"></h2>
            <button class="help-close" type="button"></button>
        </header>
        <div class="help-body" id="help-pane-write"></div>
    </section>
    <button class="help-bubble" type="button" aria-expanded="false" aria-controls="solara-help-panel">
        <span class="help-icon" aria-hidden="true"></span><span class="help-label"></span>
    </button>`;
document.body.append(widget);

const bubble = widget.querySelector('.help-bubble');
const panel = widget.querySelector('.help-panel');
const close = widget.querySelector('.help-close');
let language = 'es';
const tr = (es, en) => (language === 'en' ? en : es);

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

// Abre el panel de ayuda desde otros botones de la página.
export function openHelp() {
    if (panel.hidden) setOpen(true);
    panel.querySelector('.feedback-kind input:checked')?.focus();
}

export function renderHelpChat(locale) {
    language = locale;
    widget.querySelector('.help-label').textContent = tr('Ayuda', 'Help');
    widget.querySelector('#solara-help-title').textContent = tr('Escríbenos', 'Write to us');
    close.textContent = tr('Cerrar', 'Close');
    widget.querySelector('#help-pane-write').innerHTML = `<p class="help-intro">${tr('Haz una pregunta, deja un comentario, presenta una queja o pide ayuda, con tus palabras.', 'Ask a question, leave a comment, make a complaint or ask for help, in your own words.')}</p>${feedbackForm('help', { compact: true })}`;
}
