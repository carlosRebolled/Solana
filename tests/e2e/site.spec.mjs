// Pruebas funcionales, responsive y de accesibilidad básica del sitio público.
import { test, expect } from '@playwright/test';

const routes = [
    '/', '/catalogo.html', '/catalogo.html?escuela=biodiversidad', '/escuelas.html', '/escuelas.html?area=campo',
    '/escuelas.html?area=paisaje', '/escuelas.html?area=no-existe', '/ruta.html', '/ruta.html?ruta=direccion-campamentos',
    '/ruta.html?ruta=no-existe', '/curso.html?curso=campo', '/curso.html?curso=gestion-riesgos', '/curso.html?curso=no-existe',
    '/precios.html', '/precios.html?modalidad=instituciones', '/pago.html', '/login.html', '/mi-cuenta.html', '/programas.html', '/publico.html', '/nosotros.html', '/contacto.html', '/blog.html', '/articulo.html?articulo=cuaderno-de-campo'
];

const viewports = [[1920, 1080], [1440, 900], [1366, 768], [1024, 768], [768, 1024], [430, 932], [390, 844], [375, 667]];

function trackErrors(page) {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    // El navegador cancela (ERR_ABORTED) la descarga de un video al leer solo sus metadatos: no es un error.
    page.on('requestfailed', (request) => {
        const aborted = request.failure()?.errorText === 'net::ERR_ABORTED' && request.url().endsWith('.mp4');
        if (!aborted) errors.push(`${request.url()} ${request.failure()?.errorText}`);
    });
    return errors;
}

for (const route of routes) {
    test(`abre ${route} sin errores y con un solo h1`, async ({ page }) => {
        const errors = trackErrors(page);
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1:visible')).toHaveCount(1);
        if (!/blog|articulo/.test(route)) await expect(page.locator('#site-footer .footer-column').first()).toBeVisible();
        const unnamed = await page.$$eval('button, a[href]', (items) => items.filter((item) => item.checkVisibility() && !(item.getAttribute('aria-label') || item.textContent.trim() || item.querySelector('img[alt]:not([alt=""])'))).map((item) => item.outerHTML.slice(0, 80)));
        expect(unnamed, 'botones o enlaces sin nombre accesible').toEqual([]);
        const noAlt = await page.$$eval('img', (images) => images.filter((image) => !image.hasAttribute('alt')).map((image) => image.src));
        expect(noAlt, 'imágenes sin atributo alt').toEqual([]);
        expect(errors).toEqual([]);
    });
}

test.describe('responsive', () => {
    for (const [width, height] of viewports) {
        for (const route of ['/', '/catalogo.html', '/escuelas.html?area=campo', '/ruta.html?ruta=observador-de-campo', '/curso.html?curso=campo', '/precios.html', '/login.html', '/mi-cuenta.html?demo']) {
            test(`${route} sin desbordamiento horizontal a ${width}�${height}`, async ({ page }) => {
                await page.setViewportSize({ width, height });
                await page.goto(route);
                await page.waitForLoadState('networkidle');
                const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
                expect(overflow).toBeLessThanOrEqual(0);
                const clipped = await page.$$eval('h1, h2, h3', (headings) => headings.filter((heading) => heading.checkVisibility() && !heading.classList.contains('sr-only') && heading.scrollWidth > heading.clientWidth + 2).map((heading) => heading.textContent.trim().slice(0, 40)));
                expect(clipped, 'títulos cortados').toEqual([]);
            });
        }
    }
});

test('menú móvil: abre, bloquea el scroll y se cierra con Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/catalogo.html');
    const toggle = page.locator('#navigation-toggle');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#main-navigation a').first()).toBeFocused();
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await toggle.click();
    await page.locator('.nav-close').click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('portada: hero anterior con «Explora por tema» y catálogo con la oferta', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#hero-title')).toHaveText('Aprende más allá del aula');
    await page.locator('#topic-buttons [data-topic="biodiversidad"]').click();
    await expect(page.locator('#featured-course h3')).toHaveText('Observación de biodiversidad');
    await expect(page.locator('#course-list .card')).toHaveCount(23);
    await expect(page.locator('#results')).toHaveText('23 cursos · 3 con clases de muestra');
    await page.selectOption('#catalog-topic', 'camp-management');
    await expect(page.locator('#course-list .card')).toHaveCount(4);
});

test('portada: banner desactivado sin campaña y vista previa con cuenta regresiva real', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#promo-banner')).toBeHidden();
    await page.goto('/?promo=preview');
    const first = await page.locator('#countdown').innerText();
    await page.waitForTimeout(1200);
    expect(await page.locator('#countdown').innerText()).not.toBe(first);
});

test('portada: carrusel de escuelas con botones y límites', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const prev = page.locator('#schools-prev-ui');
    const next = page.locator('#schools-next-ui');
    await expect(prev).toBeDisabled();
    await next.click();
    await expect(prev).toBeEnabled();
    for (let i = 0; i < 6; i += 1) if (await next.isEnabled()) await next.click();
    await expect(next).toBeDisabled();
});

test('portada: vitrina cambia de paso y el ejercicio se valida', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const top = await page.locator('#showcase-steps').evaluate((node) => node.getBoundingClientRect().top + scrollY);
    const height = await page.locator('#showcase-steps').evaluate((node) => node.offsetHeight);
    await page.evaluate(([y]) => scrollTo(0, y), [top + (height - 900) * .85]);
    await expect(page.locator('.feature-card[data-step="2"]')).toHaveAttribute('data-active', 'true');
    await page.locator('#quiz-check').click();
    await expect(page.locator('#quiz-result')).toContainText('Elige una respuesta');
    await page.locator('#quiz-options input').first().check();
    await page.locator('#quiz-check').click();
    await expect(page.locator('#quiz-result')).toContainText('Correcto');
    await page.locator('#quiz-next').click();
    await expect(page.locator('#quiz-question')).toContainText('2/2');
});

test('catálogo: filtros, URL y estado vacío', async ({ page }) => {
    await page.goto('/catalogo.html');
    await page.selectOption('#catalog-school', 'biodiversidad');
    await expect(page).toHaveURL(/escuela=biodiversidad/);
    await expect(page.locator('.course-row')).toHaveCount(6);
    await page.fill('#catalog-search', 'zzzz');
    await expect(page.locator('.empty-state')).toBeVisible();
    await page.locator('.empty-state button').click();
    await expect(page).toHaveURL(/catalogo\.html$/);
    await page.goto('/catalogo.html?ruta=direccion-campamentos');
    await expect(page.locator('#catalog-path')).toHaveValue('direccion-campamentos');
    await expect(page.locator('.course-row h3')).toHaveText(['Gestión de riesgos outdoor para escuelas, campamentos y programas juveniles', 'Formación de camp counselors y personal de programas juveniles', 'Protección de menores para campamentos y programas al aire libre', 'Diseño y gestión de programas de summer camp']);
});

test('navegación: portada �  escuela �  ruta �  curso �  vista previa', async ({ page }) => {
    await page.goto('/');
    await page.locator('#schools-track a').first().click();
    await expect(page).toHaveURL(/escuelas\.html\?area=campo/);
    await page.locator('.path-card a.btn-primary').first().click();
    await expect(page).toHaveURL(/ruta\.html\?ruta=/);
    await page.locator('.path-course h3 a').first().click();
    await expect(page).toHaveURL(/curso\.html\?curso=campo/);
    await page.locator('#preview-play').click();
    await expect(page.locator('#lesson-preview')).toHaveAttribute('data-state', /loading|ready/);
    await expect(page.locator('#lesson-preview video')).toBeVisible();
});

test('curso: temario plegable y curso en preparación sin video', async ({ page }) => {
    await page.goto('/curso.html?curso=campo');
    const toggle = page.locator('.module-toggle').first();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await page.goto('/curso.html?curso=gestion-riesgos');
    await expect(page.locator('#add-course')).toBeDisabled();
    await expect(page.locator('.lesson-row[data-locked="true"]')).toHaveCount(5);
    await expect(page.locator('#course-status')).toContainText('Lanzamiento prioritario');
    await expect(page.locator('#video-status')).toContainText('en preparación');
});

test('precios: el selector cambia las tarjetas y el selector de grupo respeta límites', async ({ page }) => {
    await page.goto('/precios.html');
    await expect(page.locator('#price-plans .pricing-card h3')).toHaveText(['Lecciones de muestra', 'Curso individual']);
    await page.locator('#price-audience [data-audience="instituciones"]').click();
    await expect(page.locator('#price-plans .pricing-card h3')).toHaveText(['Programas a medida', 'Capacitación institucional']);
    await page.locator('#price-audience [aria-selected="true"]').press('ArrowLeft');
    await expect(page.locator('#price-audience [data-audience="personas"]')).toHaveAttribute('aria-selected', 'true');
    await page.locator('#price-audience [data-audience="instituciones"]').click();
    await page.fill('#group-grupo', '2');
    await page.locator('#group-grupo').dispatchEvent('change');
    await expect(page.locator('#group-grupo')).toHaveValue('5');
    await expect(page.locator('.stepper [data-delta="-1"]')).toBeDisabled();
});

test('idioma: el cambio a inglés traduce las partes generadas', async ({ page }) => {
    await page.goto('/');
    await page.selectOption('#language', 'en');
    await expect(page.locator('#hero-title')).toContainText('Learn');
    await expect(page.locator('#site-footer h3').first()).toHaveText('Schools');
    await expect(page.locator('#schools-title')).toHaveText('Choose what to learn today');
    await page.selectOption('#language', 'es');
});

test('carrito: lleva a la página de pago con PayPal en vista previa, sin cobrar ni enviar datos', async ({ page }) => {
    const external = [];
    page.on('request', (request) => { if (!request.url().startsWith('http://127.0.0.1')) external.push(request.url()); });
    await page.goto('/curso.html?curso=campo');
    await page.locator('#add-course').click();
    await expect(page.locator('#cart-dialog')).toBeVisible();
    await expect(page.locator('#cart-count')).toHaveText('1');
    await page.locator('#checkout').click();
    await expect(page).toHaveURL(/pago.html/);
    await expect(page.locator('#order-items li')).toHaveCount(1);
    await expect(page.locator('#order-total')).toContainText('29');
    await page.locator('#paypal-button').click();
    await expect(page.locator('#checkout-message')).toContainText('nombre completo');
    await page.fill('#buyer-name', 'Persona de prueba');
    await page.fill('#buyer-email', 'prueba@example.com');
    await page.selectOption('#buyer-country', 'CR');
    await page.locator('#paypal-button').click();
    await expect(page.locator('#checkout-message')).toContainText('condiciones');
    await page.check('#buyer-terms');
    await page.locator('#paypal-button').click();
    await expect(page.locator('#checkout-message')).toContainText('no se realizó ningún cobro');
    expect(external, 'peticiones externas').toEqual([]);
    expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('prueba@example.com');
});

test('pago: con el carrito vacío no se puede pagar', async ({ page }) => {
    await page.goto('/pago.html');
    await expect(page.locator('#order-items .empty')).toBeVisible();
    await expect(page.locator('#paypal-button')).toBeDisabled();
});

test('movimiento reducido: sin animaciones', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const animated = await page.$$eval('.goal-chip', (chips) => chips.filter((chip) => getComputedStyle(chip).animationName !== 'none').length);
    expect(animated).toBe(0);
});


test('menú: cada enlace abre su propia página, sin anclas a la portada', async ({ page }) => {
    for (const route of ['/', '/catalogo.html', '/blog.html']) {
        await page.goto(route);
        const hrefs = await page.$$eval('#main-navigation a, #site-footer a, .footer a', (links) => links.map((link) => link.getAttribute('href')));
        expect(hrefs.filter((href) => /^(\.\/)?#/.test(href)), route).toEqual([]);
    }
    for (const [link, url, heading] of [['Programas', /programas\.html/, 'Programas y soluciones'], ['Público', /publico\.html/, 'Público'], ['Contacto', /contacto\.html/, 'Contacto']]) {
        await page.goto('/');
        await page.locator('#main-navigation a', { hasText: link }).click();
        await expect(page).toHaveURL(url);
        await expect(page.locator('h1')).toHaveText(heading);
    }
});

test('curso: las pestañas abren cada sección en una ventana sin mover la página', async ({ page }) => {
    await page.goto('/curso.html?curso=campo');
    await page.waitForLoadState('networkidle');
    const before = await page.evaluate(() => scrollY);
    const tab = page.locator('.course-tabs a[href="#temario"]');
    await tab.click();
    const dialog = page.locator('#section-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.locator('#section-dialog-title')).toHaveText('Temario');
    expect(await page.evaluate(() => scrollY)).toBe(before);
    await dialog.locator('[data-open-lesson="1"]').click();
    await expect(page.locator('#section-dialog-title')).toHaveText('Clases');
    await expect(dialog.locator('#player')).toBeVisible();
    await expect(page.locator('#lessons [data-lesson="1"]')).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('#temario #course-syllabus')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('#lecciones #player')).toHaveCount(1);
    await expect(tab).toBeFocused();
    for (const [id, title] of [['aprendizaje', 'Qué aprenderás'], ['docentes', 'Quién enseña el curso'], ['opiniones', 'Opiniones']]) {
        await page.locator(`.course-tabs a[href="#${id}"]`).click();
        await expect(page.locator('#section-dialog-title')).toHaveText(title);
        await page.locator('#section-dialog-close').click();
        await expect(dialog).toBeHidden();
    }
});

test('acceso: botón arriba a la derecha, cuenta de demostración y cierre de sesión', async ({ page }) => {
    for (const route of ['/', '/catalogo.html', '/blog.html']) {
        await page.goto(route);
        await expect(page.locator('#account-link')).toHaveAttribute('href', './login.html');
    }
    await page.locator('#account-link').click();
    await expect(page).toHaveURL(/login.html/);
    await page.fill('#login-email', 'persona@example.com');
    await page.fill('#login-password', 'contraseña-larga');
    await page.locator('#login-form button[type=submit]').click();
    await expect(page.locator('#login-message')).toContainText('no se guardó ni se envió');
    await expect(page.locator('#login-password')).toHaveValue('');
    expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('contraseña-larga');
    await page.evaluate(() => localStorage.setItem('solara-demo-progress', JSON.stringify(['campo:0'])));
    await page.locator('#demo-login').click();
    await expect(page).toHaveURL(/mi-cuenta.html/);
    await expect(page.locator('h1')).toContainText('Cuenta de demostración');
    await expect(page.locator('#account-link')).toHaveText('Mi cuenta');
    await expect(page.locator('#mis-cursos tbody tr')).toHaveCount(3);
    await expect(page.locator('#resumen .stat-cards dd').nth(1)).toHaveText('1/6');
    await expect(page.locator('#pagos tbody tr')).toHaveCount(2);
    await expect(page.locator('#pagos tfoot')).toContainText('68');
    await expect(page.locator('.resume-card a')).toHaveAttribute('href', /curso=campo&leccion=2/);
    await expect(page.locator('#stat-watched')).toHaveText(/^\d+:\d{2}$/);
    await page.locator('#logout').click();
    await expect(page).toHaveURL(/login.html/);
    await expect(page.locator('#account-link')).toHaveText('Iniciar sesión');
    await page.goto('/mi-cuenta.html');
    await expect(page.locator('h1')).toHaveText('Mi cuenta');
    await expect(page.locator('#account-page a.btn')).toHaveAttribute('href', './login.html');
});

test('pago: código de descuento válido, inválido y quitar', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('solara-demo-cart', JSON.stringify(['campo', 'biodiversidad'])));
    await page.goto('/pago.html');
    await expect(page.locator('#order-total')).toContainText('68');
    await page.locator('#discount-apply').click();
    await expect(page.locator('#discount-message')).toContainText('Escribe un código');
    await page.fill('#discount-code', 'NOEXISTE');
    await page.locator('#discount-apply').click();
    await expect(page.locator('#discount-message')).toContainText('no es válido');
    await expect(page.locator('#discount-line')).toBeHidden();
    await page.fill('#discount-code', ' bienvenida10 ');
    await page.keyboard.press('Enter');
    await expect(page.locator('#discount-line')).toBeVisible();
    await expect(page.locator('#order-discount')).toContainText('6,8');
    await expect(page.locator('#order-total')).toContainText('61,2');
    await page.fill('#discount-code', 'CAMPO5');
    await page.locator('#discount-apply').click();
    await expect(page.locator('#order-total')).toContainText('63');
    await page.locator('#discount-remove').click();
    await expect(page.locator('#discount-line')).toBeHidden();
    await expect(page.locator('#order-total')).toContainText('68');
});
