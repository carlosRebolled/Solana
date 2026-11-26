// Página de pago con PayPal. VISTA PREVIA: no se conecta a PayPal, no cobra ni envía datos.
// Para activarlo hará falta una cuenta de PayPal Business, su Client ID y un Worker que cree
// y capture la orden en el servidor (ver README, «Pagos»).
import { courses, payments } from './data.js';
import { $, tr, esc, courseText, onLanguage, setTitle } from './ui.js';

const money = (amount) => new Intl.NumberFormat(tr('es-CR', 'en-US'), { style: 'currency', currency: 'USD', currencyDisplay: 'code', maximumFractionDigits: 2 }).format(amount);

const readCart = () => {
    try {
        const stored = JSON.parse(localStorage.getItem('solara-demo-cart'));
        return new Set(Array.isArray(stored) ? stored : []);
    } catch {
        return new Set();
    }
};

function items() {
    const cart = readCart();
    return courses.filter((course) => cart.has(course.id) && course.price !== null);
}

function renderSummary() {
    setTitle(tr('Pago', 'Payment'));
    const list = items();
    const total = list.reduce((sum, course) => sum + course.price, 0);
    $('order-items').innerHTML = list.length
        ? list.map((course) => `<li><img src="./media/${course.image}.jpg" alt="" width="64" height="48"><span>${esc(courseText(course).title)}</span><strong>${esc(money(course.price))}</strong></li>`).join('')
        : `<li class="empty">${tr('Tu carrito está vacío.', 'Your cart is empty.')} <a href="./catalogo.html">${tr('Ver cursos', 'Browse courses')}</a></li>`;
    $('order-subtotal').textContent = money(total);
    $('order-total').textContent = money(total);
    $('paypal-button').disabled = !list.length;
}

function validate() {
    const checks = [
        ['buyer-name', (input) => input.value.trim().length >= 2, tr('Escribe tu nombre completo.', 'Enter your full name.')],
        ['buyer-email', (input) => input.value.trim() !== '' && input.checkValidity(), tr('Escribe un correo con el formato nombre@dominio.com.', 'Enter an email in the format name@domain.com.')],
        ['buyer-country', (input) => input.value !== '', tr('Elige tu país.', 'Choose your country.')],
        ['buyer-terms', (input) => input.checked, tr('Debes aceptar las condiciones de compra para continuar.', 'You must accept the terms of purchase to continue.')]
    ];
    for (const [id, test] of checks) $(id).setAttribute('aria-invalid', String(!test($(id))));
    const failed = checks.find(([id, test]) => !test($(id)));
    return failed ? { id: failed[0], message: failed[2] } : null;
}

$('checkout-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const message = $('checkout-message');
    const error = validate();
    message.classList.toggle('is-error', Boolean(error));
    if (error) {
        message.textContent = error.message;
        $(error.id).focus();
        return;
    }
    // Sin cuenta configurada no se abre PayPal: solo se informa. Los datos del formulario no se guardan.
    if (!payments.paypal.enabled) {
        message.textContent = tr(
            'Todo listo para pagar, pero PayPal todavía no está conectado. Es una vista previa: no se realizó ningún cobro y tus datos no se enviaron ni se guardaron.',
            'Everything is ready to pay, but PayPal is not connected yet. This is a preview: no charge was made and your details were not sent or stored.'
        );
    }
});

onLanguage(renderSummary);
addEventListener('storage', ({ key }) => { if (key === 'solara-demo-cart') renderSummary(); });
