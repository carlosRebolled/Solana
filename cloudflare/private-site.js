// Página de mantenimiento de solarafieldschool.com (Worker de Cloudflare). Responde 503 a todo.
// Incluye «Sendero», un minijuego propio para pasar el rato mientras el sitio está fuera de línea:
// una persona camina por el sendero, salta piedras y troncos y recoge hojas. Todo va en esta página
// (sin archivos externos ni librerías). El récord se guarda solo en el navegador de quien juega.
// Nota: el script del juego no usa comillas invertidas ni "${" para no romper esta plantilla.
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
            --line: #678476;
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
            border: 1px solid var(--line);
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
            border-top: 1px solid var(--line);
            color: var(--lime);
            font: 500 clamp(1.95rem, 5vw, 3.95rem)/1.05 Georgia, serif;
            letter-spacing: -.035em;
            text-wrap: balance;
        }

        p { margin: 0; color: #dce9d8; line-height: 1.6; }

        /* Minijuego «Sendero» */
        .game { margin-top: 2.2rem; padding-top: 1.65rem; border-top: 1px solid var(--line); }
        .game-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .5rem 1rem; margin-bottom: .9rem; }
        .game-head h2 { margin: 0; color: var(--text); font: 500 1.35rem/1.2 Georgia, serif; }
        .game-score { display: flex; gap: 1rem; color: #dce9d8; font: 700 .85rem/1 system-ui, sans-serif; font-variant-numeric: tabular-nums; letter-spacing: .04em; }
        .game-score strong { color: var(--lime); }
        .game-stage { position: relative; overflow: hidden; border: 1px solid var(--line); border-radius: 1rem; background: #12301f; touch-action: manipulation; }
        canvas { display: block; width: 100%; height: 220px; cursor: pointer; }
        canvas:focus-visible { outline: 3px solid var(--lime); outline-offset: -3px; }
        .game-overlay { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: .75rem; padding: 1rem; background: #102b24cc; text-align: center; }
        .game-overlay[hidden] { display: none; }
        .game-overlay p { max-width: 26rem; }
        .game-title { color: var(--lime) !important; font: 500 1.4rem/1.2 Georgia, serif; }
        .game-button { min-height: 2.75rem; padding: 0 1.4rem; border: 0; border-radius: 2rem; background: var(--lime); color: var(--forest); font: 800 1rem system-ui, sans-serif; cursor: pointer; transition: background-color .15s, transform .1s; }
        .game-button:hover { background: #eaf6c8; }
        .game-button:active { transform: translateY(1px) scale(.98); }
        .game-button:focus-visible { outline: 3px solid var(--text); outline-offset: 3px; }
        .game-help { margin-top: .75rem; color: #b9cdb9; font-size: .85rem; }
        kbd { padding: .1rem .4rem; border: 1px solid var(--line); border-bottom-width: 2px; border-radius: .35rem; font: 700 .78rem system-ui, sans-serif; }
        .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
        @media (max-width: 520px) { canvas { height: 190px; } }
    </style>
</head>
<body>
    <main>
        <div class="brand"><span class="brand-mark" aria-hidden="true">✳</span><span>Solara<small>FIELD SCHOOL</small></span></div>
        <h1>Solara Field School está temporalmente fuera de línea.</h1>
        <p>Gracias por tu paciencia.</p>

        <section class="game" aria-labelledby="game-title">
            <div class="game-head">
                <h2 id="game-title">Mientras tanto, cruza el sendero</h2>
                <div class="game-score" aria-hidden="true"><span>PUNTOS <strong id="score">0</strong></span><span>RÉCORD <strong id="best">0</strong></span></div>
            </div>
            <div class="game-stage">
                <canvas id="game" tabindex="0" role="img" aria-label="Juego Sendero: una persona camina por un sendero, salta piedras y troncos y recoge hojas. Pulsa espacio o toca para saltar."></canvas>
                <div class="game-overlay" id="overlay">
                    <p class="game-title" id="overlay-title">Sendero</p>
                    <p id="overlay-text">Salta las piedras y los troncos, y recoge las hojas para sumar puntos.</p>
                    <button class="game-button" id="play" type="button">Jugar</button>
                </div>
            </div>
            <p class="game-help">Saltar: <kbd>Espacio</kbd>, <kbd>↑</kbd> o toca el juego. Mantén pulsado para saltar más alto. Pausa: <kbd>P</kbd>.</p>
            <p class="sr-only" id="status" role="status" aria-live="polite"></p>
        </section>
    </main>
    <script>
    (function () {
        var canvas = document.getElementById('game');
        var ctx = canvas.getContext('2d');
        var overlay = document.getElementById('overlay');
        var overlayTitle = document.getElementById('overlay-title');
        var overlayText = document.getElementById('overlay-text');
        var playButton = document.getElementById('play');
        var scoreEl = document.getElementById('score');
        var bestEl = document.getElementById('best');
        var statusEl = document.getElementById('status');
        var colors = { sky: '#12301f', far: '#1b3f2c', mid: '#21492f', ground: '#2c5a3a', trail: '#6b5a3e', lime: '#d9eea2', text: '#f7f7ee', earth: '#a5835c', rock: '#8c9a8e', wood: '#7a5b3a', leaf: '#d9eea2' };
        var bestKey = 'solara-sendero-best';
        var best = 0;
        try { best = Number(localStorage.getItem(bestKey)) || 0; } catch (error) { best = 0; }
        bestEl.textContent = best;

        var W = 0, H = 0, ground = 0, scale = 1;
        function resize() {
            var ratio = window.devicePixelRatio || 1;
            W = canvas.clientWidth; H = canvas.clientHeight;
            canvas.width = Math.round(W * ratio); canvas.height = Math.round(H * ratio);
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            scale = H / 220;
            ground = H - 34 * scale;
            draw();
        }

        var state = 'ready';
        var leavesTaken = 0, lastHundred = 0;
        var player, obstacles, leaves, hills, speed, distance, score, spawnIn, leafIn, frame, holding, lastTime, flash;
        function reset() {
            player = { x: 54 * scale, y: 0, vy: 0, w: 22 * scale, h: 40 * scale, onGround: true, step: 0 };
            obstacles = []; leaves = []; speed = 5.2; distance = 0; score = 0; spawnIn = 60; leafIn = 90; frame = 0; flash = 0; leavesTaken = 0; lastHundred = 0;
            hills = [];
            for (var i = 0; i < 6; i++) hills.push({ x: i * 170 * scale, r: (60 + Math.random() * 50) * scale, layer: i % 2 });
            scoreEl.textContent = '0';
        }

        function jump() {
            if (state !== 'running') { start(); return; }
            if (player.onGround) { player.vy = -10.8 * scale; player.onGround = false; }
        }
        function start() {
            reset();
            state = 'running';
            overlay.hidden = true;
            statusEl.textContent = 'Juego iniciado.';
            canvas.focus({ preventScroll: true });
            lastTime = performance.now();
            requestAnimationFrame(loop);
        }
        function pause(on) {
            if (state === 'running' && on) {
                state = 'paused';
                showOverlay('Pausa', 'Puntos: ' + score + '. Pulsa para seguir.', 'Seguir');
            } else if (state === 'paused' && !on) {
                state = 'running';
                overlay.hidden = true;
                canvas.focus({ preventScroll: true });
                lastTime = performance.now();
                requestAnimationFrame(loop);
            }
        }
        function gameOver() {
            state = 'over';
            var record = score > best;
            if (record) { best = score; bestEl.textContent = best; try { localStorage.setItem(bestKey, String(best)); } catch (error) { /* sin almacenamiento */ } }
            showOverlay(record ? '¡Nuevo récord!' : 'Te tropezaste', 'Hiciste ' + score + ' puntos' + (record ? '.' : '. Tu récord es ' + best + '.'), 'Jugar otra vez');
            statusEl.textContent = (record ? 'Nuevo récord: ' : 'Fin del juego. Puntos: ') + score + '.';
        }
        function showOverlay(title, text, label) {
            overlayTitle.textContent = title; overlayText.textContent = text; playButton.textContent = label;
            overlay.hidden = false;
            playButton.focus({ preventScroll: true });
        }

        function spawnObstacle() {
            var kinds = [
                { kind: 'rock', w: 26, h: 20 },
                { kind: 'rock', w: 40, h: 26 },
                { kind: 'log', w: 46, h: 22 },
                { kind: 'stump', w: 24, h: 36 }
            ];
            var pick = kinds[Math.floor(Math.random() * kinds.length)];
            obstacles.push({ kind: pick.kind, x: W + 20, w: pick.w * scale, h: pick.h * scale });
            if (speed > 7.5 && Math.random() < .25) obstacles.push({ kind: 'rock', x: W + 20 + pick.w * scale + 8 * scale, w: 24 * scale, h: 18 * scale });
            spawnIn = Math.round((70 + Math.random() * 70) * (6 / speed));
        }

        function hit(a, b) {
            var pad = 5 * scale;
            return a.x + pad < b.x + b.w - pad && a.x + a.w - pad > b.x + pad && a.y + pad < b.y + b.h && a.y + a.h > b.y + pad;
        }

        function update(step) {
            frame += step;
            speed = Math.min(12.5, 5.2 + distance / 2600);
            var move = speed * scale * step;
            distance += speed * step;
            score = Math.floor(distance / 12) + leavesTaken * 5;
            if (Math.floor(score / 100) > lastHundred) { lastHundred = Math.floor(score / 100); flash = 30; }
            scoreEl.textContent = score;

            var gravity = (holding && player.vy < 0 ? .42 : .78) * scale;
            player.vy += gravity * step;
            player.y += player.vy * step;
            if (player.y >= 0) { player.y = 0; player.vy = 0; player.onGround = true; }
            player.step += speed * step * .12;

            spawnIn -= step;
            if (spawnIn <= 0) spawnObstacle();
            leafIn -= step;
            if (leafIn <= 0) {
                leaves.push({ x: W + 20, y: ground - (50 + Math.random() * 60) * scale, r: 9 * scale, spin: Math.random() * 6 });
                leafIn = 80 + Math.random() * 120;
            }
            var body = { x: player.x, y: ground - player.h + player.y, w: player.w, h: player.h };
            for (var i = obstacles.length - 1; i >= 0; i--) {
                var o = obstacles[i];
                o.x -= move;
                if (o.x + o.w < -20) { obstacles.splice(i, 1); continue; }
                if (hit(body, { x: o.x, y: ground - o.h, w: o.w, h: o.h })) { gameOver(); return; }
            }
            for (var j = leaves.length - 1; j >= 0; j--) {
                var l = leaves[j];
                l.x -= move; l.spin += .08 * step;
                if (l.x < -20) { leaves.splice(j, 1); continue; }
                if (hit(body, { x: l.x - l.r, y: l.y - l.r, w: l.r * 2, h: l.r * 2 })) { leaves.splice(j, 1); leavesTaken += 1; flash = 12; }
            }
            for (var k = 0; k < hills.length; k++) {
                var hl = hills[k];
                hl.x -= move * (hl.layer ? .35 : .15);
                if (hl.x + hl.r < 0) hl.x += 170 * scale * hills.length;
            }
            if (flash > 0) flash -= step;
        }

        function drawHiker(x, y, h) {
            var legSwing = player.onGround ? Math.sin(player.step) * 7 * scale : 4 * scale;
            ctx.lineCap = 'round';
            ctx.strokeStyle = colors.text; ctx.lineWidth = 4 * scale;
            ctx.beginPath();
            ctx.moveTo(x + 11 * scale, y + h - 14 * scale); ctx.lineTo(x + 11 * scale + legSwing, y + h);
            ctx.moveTo(x + 11 * scale, y + h - 14 * scale); ctx.lineTo(x + 11 * scale - legSwing, y + h);
            ctx.stroke();
            ctx.fillStyle = colors.earth;
            ctx.fillRect(x + 1 * scale, y + 12 * scale, 9 * scale, 15 * scale);
            ctx.fillStyle = colors.lime;
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(x + 6 * scale, y + 10 * scale, 12 * scale, 18 * scale, 4 * scale) : ctx.rect(x + 6 * scale, y + 10 * scale, 12 * scale, 18 * scale);
            ctx.fill();
            ctx.fillStyle = colors.text;
            ctx.beginPath(); ctx.arc(x + 13 * scale, y + 5 * scale, 5.5 * scale, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = colors.earth;
            ctx.fillRect(x + 6 * scale, y - 1 * scale, 14 * scale, 3 * scale);
            ctx.strokeStyle = colors.wood; ctx.lineWidth = 2.5 * scale;
            ctx.beginPath(); ctx.moveTo(x + 20 * scale, y + 14 * scale); ctx.lineTo(x + 25 * scale + legSwing * .3, y + h); ctx.stroke();
        }
        function drawObstacle(o) {
            var top = ground - o.h;
            if (o.kind === 'rock') {
                ctx.fillStyle = colors.rock;
                ctx.beginPath();
                ctx.moveTo(o.x, ground); ctx.lineTo(o.x + o.w * .12, top + o.h * .35); ctx.lineTo(o.x + o.w * .45, top);
                ctx.lineTo(o.x + o.w * .85, top + o.h * .25); ctx.lineTo(o.x + o.w, ground); ctx.closePath(); ctx.fill();
            } else if (o.kind === 'log') {
                ctx.fillStyle = colors.wood;
                ctx.fillRect(o.x, top + 4 * scale, o.w, o.h - 4 * scale);
                ctx.fillStyle = colors.earth;
                ctx.beginPath(); ctx.ellipse(o.x + o.w, top + o.h / 2 + 2 * scale, 6 * scale, (o.h - 4 * scale) / 2, 0, 0, Math.PI * 2); ctx.fill();
            } else {
                ctx.fillStyle = colors.wood;
                ctx.fillRect(o.x, top, o.w, o.h);
                ctx.fillStyle = colors.earth;
                ctx.fillRect(o.x - 2 * scale, top, o.w + 4 * scale, 5 * scale);
            }
        }
        function drawLeaf(l) {
            ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(Math.sin(l.spin) * .6);
            ctx.fillStyle = colors.leaf;
            ctx.beginPath(); ctx.ellipse(0, 0, l.r, l.r * .55, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = colors.sky; ctx.lineWidth = 1.5 * scale;
            ctx.beginPath(); ctx.moveTo(-l.r * .8, 0); ctx.lineTo(l.r * .8, 0); ctx.stroke();
            ctx.restore();
        }
        function draw() {
            if (!W) return;
            ctx.fillStyle = colors.sky; ctx.fillRect(0, 0, W, H);
            if (hills) for (var k = 0; k < hills.length; k++) {
                var hl = hills[k];
                ctx.fillStyle = hl.layer ? colors.mid : colors.far;
                ctx.beginPath(); ctx.arc(hl.x, ground + 10 * scale, hl.r * (hl.layer ? .8 : 1.2), Math.PI, 0); ctx.fill();
            }
            ctx.fillStyle = colors.ground; ctx.fillRect(0, ground, W, H - ground);
            ctx.strokeStyle = colors.trail; ctx.lineWidth = 3 * scale; ctx.setLineDash([14 * scale, 10 * scale]);
            ctx.lineDashOffset = distance ? (distance * scale) % (24 * scale) : 0;
            ctx.beginPath(); ctx.moveTo(0, ground + 12 * scale); ctx.lineTo(W, ground + 12 * scale); ctx.stroke();
            ctx.setLineDash([]);
            if (!player) reset();
            for (var i = 0; i < obstacles.length; i++) drawObstacle(obstacles[i]);
            for (var j = 0; j < leaves.length; j++) drawLeaf(leaves[j]);
            drawHiker(player.x, ground - player.h + player.y, player.h);
            if (flash > 0) { ctx.fillStyle = 'rgba(217, 238, 162, ' + (flash / 60) + ')'; ctx.fillRect(0, 0, W, 3 * scale); }
        }

        function loop(now) {
            if (state !== 'running') return;
            var step = Math.min(3, (now - lastTime) / (1000 / 60));
            lastTime = now;
            update(step);
            draw();
            if (state === 'running') requestAnimationFrame(loop);
        }

        playButton.addEventListener('click', function () {
            if (state === 'paused') pause(false); else start();
        });
        canvas.addEventListener('pointerdown', function (event) {
            event.preventDefault();
            holding = true;
            if (state === 'running') jump(); else if (state === 'paused') pause(false); else start();
        });
        window.addEventListener('pointerup', function () { holding = false; });
        document.addEventListener('keydown', function (event) {
            var key = event.key;
            var inGame = document.activeElement === canvas || state === 'running';
            if ((key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') && inGame) {
                event.preventDefault();
                if (event.repeat) return;
                holding = true;
                if (state === 'running') jump(); else if (state === 'paused') pause(false); else if (document.activeElement === canvas) start();
            }
            if ((key === 'p' || key === 'P' || key === 'Escape') && (state === 'running' || state === 'paused')) { event.preventDefault(); pause(state === 'running'); }
        });
        document.addEventListener('keyup', function (event) { if (event.key === ' ' || event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') holding = false; });
        document.addEventListener('visibilitychange', function () { if (document.hidden) pause(true); });
        window.addEventListener('resize', function () { var wasRunning = state === 'running'; resize(); if (!wasRunning) draw(); });
        reset();
        resize();
    })();
    </script>
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
