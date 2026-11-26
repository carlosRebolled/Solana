// Reduce el peso de las fotos de site/media/ (lado más largo de 1600 px como máximo, JPEG calidad 0,8).
// Conserva el archivo original si el resultado no pesa menos. Uso: node scripts/optimize-images.mjs
import { chromium } from '@playwright/test';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dir = resolve('site/media');
const maxWidth = 1600;
const quality = 0.8;
const browser = await chromium.launch();
const page = await browser.newPage();
for (const file of (await readdir(dir)).filter((name) => name.endsWith('.jpg'))) {
    const path = resolve(dir, file);
    const original = await readFile(path);
    const result = await page.evaluate(async ({ data, maxWidth, quality }) => {
        const image = new Image();
        image.src = `data:image/jpeg;base64,${data}`;
        await image.decode();
        const scale = Math.min(1, maxWidth / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((done) => canvas.toBlob(done, 'image/jpeg', quality));
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let binary = '';
        for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
        return { data: btoa(binary), from: `${image.naturalWidth}×${image.naturalHeight}`, to: `${canvas.width}×${canvas.height}` };
    }, { data: original.toString('base64'), maxWidth, quality });
    const optimized = Buffer.from(result.data, 'base64');
    if (optimized.length < original.length * 0.95) {
        await writeFile(path, optimized);
        console.log(`${file}: ${result.from} → ${result.to}, ${Math.round(original.length / 1024)} KB → ${Math.round(optimized.length / 1024)} KB`);
    } else {
        console.log(`${file}: sin cambios (${Math.round(original.length / 1024)} KB)`);
    }
}
await browser.close();
