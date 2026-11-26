// Servidor estático mínimo para revisar `site/` en local: node scripts/serve-site.mjs [puerto]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('site');
const port = Number(process.argv[2] ?? 8874);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4' };

createServer(async (request, response) => {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let file = normalize(join(root, path));
    if (!file.startsWith(root)) { response.writeHead(403).end(); return; }
    try {
        // Como Cloudflare: /curso-campo sirve curso-campo.html.
        if (!extname(file)) {
            try { await stat(`${file}.html`); file = `${file}.html`; } catch { /* no hay versión .html */ }
        }
        if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
        const body = await readFile(file);
        const range = request.headers.range?.match(/bytes=(\d+)-(\d*)/);
        if (range) {
            const start = Number(range[1]);
            const end = range[2] ? Number(range[2]) : body.length - 1;
            response.writeHead(206, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Content-Range': `bytes ${start}-${end}/${body.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
            response.end(body.subarray(start, end + 1));
            return;
        }
        response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Accept-Ranges': 'bytes' });
        response.end(body);
    } catch {
        response.writeHead(404, { 'Content-Type': 'text/plain' }).end('No encontrado');
    }
}).listen(port, '127.0.0.1', () => console.log(`Solara en http://127.0.0.1:${port}`));
