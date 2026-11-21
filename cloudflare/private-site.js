export default {
    fetch() {
        return new Response('Solara Field School está temporalmente fuera de línea.', {
            status: 503,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-store',
                'X-Robots-Tag': 'noindex'
            }
        });
    }
};
