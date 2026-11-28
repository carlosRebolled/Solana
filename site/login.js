// Página de acceso. Las cuentas reales todavía no existen: el formulario valida los campos y
// explica la situación sin guardar ni enviar la contraseña. La cuenta de demostración abre el campus.
import { $, tr, onLanguage, setTitle, getSession, startDemoSession } from './ui.js';

if (getSession()) location.replace('./campus.html');

const message = $('login-message');
const show = (text, isError = false) => {
    message.textContent = text;
    message.classList.toggle('is-error', isError);
};

$('demo-login').addEventListener('click', () => {
    startDemoSession();
    location.href = './campus.html';
});

$('login-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const email = $('login-email');
    const password = $('login-password');
    const emailOk = email.value.trim() !== '' && email.checkValidity();
    const passwordOk = password.value.length >= 8;
    email.setAttribute('aria-invalid', String(!emailOk));
    password.setAttribute('aria-invalid', String(!passwordOk));
    if (!emailOk) { show(tr('Escribe un correo con el formato nombre@dominio.com.', 'Enter an email in the format name@domain.com.'), true); email.focus(); return; }
    if (!passwordOk) { show(tr('La contraseña debe tener al menos 8 caracteres.', 'The password must be at least 8 characters long.'), true); password.focus(); return; }
    password.value = '';
    show(tr('Las cuentas todavía no están activas, así que no pudimos iniciar tu sesión. Tu contraseña no se guardó ni se envió. Puedes entrar con la cuenta de demostración.', 'Accounts are not active yet, so we could not sign you in. Your password was not stored or sent. You can enter with the demo account.'));
});

$('forgot-link').addEventListener('click', (event) => {
    event.preventDefault();
    show(tr('La recuperación de contraseña estará disponible cuando se activen las cuentas.', 'Password recovery will be available once accounts are active.'));
});
$('signup-link').addEventListener('click', (event) => {
    event.preventDefault();
    show(tr('La creación de cuentas estará disponible pronto. Mientras tanto puedes ver las clases de muestra sin registrarte.', 'Account creation will be available soon. Meanwhile you can watch the sample lessons without signing up.'));
});

onLanguage(() => setTitle(tr('Iniciar sesión', 'Sign in')));
