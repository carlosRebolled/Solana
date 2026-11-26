// Pruebas de SEO: páginas estáticas, metadatos, idiomas y sitemap.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const data = await import(pathToFileURL(resolve('site/data.js')).href);
const { courses, schools, paths, pageFile, pageUrl } = data;
const all = [
    ...courses.map((course) => ['course', course.id]),
    ...schools.map((school) => ['school', school.id]),
    ...paths.map((path) => ['path', path.id])
];

test('cada curso, escuela y ruta tiene su página en español e inglés con el contenido en el HTML', () => {
    for (const [kind, id] of all) {
        for (const lang of ['es', 'en']) {
            const html = readFileSync(resolve('site', pageFile(kind, id, lang)), 'utf8');
            const where = `${pageFile(kind, id, lang)}`;
            expect(html, where).toContain(`<link rel="canonical" href="${pageUrl(kind, id, lang)}">`);
            expect(html, where).toContain(`hreflang="${lang === 'es' ? 'en' : 'es'}"`);
            expect(html, where).toMatch(/<h1[^>]*>[^<]{6,}<\/h1>/);
            expect(html, where).toMatch(/<meta name="description" content="[^"]{40,}">/);
            expect(html, where).toContain(`data-page-lang="${lang}"`);
            expect(html, where).not.toContain('127.0.0.1');
            expect(html.match(/<title>/g), where).toHaveLength(1);
            for (const [, json] of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) expect(() => JSON.parse(json), where).not.toThrow();
        }
    }
});

test('las páginas estáticas están al día con su plantilla (si falla: npm run seo:build)', () => {
    const templates = { course: 'curso.html', school: 'escuelas.html', path: 'ruta.html' };
    for (const [kind, template] of Object.entries(templates)) {
        const ids = [...readFileSync(resolve('site', template), 'utf8').matchAll(/\sid="([^"]+)"/g)].map(([, id]) => id);
        for (const [entryKind, id] of all.filter(([entryKind]) => entryKind === kind)) {
            for (const lang of ['es', 'en']) {
                const html = readFileSync(resolve('site', pageFile(entryKind, id, lang)), 'utf8');
                const missing = ids.filter((name) => !html.includes(`id="${name}"`));
                expect(missing, `${pageFile(entryKind, id, lang)} desactualizada`).toEqual([]);
            }
        }
    }
});

test('el sitemap lista todas las páginas y cada una existe', () => {
    const sitemap = readFileSync(resolve('site/sitemap.xml'), 'utf8');
    const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => url);
    expect(urls.length).toBe(10 + all.length * 2);
    for (const [kind, id] of all) for (const lang of ['es', 'en']) expect(urls).toContain(pageUrl(kind, id, lang));
});

test('las páginas estáticas funcionan: el curso se reproduce y el carrito responde', async ({ page }) => {
    await page.goto('/curso-campo');
    await expect(page.locator('#course-title')).toHaveText('Fundamentos de trabajo de campo');
    await expect(page.locator('#lessons .lesson')).toHaveCount(2);
    await page.locator('#add-course').click();
    await expect(page.locator('#cart-count')).toHaveText('1');
});

test('cambiar a inglés lleva a la página en inglés y vuelve', async ({ page }) => {
    await page.goto('/curso-gestion-riesgos.html');
    await page.selectOption('#language', 'en');
    await expect(page).toHaveURL(/course-outdoor-risk-management/);
    await expect(page.locator('#course-title')).toContainText('Outdoor Risk Management');
    await expect(page.locator('.course-tabs a').first()).toHaveText('What you’ll learn');
    await page.selectOption('#language', 'es');
    await expect(page).toHaveURL(/curso-gestion-riesgos/);
    await expect(page.locator('.course-tabs a').first()).toHaveText('Qué aprenderás');
});

test('con el inglés elegido, una página en español redirige a su versión en inglés', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('solara-language', JSON.stringify(['en'])));
    await page.goto('/escuela-campamentos.html');
    await expect(page).toHaveURL(/school-camp-management/);
    await expect(page.locator('#site-footer a[href*="school-"]').first()).toBeVisible();
});

test('las direcciones antiguas siguen funcionando y apuntan a la canónica estática', async ({ page }) => {
    await page.goto('/curso.html?curso=forest-school');
    await expect(page.locator('#course-title')).toContainText('Forest School');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://solarafieldschool.com/curso-forest-school');
    await page.goto('/escuelas.html?area=paisaje');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://solarafieldschool.com/escuela-campo');
});

test('la portada conserva su título y los enlaces del catálogo van a páginas estáticas', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Solara Field School | Educación experiencial, naturaleza y liderazgo juvenil');
    const hrefs = await page.$$eval('#course-list a', (links) => links.map((link) => link.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThan(20);
    expect(hrefs.every((href) => /^\.\/curso-[a-z0-9-]+\.html$/.test(href))).toBe(true);
});
