// Comparación geométrica reproducible entre la referencia pública y Solara.
// Mide posición y tamaño de componentes equivalentes con el mismo viewport y guarda capturas.
// Uso: npm run visual:geometry   (requiere el servidor local: npm run site)
// Las capturas de la referencia quedan en tests/visual/reference/ (ignorada por git).
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const solara = process.env.SOLARA_URL ?? 'http://127.0.0.1:8874';
const viewports = [[1440, 900], [768, 1024], [390, 844]];
const pages = [
    {
        name: 'home', reference: 'https://platzi.com/', solara: `${solara}/`,
        parts: [
            ['Encabezado', 'header', '.site-header'],
            ['Hero: contenedor de dos columnas', '[class*="VariantA__layout"]', '.hero-layout'],
            ['Hero: título H1', 'main h1', '#hero-title'],
            ['Hero: tarjeta de clase', '[class*="VariantA__tileItem"]', '.lesson-tile'],
            ['Historias: título H2', '[class*="TestimonialsSection"] h2', '#stories-title'],
            ['Historias: tarjeta', '[class*="TestimonialCard_"]', '.testimonial-card'],
            ['Escuelas: imagen de tarjeta', '[class*="AcademyCard__media"]', '.school-media'],
            ['Actividades: tarjeta', '[class*="PlaceCard"]', '.event-card'],
            ['Metas: etiqueta', '[class*="chipText"]', '.goal-chip'],
            ['Footer', 'footer', '#site-footer']
        ]
    },
    {
        name: 'catalogo', reference: 'https://platzi.com/cursos/', solara: `${solara}/catalogo.html`,
        parts: [['Título H1', 'main h1', 'main h1'], ['Tarjeta de curso', 'main a[href^="/cursos/"][class*="Course"], main a[href^="/cursos/"]:has(img)', '.course-row']]
    },
    { name: 'escuela', reference: 'https://platzi.com/escuela/web/', solara: `${solara}/escuelas.html?area=campo`, parts: [['Título H1', 'main h1, h1', 'main h1']] },
    { name: 'ruta', reference: 'https://platzi.com/ruta/web-frontend/', solara: `${solara}/ruta.html?ruta=observador-de-campo`, parts: [['Título H1', 'main h1, h1', 'main h1']] },
    { name: 'curso', reference: 'https://platzi.com/cursos/html/', solara: `${solara}/curso.html?curso=campo`, parts: [['Título H1', 'main h1, h1', 'main h1']] },
    { name: 'precios', reference: 'https://platzi.com/precios/', solara: `${solara}/precios.html`, parts: [['Título H1', 'main h1, h1', 'main h1']] }
];

async function measure(page, selector) {
    return page.evaluate((query) => {
        const element = [...document.querySelectorAll(query)].find((item) => item.getBoundingClientRect().height > 0);
        if (!element) return null;
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return { x: Math.round(box.left), y: Math.round(box.top + scrollY), w: Math.round(box.width), h: Math.round(box.height), font: style.fontSize, radius: style.borderRadius };
    }, selector);
}

async function load(page, url) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(1500);
    // Desplaza toda la página para cargar contenido diferido.
    await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((resolve) => setTimeout(resolve, 60)); }
        scrollTo(0, 0);
    });
    await page.waitForTimeout(500);
}

const browser = await chromium.launch();
const rows = [];
await mkdir('tests/visual/reference', { recursive: true });
await mkdir('tests/visual/output', { recursive: true });
for (const [width, height] of viewports) {
    const context = await browser.newContext({ viewport: { width, height }, locale: 'es-CR' });
    const reference = await context.newPage();
    const own = await context.newPage();
    for (const entry of pages) {
        if (width !== 1440 && entry.name !== 'home') continue;
        await load(reference, entry.reference);
        await load(own, entry.solara);
        await reference.screenshot({ path: `tests/visual/reference/${entry.name}-${width}.png` });
        await own.screenshot({ path: `tests/visual/output/${entry.name}-${width}.png` });
        await own.screenshot({ path: `tests/visual/output/${entry.name}-${width}-completa.png`, fullPage: true });
        for (const [label, referenceSelector, solaraSelector] of entry.parts) {
            const a = await measure(reference, referenceSelector);
            const b = await measure(own, solaraSelector);
            rows.push({ page: entry.name, viewport: `${width}×${height}`, part: label, reference: a, solara: b });
        }
    }
    await context.close();
}
await browser.close();

const cell = (box) => (box ? `${box.w}×${box.h} @ x${box.x}` : 'no encontrado');
const diff = (a, b) => (a && b ? `Δw ${b.w - a.w}, Δh ${b.h - a.h}, Δx ${b.x - a.x}` : '—');
const table = ['| Página | Viewport | Componente | Referencia (w×h @ x) | Solara (w×h @ x) | Diferencia |', '| --- | --- | --- | --- | --- | --- |',
    ...rows.map((row) => `| ${row.page} | ${row.viewport} | ${row.part} | ${cell(row.reference)} | ${cell(row.solara)} | ${diff(row.reference, row.solara)} |`)].join('\n');
await writeFile('tests/visual/output/geometria.md', `# Comparación geométrica\n\nGenerada el ${new Date().toISOString()} con Chromium de Playwright.\n\n${table}\n`);
await writeFile('tests/visual/output/geometria.json', JSON.stringify(rows, null, 2));
console.log(table);
