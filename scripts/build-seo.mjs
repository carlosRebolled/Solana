// Genera las páginas estáticas para buscadores: una por curso, escuela y ruta, en español e inglés,
// con título, descripción, canónica, hreflang, Open Graph y datos estructurados; además sitemap.xml.
// Uso: npm run seo:build   (vuelve a ejecutarlo después de cambiar site/data.js)
//
// Cada página se prerenderiza con Chromium a partir de la plantilla (curso.html, escuelas.html o
// ruta.html), así el contenido queda escrito en el HTML aunque el buscador no ejecute JavaScript.
// Al abrirla, los mismos scripts vuelven a pintar la página, con el carrito, el progreso y el idioma.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readdir, unlink, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const root = resolve('site');
const data = await import(pathToFileURL(resolve('site/data.js')).href);
const { courses, englishCourses, schools, paths, findCourse, coursesForSchool, pageFile, pageUrl, siteUrl } = data;
const port = 8879;
const origin = `http://127.0.0.1:${port}`;

const escapeHtml = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (text, max = 158) => (text.length <= max ? text : `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…`);
const pick = (pair, lang) => pair[lang === 'en' ? 1 : 0];
const courseTitle = (course, lang) => (lang === 'en' ? englishCourses[course.id][0] : course.title);
const courseDescription = (course, lang) => (lang === 'en' ? englishCourses[course.id][1] : course.description);
const courseTopics = (course, lang) => (lang === 'en' ? englishCourses[course.id][2] : course.lessons).map(([title]) => title);

function coursePage(course) {
    const school = schools.find((entry) => entry.topic === course.topic);
    return (lang) => {
        const title = courseTitle(course, lang);
        const label = lang === 'en' ? 'Online course' : 'Curso en línea';
        const description = clip(`${courseDescription(course, lang)}${course.audience ? ` ${lang === 'en' ? 'For' : 'Para'}: ${pick(course.audience, lang)}.` : ''}`);
        const jsonLd = [{
            '@context': 'https://schema.org', '@type': 'Course',
            name: title, description: courseDescription(course, lang), url: pageUrl('course', course.id, lang), inLanguage: lang,
            provider: { '@type': 'Organization', name: 'Solara Field School', url: siteUrl },
            teaches: courseTopics(course, lang),
            ...(course.audience ? { audience: { '@type': 'Audience', audienceType: pick(course.audience, lang) } } : {}),
            ...(course.level ? { educationalLevel: lang === 'en' ? (course.level === 'Inicial' ? 'Beginner' : 'Intermediate') : course.level } : {}),
            ...(school ? { about: pick(school.title, lang) } : {})
        }, breadcrumbs(lang, [[lang === 'en' ? 'Courses' : 'Cursos', `${siteUrl}/catalogo`], ...(school ? [[pick(school.title, lang), pageUrl('school', school.id, lang)]] : []), [title, pageUrl('course', course.id, lang)]])];
        return { template: `/curso.html?curso=${course.id}`, kind: 'course', id: course.id, dataset: { course: course.id }, title: `${title} | ${label} | Solara Field School`, description, image: course.image, jsonLd };
    };
}

function schoolPage(school) {
    return (lang) => {
        const title = pick(school.title, lang);
        const count = coursesForSchool(school).length;
        const description = clip(`${pick(school.description, lang)} ${lang === 'en' ? `${count} courses and learning paths.` : `${count} cursos y rutas de aprendizaje.`}`);
        const jsonLd = [{
            '@context': 'https://schema.org', '@type': 'ItemList', name: title, url: pageUrl('school', school.id, lang),
            itemListElement: coursesForSchool(school).map((course, index) => ({ '@type': 'ListItem', position: index + 1, url: pageUrl('course', course.id, lang), name: courseTitle(course, lang) }))
        }, breadcrumbs(lang, [[lang === 'en' ? 'Schools' : 'Escuelas', `${siteUrl}/escuelas`], [title, pageUrl('school', school.id, lang)]])];
        return { template: `/escuelas.html?area=${school.id}`, kind: 'school', id: school.id, dataset: { school: school.id }, title: `${lang === 'en' ? 'School of' : 'Escuela de'} ${title} | Solara Field School`, description, image: school.image, jsonLd };
    };
}

function pathPage(path) {
    return (lang) => {
        const title = pick(path.title, lang);
        const list = path.courses.map(findCourse);
        const description = clip(`${pick(path.description, lang)} ${lang === 'en' ? `${list.length} courses in order.` : `${list.length} cursos en orden.`}`);
        const jsonLd = [{
            '@context': 'https://schema.org', '@type': 'ItemList', name: title, url: pageUrl('path', path.id, lang), itemListOrder: 'https://schema.org/ItemListOrderAscending',
            itemListElement: list.map((course, index) => ({ '@type': 'ListItem', position: index + 1, url: pageUrl('course', course.id, lang), name: courseTitle(course, lang) }))
        }, breadcrumbs(lang, [[lang === 'en' ? 'Learning paths' : 'Rutas', `${siteUrl}/ruta`], [title, pageUrl('path', path.id, lang)]])];
        return { template: `/ruta.html?ruta=${path.id}`, kind: 'path', id: path.id, dataset: { path: path.id }, title: `${title} | ${lang === 'en' ? 'Learning path' : 'Ruta de aprendizaje'} | Solara Field School`, description, image: list[0].image, jsonLd };
    };
}

function breadcrumbs(lang, items) {
    return {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [[lang === 'en' ? 'Home' : 'Inicio', siteUrl], ...items].map(([name, item], index) => ({ '@type': 'ListItem', position: index + 1, name, item }))
    };
}

// Metadatos que se insertan en <head> de la página generada.
function headFor(page, lang) {
    const other = lang === 'en' ? 'es' : 'en';
    const url = pageUrl(page.kind, page.id, lang);
    return [
        `<title>${escapeHtml(page.title)}</title>`,
        `<meta name="description" content="${escapeHtml(page.description)}">`,
        `<link rel="canonical" href="${url}">`,
        `<link rel="alternate" hreflang="${lang}" href="${url}" data-file="${pageFile(page.kind, page.id, lang)}">`,
        `<link rel="alternate" hreflang="${other}" href="${pageUrl(page.kind, page.id, other)}" data-file="${pageFile(page.kind, page.id, other)}">`,
        `<link rel="alternate" hreflang="x-default" href="${pageUrl(page.kind, page.id, 'es')}">`,
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="Solara Field School">',
        `<meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'es_CR'}">`,
        `<meta property="og:title" content="${escapeHtml(page.title)}">`,
        `<meta property="og:description" content="${escapeHtml(page.description)}">`,
        `<meta property="og:url" content="${url}">`,
        `<meta property="og:image" content="${siteUrl}/media/${page.image}.jpg">`,
        '<meta name="twitter:card" content="summary_large_image">',
        `<script type="application/ld+json">${JSON.stringify(page.jsonLd).replace(/</g, '\\u003c')}</script>`
    ].map((line) => `    ${line}`).join('\n');
}

async function render(browser, page, lang) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: lang === 'en' ? 'en-US' : 'es-CR' });
    await context.addInitScript(() => localStorage.clear());
    const tab = await context.newPage();
    await tab.goto(origin + page.template, { waitUntil: 'networkidle' });
    if (lang === 'en') {
        // Guarda el texto en español de la plantilla en data-es* y pasa la página a inglés.
        await tab.evaluate(() => {
            for (const [attribute, target] of [['data-en', null], ['data-en-label', 'aria-label'], ['data-en-placeholder', 'placeholder']]) {
                for (const element of document.querySelectorAll(`[${attribute}]`)) {
                    element.setAttribute(attribute.replace('data-en', 'data-es'), target ? element.getAttribute(target) ?? '' : element.textContent);
                }
            }
        });
        await tab.selectOption('#language', 'en');
        await tab.waitForLoadState('networkidle');
    }
    await tab.waitForTimeout(300);
    const html = await tab.evaluate(({ dataset, lang }) => {
        // Quita lo que los scripts vuelven a crear al abrir la página.
        document.querySelector('.help-chat')?.remove();
        document.getElementById('account-link')?.remove();
        document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.removeAttribute('open'));
        document.querySelector('meta[name="robots"]')?.remove();
        document.querySelector('meta[name="description"]')?.remove();
        document.querySelector('title')?.remove();
        document.querySelectorAll('link[rel="canonical"], link[rel="alternate"]').forEach((node) => node.remove());
        document.documentElement.lang = lang;
        document.documentElement.dataset.pageLang = lang;
        Object.assign(document.body.dataset, dataset);
        return `<!doctype html>\n${document.documentElement.outerHTML}`;
    }, { dataset: page.dataset, lang });
    await context.close();
    return html.replace('<head>', `<head>\n${headFor(page, lang)}`).replace(new RegExp(origin, 'g'), '.');
}

// Servidor local para la plantilla.
const server = spawn(process.execPath, ['scripts/serve-site.mjs', String(port)], { stdio: 'ignore' });
await new Promise((done) => setTimeout(done, 600));
const browser = await chromium.launch();
try {
    // Borra las páginas generadas anteriores (los nombres pueden cambiar si cambia un título).
    for (const file of await readdir(root)) {
        if (/^(curso|course|escuela|school|ruta|path)-[a-z0-9-]+\.html$/.test(file)) await unlink(resolve(root, file));
    }
    const pages = [...courses.map(coursePage), ...schools.map(schoolPage), ...paths.map(pathPage)];
    const written = [];
    for (const build of pages) {
        for (const lang of ['es', 'en']) {
            const page = build(lang);
            const file = pageFile(page.kind, page.id, lang);
            await writeFile(resolve(root, file), await render(browser, page, lang));
            written.push({ page, lang });
        }
    }
    // sitemap.xml con las páginas principales y todas las generadas, con sus alternativas de idioma.
    const main = ['', 'catalogo', 'escuelas', 'ruta', 'precios', 'programas', 'publico', 'nosotros', 'contacto', 'blog'];
    const today = new Date().toISOString().slice(0, 10);
    const entry = (loc, alternates = []) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n${alternates.map(([lang, href]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${href}"/>`).join('\n')}${alternates.length ? '\n' : ''}  </url>`;
    const generated = written.map(({ page, lang }) => entry(pageUrl(page.kind, page.id, lang), [['es', pageUrl(page.kind, page.id, 'es')], ['en', pageUrl(page.kind, page.id, 'en')]]));
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${[...main.map((page) => entry(`${siteUrl}/${page}`)), ...generated].join('\n')}\n</urlset>\n`;
    await writeFile(resolve(root, 'sitemap.xml'), sitemap);
    console.log(`Generadas ${written.length} páginas y sitemap.xml (${main.length + written.length} direcciones).`);
} finally {
    await browser.close();
    server.kill();
}
