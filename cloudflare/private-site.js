const pausedPage = `<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <meta name="theme-color" content="#102b24">
    <title>Solara Field School | Fuera de línea</title>
    <style>
        :root {
            color-scheme: dark;
            --forest: #102b24;
            --panel: #183a2b;
            --lime: #d9eea2;
            --text: #f7f7ee;
        }

        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 1.25rem;
            background: radial-gradient(ellipse at 48% 12%, #285443, var(--forest) 65%);
            color: var(--text);
            font-family: system-ui, sans-serif;
        }

        main {
            width: min(100%, 47rem);
            padding: clamp(2rem, 7vw, 4.75rem);
            border: 1px solid #678476;
            border-radius: 1.4rem;
            background: var(--panel);
            box-shadow: 0 1.5rem 4rem #07181255;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: .75rem;
            font: 700 1.7rem/.95 Georgia, serif;
        }

        .brand-mark {
            display: grid;
            place-items: center;
            flex: none;
            width: 3.15rem;
            height: 3.15rem;
            border-radius: 50%;
            background: var(--lime);
            color: var(--panel);
            font: 2rem/1 system-ui, sans-serif;
        }

        .brand small {
            display: block;
            margin-top: .4rem;
            font: 750 .73rem/1.2 system-ui, sans-serif;
            letter-spacing: .16em;
        }

        h1 {
            margin: 2.2rem 0 .8rem;
            padding-top: 1.65rem;
            border-top: 1px solid #678476;
            color: var(--lime);
            font: 500 clamp(1.95rem, 5vw, 3.95rem)/1.05 Georgia, serif;
            letter-spacing: -.035em;
            text-wrap: balance;
        }

        p { margin: 0; color: #dce9d8; line-height: 1.6; }
    </style>
</head>
<body>
    <main>
        <div class="brand"><span class="brand-mark" aria-hidden="true">✳</span><span>Solara<small>FIELD SCHOOL</small></span></div>
        <h1>Solara Field School está temporalmente fuera de línea.</h1>
        <p>Gracias por tu paciencia.</p>
    </main>
</body>
</html>`;

export default {
    fetch() {
        return new Response(pausedPage, {
            status: 503,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store',
                'X-Robots-Tag': 'noindex'
            }
        });
    }
};
