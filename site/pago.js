// Página de pago con PayPal. VISTA PREVIA: no se conecta a PayPal, no cobra ni envía datos.
// Para activarlo hará falta una cuenta de PayPal Business, su Client ID y un Worker que cree
// y capture la orden en el servidor (ver README, «Pagos»).
import { courses, payments, discountCodes, discountContactEmail } from './data.js';
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

// Código de descuento aplicado (solo en esta página; no se guarda).
let discount = null;
const normalizeCode = (value) => value.trim().toUpperCase().replace(/\s+/g, '');
const discountValue = (subtotal) => {
    if (!discount || !subtotal) return 0;
    const value = discount.percent ? (subtotal * discount.percent) / 100 : discount.amount;
    return Math.min(subtotal, Math.round(value * 100) / 100);
};

function renderSummary() {
    setTitle(tr('Pago', 'Payment'));
    const subject = encodeURIComponent(tr('Solicitud de código de descuento', 'Discount code request'));
    $('discount-help').innerHTML = `${tr('¿No tienes un código de descuento? Escríbenos a', 'Don’t have a discount code? Email us at')} <a href="mailto:${esc(discountContactEmail)}?subject=${subject}">${esc(discountContactEmail)}</a> ${tr('y pide el tuyo.', 'to request one.')}`;
    const list = items();
    const subtotal = list.reduce((sum, course) => sum + course.price, 0);
    const off = discountValue(subtotal);
    $('order-items').innerHTML = list.length
        ? list.map((course) => `<li><img src="./media/${course.image}.jpg" alt="" width="64" height="48"><span>${esc(courseText(course).title)}</span><strong>${esc(money(course.price))}</strong></li>`).join('')
        : `<li class="empty">${tr('Tu carrito está vacío.', 'Your cart is empty.')} <a href="./catalogo.html">${tr('Ver cursos', 'Browse courses')}</a></li>`;
    $('order-subtotal').textContent = money(subtotal);
    $('discount-line').hidden = !discount;
    $('discount-label').textContent = discount ? `(${discount.code})` : '';
    $('order-discount').textContent = discount ? `− ${money(off)}` : '';
    $('order-total').textContent = money(subtotal - off);
    $('discount-code').disabled = !list.length;
    $('discount-apply').disabled = !list.length;
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

function showDiscountMessage(text, isError) {
    const node = $('discount-message');
    node.textContent = text;
    node.classList.toggle('is-error', isError);
    $('discount-code').setAttribute('aria-invalid', String(isError));
}

$('discount-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const code = normalizeCode($('discount-code').value);
    if (!code) {
        showDiscountMessage(tr('Escribe un código de descuento.', 'Enter a discount code.'), true);
        $('discount-code').focus();
        return;
    }
    const found = discountCodes.find((entry) => entry.code === code);
    if (!found) {
        showDiscountMessage(tr(`El código «${code}» no es válido o ya venció.`, `The code “${code}” is not valid or has expired.`), true);
        $('discount-code').focus();
        return;
    }
    discount = found;
    $('discount-code').value = '';
    showDiscountMessage(tr(`Código aplicado: ${found.label[0]}.`, `Code applied: ${found.label[1]}.`), false);
    renderSummary();
});

$('discount-remove').addEventListener('click', () => {
    discount = null;
    showDiscountMessage(tr('Se quitó el código de descuento.', 'The discount code was removed.'), false);
    renderSummary();
    $('discount-code').focus();
});

onLanguage(renderSummary);
addEventListener('storage', ({ key }) => { if (key === 'solara-demo-cart') renderSummary(); });
