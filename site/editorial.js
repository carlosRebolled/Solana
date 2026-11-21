const topics = {
    campo: ['Trabajo de campo', 'Fieldwork'],
    biodiversidad: ['Biodiversidad', 'Biodiversity'],
    educacion: ['Educación', 'Education']
};

const posts = [
    {
        id: 'cuaderno-de-campo', topic: 'campo', image: 'field', course: 'campo',
        es: ['Cómo empezar un cuaderno de campo', 'Una página bien organizada te ayuda a recordar qué observaste y a comparar tus salidas.', [
            ['Anota el contexto', 'Escribe la fecha, el lugar y las condiciones antes de describir el hallazgo. Un croquis sencillo puede ayudarte a recordar desde dónde observaste.'],
            ['Distingue lo que ves de lo que supones', '“El suelo estaba húmedo” es una observación. “Llovió durante la noche” es una hipótesis. Anótalas por separado y busca evidencia adicional.'],
            ['Cierra con una pregunta', '¿Qué podrías observar en la próxima visita para poner a prueba tu hipótesis? Deja esa pregunta al final de la página.']
        ]],
        en: ['How to start a field notebook', 'A well-organized page helps you recall what you saw and compare your outings.', [
            ['Record the context', 'Write the date, place and conditions before describing what you found. A quick sketch can help you remember your viewpoint.'],
            ['Separate observation from inference', '“The ground was damp” is an observation. “It rained overnight” is a hypothesis. Write them separately and look for more evidence.'],
            ['End with a question', 'What could you observe on your next visit to test your hypothesis? Leave that question at the end of the page.']
        ]]
    },
    {
        id: 'observar-biodiversidad', topic: 'biodiversidad', image: 'biodiversity', course: 'biodiversidad',
        es: ['Cómo observar biodiversidad en un recorrido corto', 'Prueba una observación por capas y aprende a comparar dos visitas al mismo lugar.', [
            ['Elige dónde y cuándo observar', 'Usa un tramo accesible y decide cuánto tiempo dedicarás a observar. Si vuelves, repite el recorrido y la duración para que tus notas sean más comparables.'],
            ['Mira a distintas alturas', 'Comienza cerca del suelo y sigue con el sotobosque y el dosel. Escribe una diferencia que puedas describir entre esas capas.']
        ]],
        en: ['How to observe biodiversity on a short walk', 'Observe different layers and compare two visits to the same place.', [
            ['Choose where and when to observe', 'Use an accessible section and decide how long to observe. Repeat the route and duration on your next visit so your notes are easier to compare.'],
            ['Look at different heights', 'Start near the ground, then look at the understory and canopy. Write down one difference you can describe between those layers.']
        ]]
    },
    {
        id: 'preparar-gira-educativa', topic: 'educacion', image: 'forest',
        es: ['Una pregunta para preparar tu próxima gira educativa', 'Diseña una salida alrededor de un objetivo que los estudiantes puedan explorar por sí mismos.', [
            ['Escoge un objetivo observable', 'Plantea una pregunta que el grupo pueda investigar. Por ejemplo, ¿en qué parte del recorrido se ve más cobertura vegetal?'],
            ['Reserva tiempo para conversar', 'Después de la observación, reúne al grupo y compara los registros. Pregunta qué evidencia respalda cada respuesta y qué quedó pendiente.']
        ]],
        en: ['One question to plan your next school field trip', 'Build an outing around a goal students can explore themselves.', [
            ['Choose an observable goal', 'Ask a question the group can investigate. For example, where along the route can we see more vegetation cover?'],
            ['Leave time for discussion', 'Bring the group together afterward to compare notes. Ask what evidence supports each answer and what remains open.']
        ]]
    },
    {
        id: 'leer-el-paisaje', topic: 'campo', image: 'trail', course: 'sendero',
        es: ['Pistas para leer el paisaje', 'Fíjate en la pendiente, la humedad y la sombra para entender cómo cambia un lugar.', [
            ['Compara dos puntos', 'Desde el sendero, elige un punto abierto y otro bajo sombra. Registra cómo cambia la vegetación y qué señales de humedad puedes ver.'],
            ['Dibuja el recorrido del agua', 'Busca zonas bajas y cambios de pendiente. Traza en tu cuaderno por dónde crees que pasa el agua y marca qué señales apoyan esa idea.']
        ]],
        en: ['Clues for reading a landscape', 'Look for slopes, moisture and shade to understand how a place changes.', [
            ['Compare two spots', 'From the trail, choose an open spot and a shaded one. Record how the vegetation changes and what signs of moisture you can see.'],
            ['Sketch where water flows', 'Look for low areas and changes in slope. Sketch where you think water moves and mark the clues that support your idea.']
        ]]
    }
];

const byId = (id) => document.getElementById(id);
let language = 'es';
const tr = (es, en) => language === 'en' ? en : es;
const normalize = (value) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

function card(post, featured = false) {
    const [title, excerpt] = post[language];
    const category = tr(...topics[post.topic]);
    return `<article class="editorial-card${featured ? ' editorial-featured' : ''}">
        <a href="./articulo.html?post=${post.id}">
            <img src="./media/${post.image}.jpg" width="640" height="360" alt="" ${featured ? '' : 'loading="lazy"'}>
            <div class="editorial-card-copy">
                <p class="editorial-meta">${featured ? tr('Destacado', 'Featured') + ' · ' : ''}${category}</p>
                <${featured ? 'h2' : 'h3'}>${title}</${featured ? 'h2' : 'h3'}>
                <p>${excerpt}</p>
                <span class="editorial-read">${tr('Leer artículo', 'Read article')}</span>
            </div>
        </a>
    </article>`;
}

function filterPosts() {
    const results = byId('blog-posts');
    if (!results) return;
    const term = normalize(byId('blog-search').value.trim());
    const topic = byId('blog-topic').value;
    const matching = posts.filter((post, index) =>
        (term || topic || index > 0) &&
        (!topic || post.topic === topic) &&
        normalize([...post.es.slice(0, 2), ...post.en.slice(0, 2), ...topics[post.topic]].join(' ')).includes(term)
    );
    results.innerHTML = matching.map((post) => card(post)).join('');
    byId('blog-results').textContent = matching.length
        ? tr(`${matching.length} ${matching.length === 1 ? 'artículo' : 'artículos'}`, `${matching.length} ${matching.length === 1 ? 'article' : 'articles'}`)
        : tr('No hay artículos para estos filtros.', 'No articles match these filters.');
}

export function renderEditorial(locale) {
    language = locale;
    const homepage = byId('home-posts');
    const featured = byId('blog-featured');
    const article = byId('blog-article');

    if (homepage) homepage.innerHTML = posts.slice(0, 3).map((post) => card(post)).join('');
    if (featured) {
        document.title = 'Blog | Solara Field School';
        featured.innerHTML = card(posts[0], true);
        filterPosts();
    }
    if (!article) return;

    const id = new URLSearchParams(location.search).get('post');
    const post = posts.find((entry) => entry.id === id);
    if (!post) {
        article.innerHTML = `<h1>${tr('Artículo no encontrado', 'Article not found')}</h1>`;
        return;
    }

    const [title, excerpt, sections] = post[language];
    document.title = `${title} | Solara Field School`;
    article.innerHTML = `<p class="editorial-meta">${tr(...topics[post.topic])}</p>
        <h1>${title}</h1><p class="article-intro">${excerpt}</p>
        <img class="article-cover" src="./media/${post.image}.jpg" width="960" height="480" alt="">
        <div class="article-body">
            ${sections.map(([heading, body]) => `<section><h2>${heading}</h2><p>${body}</p></section>`).join('')}
            ${post.course ? `<a class="button dark" href="./curso.html?curso=${post.course}" target="_blank" rel="noopener">${tr('Ver curso relacionado', 'View related course')}</a>` : ''}
        </div>
        <section class="related-posts"><h2>${tr('También te puede interesar', 'You may also like')}</h2>
            <div class="editorial-grid">${posts.filter((entry) => entry.id !== id).slice(0, 2).map((entry) => card(entry)).join('')}</div>
        </section>`;
}

byId('blog-search')?.addEventListener('input', filterPosts);
byId('blog-topic')?.addEventListener('change', filterPosts);
