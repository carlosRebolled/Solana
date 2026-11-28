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

test('menú móvil: abre, enfoca el primer enlace y se cierra con Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/catalogo.html');
    const toggle = page.locator('#navigation-toggle');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#main-navigation a').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await toggle.click();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('portada: encabezado del sitio, blog, catálogo de 6 cursos por página con números e historias', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#main-navigation a')).toHaveText(['Cursos', 'Programas', 'Público', 'Blog']);
    await expect(page.locator('#find-lessons')).toBeVisible();
    await expect(page.locator('#account-link')).toHaveText('Iniciar sesión');
    await expect(page.locator('#open-cart')).toBeVisible();
    await expect(page.locator('#language')).toBeVisible();
    // Orden: temario, blog, catálogo, antes y después, historias, precio y preguntas.
    const order = await page.evaluate(() => ['temario', 'blog', 'cursos', 'resultados', 'historias', 'precio', 'preguntas'].map((id) => document.getElementById(id).getBoundingClientRect().top));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    await expect(page.locator('#docente')).toHaveCount(0);
    // Historias desde el campo: tarjetas de ejemplo en carrusel.
    await expect(page.locator('#stories-track .testimonial-card')).toHaveCount(4);
    await expect(page.locator('#stories-track .demo-badge').first()).toHaveText('Ejemplo');
    await expect(page.locator('#stories-prev')).toBeDisabled();
    await page.locator('#stories-next').click();
    await expect(page.locator('#stories-prev')).toBeEnabled();
    await expect(page.locator('#catalog-title')).toHaveText('¿Qué quieres aprender?');
    await expect(page.locator('#results')).toHaveText('23 cursos · 3 con clases de muestra');
    await expect(page.locator('#course-list .card')).toHaveCount(6);
    await expect(page.locator('#course-pages .page-dot')).toHaveText(['1', '2', '3', '4']);
    await expect(page.locator('#course-pages [aria-current="page"]')).toHaveText('1');
    await expect(page.locator('#course-pages .page-step').first()).toBeDisabled();
    await page.locator('#course-pages .page-dot', { hasText: '2' }).click();
    await expect(page.locator('#course-pages [aria-current="page"]')).toHaveText('2');
    await expect(page.locator('#course-list .card')).toHaveCount(6);
    await page.locator('#course-pages .page-step').last().click();
    await page.locator('#course-pages .page-step').last().click();
    await expect(page.locator('#course-pages [aria-current="page"]')).toHaveText('4');
    await expect(page.locator('#course-list .card')).toHaveCount(5);
    await expect(page.locator('#course-pages .page-step').last()).toBeDisabled();
    // Al filtrar vuelve a la primera página; con 6 o menos cursos no hay números.
    await page.selectOption('#catalog-topic', 'camp-management');
    await expect(page.locator('#course-list .card')).toHaveCount(4);
    await expect(page.locator('#course-pages')).toBeHidden();
    await page.locator('#clear-filters').click();
    await expect(page.locator('#course-pages [aria-current="page"]')).toHaveText('1');
    // Blog: los 3 artículos más recientes.
    await expect(page.locator('#home-posts > *')).toHaveCount(3);
});

test('tema: todas las páginas usan el fondo verde oscuro de la portada', async ({ page }) => {
    for (const route of ['/', '/publico.html', '/catalogo.html', '/blog.html', '/precios.html', '/curso-campo.html', '/login.html', '/contacto.html']) {
        await page.goto(route);
        const colors = await page.evaluate(() => [getComputedStyle(document.body).backgroundColor, getComputedStyle(document.querySelector('h1')).color]);
        expect(colors, route).toEqual(['rgb(38, 51, 47)', 'rgb(243, 245, 237)']);
    }
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
    await page.locator('#site-footer a', { hasText: 'Estudios de campo' }).first().click();
    await expect(page).toHaveURL(/escuela-campo\.html/);
    await page.locator('.path-card a.btn-primary').first().click();
    await expect(page).toHaveURL(/ruta-[a-z-]+\.html/);
    await page.locator('.path-course h3 a').first().click();
    await expect(page).toHaveURL(/curso-campo\.html/);
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
    await expect(page.locator('#hero-title')).toHaveText('Turn every outing into real learning');
    await expect(page.locator('#site-footer h3').first()).toHaveText('Schools');
    await expect(page.locator('#catalog-title')).toHaveText('What would you like to learn?');
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
    for (const [link, url, heading] of [['Programas', /programas\.html/, 'Programas y soluciones'], ['Público', /publico\.html/, 'Público'], ['Blog', /blog\.html/, 'Lo último del blog de Solara']]) {
        await page.goto('/');
        await page.locator('#main-navigation a', { hasText: link }).click();
        await expect(page).toHaveURL(url);
        await expect(page.locator('h1')).toHaveText(heading);
    }
});

test('curso: las pestañas abren cada sección en una ventana sin mover la página', async ({ page }) => {
    await page.goto('/curso.html?curso=campo');
    await page.waitForLoadState('networkidle');
    const tab = page.locator('.course-tabs a[href="#temario"]');
    await tab.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => scrollY);
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
    await expect(page).toHaveURL(/campus.html/);
    await expect(page.locator('h1')).toContainText('Cuenta de demostración');
    await page.goto('/mi-cuenta.html');
    await expect(page.locator('#account-link')).toHaveText('Mi campus');
    await expect(page.locator('#account-link')).toHaveAttribute('href', './campus.html');
    await expect(page.locator('#mis-cursos tbody tr')).toHaveCount(3);
    await expect(page.locator('#resumen .stat-cards dd').nth(1)).toHaveText('1/6');
    await expect(page.locator('#pagos tbody tr')).toHaveCount(2);
    await expect(page.locator('#pagos tfoot')).toContainText('68');
    await expect(page.locator('.resume-card a.btn-primary')).toHaveAttribute('href', './campus.html#curso/campo/2');
    await expect(page.locator('#stat-watched')).toHaveText(/^\d+:\d{2}$/);
    await page.locator('#logout').click();
    await expect(page).toHaveURL(/login.html/);
    await expect(page.locator('#account-link')).toHaveText('Iniciar sesión');
    await page.goto('/mi-cuenta.html');
    await expect(page.locator('h1')).toHaveText('Mi cuenta');
    await expect(page.locator('#account-page a.btn')).toHaveAttribute('href', './login.html');
});

test('mi cuenta: pestañas con dirección propia y hoja de progreso por curso', async ({ page }) => {
    await page.goto('/login.html');
    await page.evaluate(() => localStorage.setItem('solara-demo-progress', JSON.stringify(['campo:0'])));
    await page.locator('#demo-login').click();
    await expect(page).toHaveURL(/campus.html/);
    await page.goto('/mi-cuenta.html');
    await expect(page.locator('#resumen')).toBeVisible();
    await expect(page.locator('#pagos')).toBeHidden();
    await page.locator('#tab-pagos').click();
    await expect(page).toHaveURL(/#pagos$/);
    await expect(page.locator('#pagos')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tab-perfil')).toBeFocused();
    await expect(page.locator('#perfil')).toBeVisible();
    await page.goto('/mi-cuenta.html#progreso/campo');
    await expect(page.locator('#tab-progreso')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.sheet-stats dd').first()).toHaveText('1/2');
    await page.locator('[data-toggle-lesson="1"]').click();
    await expect(page.locator('.sheet-stats dd').first()).toHaveText('2/2');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('solara-demo-progress')))).toContain('campo:1');
    await page.fill('#course-note', 'Llevar lupa');
    await expect(page.locator('#note-status')).toContainText('guardada');
    await page.locator('.sheet-picker a', { hasText: 'Observación de biodiversidad' }).click();
    await expect(page).toHaveURL(/#progreso\/biodiversidad$/);
    await expect(page.locator('.sheet h3')).toHaveText('Observación de biodiversidad');
    await page.goBack();
    await expect(page.locator('.sheet h3')).toHaveText('Fundamentos de trabajo de campo');
    await expect(page.locator('#course-note')).toHaveValue('Llevar lupa');
    await page.locator('#tab-mis-cursos').click();
    await page.locator('[data-filter="done"]').click();
    await expect(page.locator('#mis-cursos tbody tr:visible')).toHaveCount(1);
    await page.locator('[data-filter="new"]').click();
    await expect(page.locator('#mis-cursos tbody tr:visible')).toHaveCount(2);
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

test('pago: debajo del código aparece el correo para pedir un descuento', async ({ page }) => {
    await page.goto('/pago.html');
    const link = page.locator('#discount-help a');
    await expect(page.locator('#discount-help')).toContainText('¿No tienes un código de descuento?');
    await expect(link).toHaveText('prueba@prueba.com');
    await expect(link).toHaveAttribute('href', /^mailto:prueba@prueba\.com\?subject=/);
});

test('curso: tarjeta de progreso con anillo y temario con casillas que siguen al reproductor', async ({ page }) => {
    await page.goto('/curso.html?curso=campo');
    const card = page.locator('#course-progress-card');
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('data-status', 'new');
    await expect(card.locator('.progress-ring')).toHaveAttribute('aria-label', /^0%/);
    await expect(page.locator('#course-start')).toHaveAttribute('href', '#temario');
    await card.getByRole('link', { name: 'Empezar' }).click();
    const dialog = page.locator('#section-dialog');
    await expect(page.locator('#section-dialog-title')).toHaveText('Clases');
    await expect(page.locator('.course-tabs a[href="#lecciones"]')).toHaveAttribute('aria-current', 'true');
    await dialog.locator('#complete-lesson').click();
    await expect(page.locator('#lessons [data-lesson="0"]')).toHaveAttribute('data-done', 'true');
    await expect(page.locator('#progress-bar')).toHaveAttribute('style', /width: ?50%/);
    await page.keyboard.press('Escape');
    await expect(page.locator('.course-tabs a[aria-current]')).toHaveCount(0);
    await expect(card).toHaveAttribute('data-status', 'active');
    await expect(card.locator('.progress-ring')).toHaveAttribute('aria-label', /^50%/);
    await expect(card.getByRole('link', { name: 'Hoja de progreso' })).toHaveAttribute('href', './mi-cuenta.html#progreso/campo');
    await expect(page.locator('#course-syllabus .lesson-row[data-done="true"]')).toHaveCount(1);
    await expect(page.locator('#course-syllabus .module-progress')).toContainText('50%');
    await page.goto('/curso.html?curso=gestion-riesgos');
    await expect(page.locator('#course-progress-card')).toBeHidden();
});

test('campus: al iniciar sesión se abre el campus con su propia navegación y espacio de clase', async ({ page }) => {
    await page.goto('/campus.html');
    await expect(page).toHaveURL(/login.html/);
    await page.evaluate(() => localStorage.setItem('solara-demo-progress', JSON.stringify(['campo:0'])));
    await page.locator('#demo-login').click();
    await expect(page).toHaveURL(/campus.html/);
    await expect(page.locator('header.top')).toHaveCount(0);
    await expect(page.locator('#campus-nav a[data-view="inicio"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.campus-stats dd').first()).toHaveText('1/6');
    await expect(page.locator('.campus-resume a.btn-primary')).toHaveAttribute('href', '#curso/campo/2');
    await expect(page.locator('#stat-watched')).toHaveText(/^\d+:\d{2}$/);

    // Espacio de clase: reproductor, completar, siguiente y temario lateral.
    await page.locator('.campus-resume a.btn-primary').click();
    await expect(page.locator('#view-title')).toHaveText('Tu cuaderno de campo');
    await expect(page.locator('#ws-player')).toHaveAttribute('src', './media/campo-2.mp4');
    await expect(page.locator('.ws-lessons a[aria-current="step"]')).toContainText('Tu cuaderno de campo');
    await expect(page.locator('.ws-actions [data-step="next"]')).toHaveAttribute('aria-disabled', 'true');
    await page.locator('#ws-complete').click();
    await expect(page.locator('#ws-complete')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.ws-outline .progress-ring')).toHaveAttribute('aria-label', /^100%/);
    await expect(page.locator('.ws-cert button[data-certificate="campo"]')).toBeVisible();
    await page.locator('.ws-actions [data-step="prev"]').click();
    await expect(page).toHaveURL(/#curso\/campo\/1$/);
    await page.locator('#tab-ws-notas').click();
    await page.fill('#ws-note', 'Llevar lupa');
    await expect(page.locator('[data-note-status="campo"]')).toContainText('guardada');

    // Certificado, notas, filtros y buscador.
    await page.locator('#campus-nav a[data-view="certificados"]').click();
    await page.locator('[data-certificate="campo"]').click();
    await expect(page.locator('#certificate-dialog')).toBeVisible();
    await expect(page.locator('.certificate-course')).toHaveText('Fundamentos de trabajo de campo');
    await expect(page.locator('.certificate-demo')).toContainText('DEMOSTRACIÓN');
    await page.keyboard.press('Escape');
    await page.locator('#campus-nav a[data-view="notas"]').click();
    await expect(page.locator('#note-campo')).toHaveValue('Llevar lupa');
    await page.locator('#campus-nav a[data-view="cursos"]').click();
    await page.locator('[data-filter="done"]').click();
    await expect(page.locator('#campus-course-grid .campus-card:visible')).toHaveCount(1);
    await page.fill('#campus-q', 'cuaderno');
    await expect(page.locator('#campus-results a')).toHaveCount(1);
    await page.locator('#campus-results a').click();
    await expect(page).toHaveURL(/#curso\/campo\/2$/);

    // Curso sin acceso y cierre de sesión.
    await page.goto('/campus.html#curso/gestion-riesgos');
    await expect(page.locator('.campus-empty')).toContainText('no está en tu cuenta');
    await page.locator('#campus-logout').click();
    await expect(page).toHaveURL(/login.html/);
});

test('campus: en móvil la barra lateral se abre como panel y sin desbordamiento', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 760 });
    await page.goto('/login.html');
    await page.locator('#demo-login').click();
    await expect(page).toHaveURL(/campus.html/);
    await expect(page.locator('#campus-side')).not.toBeInViewport();
    await page.locator('#campus-menu').click();
    await expect(page.locator('#campus-side')).toBeInViewport();
    await page.keyboard.press('Escape');
    await expect(page.locator('#campus-menu')).toHaveAttribute('aria-expanded', 'false');
    for (const hash of ['#inicio', '#cursos', '#progreso', '#certificados', '#notas', '#perfil', '#curso/biodiversidad/1']) {
        await page.goto('/campus.html' + hash);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    }
});

test('campus: meta semanal, marcas con tiempo, recomendaciones, logros y atajos', async ({ page }) => {
    await page.goto('/login.html');
    await page.locator('#demo-login').click();
    await expect(page).toHaveURL(/campus.html/);
    // Meta semanal editable.
    await expect(page.locator('#goal-value')).toContainText('3 clases');
    await page.locator('[data-goal="1"]').click();
    await expect(page.locator('#goal-value')).toContainText('4 clases');
    // Recomendaciones del catálogo: guardar y verlas en «Mis cursos».
    const pick = page.locator('.reco-card [data-save]').first();
    const id = await pick.getAttribute('data-save');
    await pick.click();
    await expect(page.locator(`.reco-card [data-save="${id}"]`)).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#campus-nav a[data-view="cursos"]').click();
    await expect(page.locator(`#saved-list [data-save="${id}"]`)).toBeVisible();
    // Marca con tiempo en una clase, con su atajo y su lista.
    await page.goto('/campus.html#curso/campo/2');
    await page.locator('#ws-player').evaluate((video) => new Promise((resolve) => (video.readyState ? resolve() : video.addEventListener('loadedmetadata', resolve, { once: true }))));
    await page.locator('#view-title').click();
    await page.keyboard.press('b');
    await expect(page.locator('#mark-text')).toBeFocused();
    await page.fill('#mark-text', 'Libreta con la fecha');
    await page.keyboard.press('Enter');
    await expect(page.locator('#mark-list .mark-item')).toHaveCount(1);
    await expect(page.locator('#tab-ws-notas .tab-count')).toHaveText('1');
    await expect(page.locator('.campus-toast').last()).toContainText('Buena observación');
    // Velocidad guardada y modo enfoque.
    await page.selectOption('#ws-speed', '1.5');
    expect(await page.locator('#ws-player').evaluate((video) => video.playbackRate)).toBe(1.5);
    await page.locator('#ws-focus').click();
    await expect(page.locator('#campus-side')).toBeHidden();
    await page.locator('#ws-focus').click();
    // Atajos: «?» abre la ventana y «M» marca la clase.
    await page.locator('#view-title').click();
    await page.keyboard.press('?');
    await expect(page.locator('#keys-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.keyboard.press('m');
    await expect(page.locator('#ws-complete')).toHaveAttribute('aria-pressed', 'true');
    // Mi progreso: racha, mapa, logros e historial.
    await page.locator('#campus-nav a[data-view="progreso"]').click();
    await expect(page.locator('#view-title')).toHaveText('Mi progreso');
    await expect(page.locator('.heatmap .heat[data-level]:not([data-level="0"])')).toHaveCount(1);
    await expect(page.locator('.badge-tile[data-earned="true"]')).not.toHaveCount(0);
    await expect(page.locator('.campus-feed li').first()).toContainText('Completaste');
    await expect(page.locator('#campus-streak')).toContainText('1');
    // Mis notas: la marca aparece, se busca y enlaza al minuto del video.
    await page.locator('#campus-nav a[data-view="notas"]').click();
    await expect(page.locator('[data-note-card="campo"] .mark-item')).toHaveCount(1);
    await page.fill('#notes-q', 'zzz');
    await expect(page.locator('#notes-empty')).toBeVisible();
    await page.fill('#notes-q', 'libreta');
    await expect(page.locator('[data-note-card="campo"]')).toBeVisible();
    await expect(page.locator('[data-note-card="campo"] .mark-time')).toHaveAttribute('href', /^#curso\/campo\/2(\/\d+)?$/);
    // El buscador general también encuentra las marcas.
    await page.fill('#campus-q', 'libreta con');
    await expect(page.locator('#campus-results a')).toContainText('Libreta con la fecha');
});

test('campus: Mi perfil se edita, valida el correo y se refleja en el campus y en Mi cuenta', async ({ page }) => {
    await page.goto('/login.html');
    await page.locator('#demo-login').click();
    await expect(page).toHaveURL(/campus.html/);
    await page.locator('#campus-user a[href="#perfil"]').click();
    await expect(page.locator('#view-title')).toHaveText('Mi perfil');
    await expect(page.locator('#campus-nav a[data-view="perfil"]')).toHaveAttribute('aria-current', 'page');
    await page.fill('#profile-name', 'Ana María Solís');
    await expect(page.locator('#profile-preview-name')).toHaveText('Ana María Solís');
    await expect(page.locator('.profile-preview .campus-avatar')).toHaveText('AS');
    await expect(page.locator('#profile-discard')).toBeEnabled();
    await page.fill('#profile-email', 'correo-invalido');
    await page.locator('#profile-save').click();
    await expect(page.locator('#profile-email')).toHaveAttribute('aria-invalid', '');
    await expect(page.locator('#profile-email-error')).toContainText('Revisa el correo');
    await expect(page.locator('#profile-email')).toBeFocused();
    await page.fill('#profile-email', 'ana@example.com');
    await page.fill('#profile-role', 'Docente de ciencias');
    await page.fill('#profile-bio', 'Llevo grupos a la montaña.');
    await expect(page.locator('#profile-bio-count')).toHaveText('26');
    await page.locator('.color-swatch[data-color="earth"]').click();
    await page.locator('.interest-chip', { hasText: 'Leer el paisaje' }).click();
    await page.fill('#profile-goal', '5');
    await page.locator('#profile-save').click();
    await expect(page.locator('.campus-toast').last()).toContainText('Perfil guardado');
    await expect(page.locator('#profile-discard')).toBeDisabled();
    await expect(page.locator('#campus-user .campus-avatar')).toHaveAttribute('data-color', 'earth');
    await expect(page.locator('#campus-user .campus-avatar')).toHaveText('AS');
    await page.locator('#campus-nav a[data-view="inicio"]').click();
    await expect(page.locator('#view-title')).toContainText('Ana María Solís');
    await expect(page.locator('#goal-value')).toContainText('5 clases');
    await page.goto('/mi-cuenta.html#perfil');
    await expect(page.locator('.account-hero h1')).toContainText('Ana María Solís');
    await expect(page.locator('#perfil')).toContainText('ana@example.com');
    await expect(page.locator('#perfil')).toContainText('Leer el paisaje');
    await expect(page.locator('#perfil a[href="./campus.html#perfil"]')).toBeVisible();
});

test('campus: Mi perfil permite subir, recortar y quitar una foto personalizada', async ({ page }) => {
    await page.goto('/login.html');
    await page.locator('#demo-login').click();
    await page.goto('/campus.html#perfil');
    // Un archivo que no es imagen se rechaza con un mensaje.
    await page.locator('#profile-photo-input').setInputFiles({ name: 'notas.txt', mimeType: 'text/plain', buffer: Buffer.from('hola') });
    await expect(page.locator('#profile-photo-error')).toContainText('Usa una imagen');
    // Una imagen abre el recorte; se acerca, se mueve y se usa.
    await page.locator('#profile-photo-input').setInputFiles('site/media/field.jpg');
    await expect(page.locator('#photo-dialog')).toBeVisible();
    await expect(page.locator('#profile-photo-error')).toBeHidden();
    await page.locator('#photo-zoom').fill('1.6');
    await page.locator('#photo-frame').focus();
    await page.keyboard.press('ArrowLeft');
    await page.locator('#photo-use').click();
    await expect(page.locator('#photo-dialog')).toBeHidden();
    await expect(page.locator('#profile-photo-drop img')).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
    await expect(page.locator('#profile-status')).toContainText('Foto lista');
    await page.locator('#profile-save').click();
    await expect(page.locator('#campus-user .campus-avatar img')).toBeVisible();
    await expect(page.locator('#profile-photo-pick')).toHaveText('Cambiar foto');
    const size = await page.locator('#campus-user .campus-avatar img').evaluate((img) => [img.naturalWidth, img.naturalHeight]);
    expect(size).toEqual([320, 320]);
    // Se ve también en Mi cuenta.
    await page.goto('/mi-cuenta.html');
    await expect(page.locator('.account-avatar img')).toBeVisible();
    // Cancelar el recorte no cambia nada; quitar la foto vuelve a las iniciales.
    await page.goto('/campus.html#perfil');
    await page.locator('#profile-photo-input').setInputFiles('site/media/field.jpg');
    await expect(page.locator('#photo-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#photo-dialog')).toBeHidden();
    await expect(page.locator('#profile-discard')).toBeDisabled();
    await page.locator('#profile-photo-remove').click();
    await expect(page.locator('#profile-photo-drop img')).toHaveCount(0);
    await page.locator('#profile-save').click();
    await expect(page.locator('#campus-user .campus-avatar img')).toHaveCount(0);
    await expect(page.locator('#campus-user .campus-avatar')).toHaveText('CD');
});

test('portada: venta de la ruta con temario, prueba social de ejemplo, CTA fijo y pago', async ({ page }) => {
    const errors = trackErrors(page);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Convierte cada salida en aprendizaje real');
    expect((await page.locator('h1').innerText()).split(/\s+/).length).toBeLessThanOrEqual(8);
    await expect(page.locator('#main-navigation a')).toHaveCount(4);
    await expect(page.locator('#hero-proof')).toContainText('alumnos');
    await expect(page.locator('#hero-proof .is-demo')).toHaveText('Dato de ejemplo');
    await expect(page.locator('[data-price-total]').first()).toContainText('97');
    // Temario: tres módulos con duración real; el primero abierto y el botón abre o cierra todos.
    await expect(page.locator('#curriculum details')).toHaveCount(3);
    await expect(page.locator('#curriculum details').first()).toHaveAttribute('open', '');
    await expect(page.locator('#curriculum .sales-module-time').first()).toHaveText(/^\d+:\d{2}$/);
    await page.locator('#curriculum-toggle').click();
    await expect(page.locator('#curriculum details[open]')).toHaveCount(3);
    await expect(page.locator('#curriculum-toggle')).toHaveText('Cerrar todos');
    // Garantía y preguntas.
    await expect(page.locator('#guarantee')).toContainText('Garantía de 14 días');
    // Dos cuadros: para estudiantes (precio e inscripción) y para consejeros (contacto).
    await expect(page.locator('#precio .offer-box')).toHaveCount(2);
    await expect(page.locator('#precio .offer-box').first()).toContainText('USD 97');
    await expect(page.locator('#offer-counselors')).toHaveText('Para consejeros y personas que recomiendan');
    await expect(page.locator('#precio .offer-box').nth(1).locator('a[href="./contacto.html"]')).toHaveText('Contactar');
    await page.locator('#faq summary', { hasText: '¿Y si no es lo que esperaba?' }).click();
    await expect(page.locator('#faq-guarantee')).toContainText('14 días');
    await expect(page.locator('#faq details[open]')).toHaveCount(1);
    await expect(page.locator('.faq-facts li')).toHaveCount(3);
    await expect(page.locator('.faq-help a[href="#escribenos"]')).toBeVisible();
    await page.locator('#faq-open-help').click();
    await expect(page.locator('.help-bubble')).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    // CTA fijo: aparece al pasar el hero y se esconde en el precio.
    await expect(page.locator('#sales-sticky')).toHaveAttribute('data-visible', 'false');
    await page.locator('#resultados').scrollIntoViewIfNeeded();
    await expect(page.locator('#sales-sticky')).toHaveAttribute('data-visible', 'true');
    await page.locator('#precio').scrollIntoViewIfNeeded();
    await expect(page.locator('#sales-sticky')).toHaveAttribute('data-visible', 'false');
    // Video de muestra en una ventana.
    await page.evaluate(() => scrollTo(0, 0));
    await page.locator('#video-open').click();
    await expect(page.locator('#video-dialog')).toBeVisible();
    await expect(page.locator('#video-player')).toHaveAttribute('src', './media/campo-1.mp4');
    await page.keyboard.press('Escape');
    await expect(page.locator('#video-open')).toBeFocused();
    const unnamed = await page.$$eval('button, a[href]', (items) => items.filter((item) => item.checkVisibility() && !(item.getAttribute('aria-label') || item.textContent.trim())).map((item) => item.outerHTML.slice(0, 80)));
    expect(unnamed).toEqual([]);
    // Inscribirse agrega los tres cursos al carrito y lleva al pago.
    await page.locator('#enroll').click();
    await expect(page).toHaveURL(/pago\.html/);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('solara-demo-cart')))).toEqual(expect.arrayContaining(['campo', 'biodiversidad', 'sendero']));
    expect(errors).toEqual([]);
});

test('portada: en móvil el antes y después usa pestañas y no hay desbordamiento', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/');
    await expect(page.locator('#panel-after')).toBeVisible();
    await expect(page.locator('#panel-before')).toBeHidden();
    await page.locator('#tab-before').click();
    await expect(page.locator('#panel-before')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#tab-after')).toBeFocused();
    await expect(page.locator('#panel-after')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    await page.selectOption('#language', 'en');
    await expect(page.locator('h1')).toHaveText('Turn every outing into real learning');
    await expect(page.locator('#hero-proof')).toContainText('students');
});

test('ayuda: abre directo «Escríbenos» con pregunta, comentario, queja o ayuda, y aviso de demostración', async ({ page }) => {
    await page.goto('/publico.html');
    await page.locator('.help-bubble').click();
    await expect(page.locator('#solara-help-title')).toHaveText('Escríbenos');
    await expect(page.locator('.help-questions, .help-tabs')).toHaveCount(0);
    const header = await page.locator('.help-header').evaluate((node) => [getComputedStyle(node).backgroundColor, getComputedStyle(node.querySelector('h2')).color]);
    expect(header).toEqual(['rgb(29, 40, 36)', 'rgb(243, 245, 237)']);
    const form = page.locator('#help-pane-write form');
    await expect(form.locator('.feedback-kind')).toHaveText(['Tengo una pregunta', 'Quiero dejar un comentario', 'Quiero presentar una queja', 'Necesito ayuda']);
    await expect(form.locator('.feedback-reference')).toBeHidden();
    await form.locator('.feedback-kind', { hasText: 'queja' }).click();
    await expect(form.locator('.feedback-submit')).toHaveText('Enviar queja');
    await expect(form.locator('.feedback-reference')).toBeVisible();
    await form.locator('.feedback-submit').click();
    await expect(form.locator('[name="message"]')).toHaveAttribute('aria-invalid', '');
    await expect(form.locator('[name="message"]')).toBeFocused();
    await form.locator('[name="message"]').fill('El video de la segunda clase no carga en mi celular.');
    await form.locator('[name="email"]').fill('correo-mal');
    await form.locator('.feedback-submit').click();
    await expect(form.locator('#help-email-error')).toContainText('Revisa el correo');
    await form.locator('[name="email"]').fill('persona@example.com');
    await form.locator('[name="reference"]').fill('DEMO-0001');
    await form.locator('.feedback-submit').click();
    await expect(form.locator('.feedback-status')).toContainText('todavía no se envió a Solara');
    await expect(form.locator('[name="message"]')).toHaveValue('');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('solara-demo-feedback')));
    expect(saved.at(-1)).toMatchObject({ kind: 'queja', reference: 'DEMO-0001', email: 'persona@example.com', page: 'publico.html' });
});

test('portada: bloque «Escríbenos» debajo de las preguntas, también sin correo', async ({ page }) => {
    await page.goto('/#escribenos');
    const form = page.locator('#home-feedback form');
    await form.locator('.feedback-kind', { hasText: 'comentario' }).click();
    await expect(form.locator('.feedback-submit')).toHaveText('Enviar comentario');
    await form.locator('[name="message"]').fill('Me gustó mucho el antes y después del cuaderno.');
    await expect(form.locator('.feedback-count')).toHaveText('47/1000');
    await form.locator('[name="anonymous"]').check();
    await expect(form.locator('[name="email"]')).toBeDisabled();
    await form.locator('.feedback-submit').click();
    await expect(form.locator('.feedback-status')).toContainText('Es una demostración');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('solara-demo-feedback')));
    expect(saved.at(-1)).toMatchObject({ kind: 'comentario', email: null });
});

test('menú y pie: sin Escuelas, Precios ni Contacto arriba, y datos de contacto en el pie de todas las páginas', async ({ page }) => {
    for (const route of ['/', '/catalogo.html', '/publico.html', '/curso-campo.html', '/blog.html', '/articulo.html?post=cuaderno-de-campo']) {
        await page.goto(route);
        const hrefs = await page.$$eval('#main-navigation a', (links) => links.map((link) => link.getAttribute('href')));
        expect(hrefs, route).toEqual(['./catalogo.html', './programas.html', './publico.html', './blog.html']);
        const contact = page.locator('.footer-contact');
        await expect(contact, route).toHaveCount(1);
        await expect(contact.locator('dt'), route).toHaveText(['Correo', 'Teléfono', 'WhatsApp', 'Ubicación']);
        await expect(contact.locator('dd').last()).toHaveText('Costa Rica');
    }
    await page.locator('.footer-contact [data-open-help]').click();
    await expect(page.locator('.help-panel')).toBeVisible();
});
