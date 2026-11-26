# Informe: estructura de plataforma para Solara

Rama: `rediseno-estructura-platzi`. Sin commits, push ni despliegues. Fecha: 2026-11-24.

## Método

- **Referencia:** páginas públicas de platzi.com, inspeccionadas con el navegador integrado y con Chromium de Playwright, a 1440 × 900, 768 × 1024 y 375–390 px de ancho. Las medidas salen de `getBoundingClientRect` y de los estilos computados.
- **Comparación:** `npm run visual:geometry` (con `npm run site` en otra terminal) mide los mismos componentes en las dos webs y genera `tests/visual/output/geometria.md`. Las capturas de la referencia se guardan en `tests/visual/reference/` y no se suben a git.
- **Sin porcentajes de similitud.** Comparar píxeles no tiene sentido cuando la marca, las fotos y los textos son distintos a propósito. La comparación es geométrica: ancho, alto y posición.
- **La referencia sirve variantes A/B del hero:** en tres cargas hubo tres composiciones distintas. Las diferencias del hero dependen de la variante que toque.

## Estado por página

| Página | Archivo | Estado |
| --- | --- | --- |
| Home | `site/index.html` + `home.js` | Implementada con diferencias |
| Catálogo | `site/catalogo.html` + `catalog.js` | Implementada con diferencias |
| Escuelas (directorio y ficha) | `site/escuelas.html` + `school.js` | Implementada con diferencias |
| Ruta de aprendizaje | `site/ruta.html` + `path.js` (nueva) | Implementada con diferencias |
| Curso | `site/curso.html` + `course.js` | Implementada con diferencias |
| Precios | `site/precios.html` + `prices.js` + `pricing.js` | Implementada con diferencias |
| Blog y artículo | Solo encabezado y footer nuevos | Parcialmente actualizada |

"Con diferencias" significa que la estructura y la interacción están construidas y probadas, pero quedan diferencias medidas (ver abajo).

## Secciones de la home (orden real de la referencia)

| # | Sección | Componente | Estado |
| --- | --- | --- | --- |
| 01 | Encabezado | `.site-header`, menú móvil con panel, Escape, bloqueo de scroll y foco | Hecho. Medida: 1440 × 72, idéntica |
| 02 | Banner promocional | `renderPromotion` + `promotion` en `data.js` | Desactivado: no hay campaña real. Vista previa con `/?promo=preview` y cuenta regresiva calculada |
| 03 | Hero | Título, subtítulo y 4 clases de muestra reales con duración leída del video | Hecho. Contenedor 1240 px, columnas de 588 px y separación de 64 px, como la referencia |
| 04 | Calendario de aprendizaje | — | **Pendiente: no existe en la versión inspeccionada**, así que no se inventó |
| 05 | Registro | Formulario dentro del hero, como en la referencia | Demostración: valida el correo y no lo guarda ni lo envía |
| 06 | Historias de éxito | Carrusel con botones, arrastre, teclado y límites | Hecho. Tarjeta 660 × 352, idéntica. **Testimonios de ejemplo**, etiquetados así |
| 07–09 | Aprendizaje personalizado, enfoque y práctica | Vitrina con pantalla fija al desplazarse | Hecho: selector de metas con ruta, reproductor con progreso y ejercicio con validación local |
| 10 | Escuelas | Carrusel de 6 escuelas con ilustraciones propias | Hecho. Tarjeta 338 × 420, idéntica |
| 11 | Comunidad | Mosaico en CSS Grid con las 4 fotos propias | Hecho. Sin la animación de imágenes al desplazarse que tiene la referencia |
| 12 | Actividades | 3 tarjetas con los programas reales de Solara | Hecho. 393 × 593 frente a 394 × 603 |
| 13 | Metas | Etiquetas estáticas alrededor del título (en la referencia no son interactivas) | Hecho |
| 14 | Llamada final | Título y botón hacia `catalogo.html` | Hecho |
| — | Planes (está en la home de la referencia) | `renderPlans` | Hecho |
| 15 | Footer | Columnas generadas desde `footerColumns` | Hecho. Más bajo: 343 frente a 532 px, porque Solara tiene menos enlaces |

También se conservaron las secciones propias de Solara: Programas, Público, Sobre nosotros (con las métricas «Por publicar»), Blog, Contacto y Preguntas frecuentes. Siguen funcionando los anclajes `#programas`, `#publico`, `#nosotros`, `#contacto` y `#preguntas`.

## Otras páginas

- **Catálogo (16–18):** filtros de escuela, ruta, nivel, búsqueda y «Solo clases de muestra». Los filtros se sincronizan con la URL (`?escuela=`, `?ruta=`, `?nivel=`, `?q=`, `?muestra=1`). Hay estado vacío y botón para quitar filtros. Al elegir una ruta se respeta su orden. Las tarjetas horizontales van a dos columnas: 514 px de ancho, como la referencia, pero 128 px de alto frente a 112.
- **Escuela (19–20):** un único diseño generado desde `schools`, con número de rutas y cursos, tarjetas de ruta desplegables, cursos y equipo. `?area=paisaje` sigue funcionando como alias.
- **Ruta (21–24):** requisitos como recomendación (no obligatorios), cursos numerados en orden, duración real sumada de los videos («Por definir» si no hay video) y equipo. Sin `?ruta=` muestra todas las rutas.
- **Curso (25–29):** hero con estadísticas, vista previa con estados de carga y error, temario plegable sin saltos de altura, clases bloqueadas en los cursos en preparación, reproductor y carrito existentes, equipo y opiniones de ejemplo. No se muestra ninguna valoración como real.
- **Precios (30–35):** pestañas Personas / Instituciones con teclado, tarjetas desde `plans`, tabla comparativa con alternativa plegable en móvil, selector de grupo (5–40 estudiantes) con precio «Por confirmar» porque no hay fórmula definida, sección de pagos (sin pagos reales) y métricas «Por publicar».

## Datos y contenido simulado

- `site/data.js` reúne escuelas, rutas, cursos, equipo, testimonios, actividades, metas, promoción, planes y footer, con sus relaciones.
- **Reales:** los 3 cursos con video (`campo`, `biodiversidad` y `sendero`), los programas, los textos institucionales y las fotos de `site/media/`.
- **De demostración, marcados en pantalla:**
  - 5 cursos «En preparación», sin video ni precio;
  - las rutas;
  - los testimonios y las opiniones, con la etiqueta «Ejemplo»;
  - el equipo docente: solo funciones, sin personas inventadas;
  - los precios de muestra (USD 29 y USD 39, ya existentes);
  - el registro y el carrito.

## Pruebas ejecutadas

`npm run test:site` → **78 pruebas superadas**. Cubren:
- 17 rutas abiertas directamente: sin errores de consola ni recursos fallidos, un solo `h1`, botones con nombre accesible e imágenes con `alt`;
- desbordamiento horizontal y títulos cortados en 6 páginas × 8 resoluciones (1920 a 375 px);
- menú móvil;
- registro;
- banner y cuenta regresiva;
- duraciones reales;
- carrusel y sus límites;
- vitrina y ejercicio;
- filtros y URL del catálogo;
- navegación Home → Escuela → Ruta → Curso → Vista previa;
- temario y curso bloqueado;
- precios y límites del grupo;
- cambio de idioma;
- carrito;
- `prefers-reduced-motion`.

No hay linter configurado para `site/`. No se ejecutó `php artisan test`, porque la parte Laravel no se tocó.

## Diferencias visuales pendientes (medidas a 1440 × 900)

- **Tipografía:** se mantiene Georgia, la fuente de Solara, en lugar de la sans de la referencia. Es más ancha, así que los títulos ocupan más líneas en algunas páginas: H1 de la escuela con 96 frente a 72 px de alto, y del curso con 86 frente a 48.
- **Tarjeta de curso del catálogo:** 16 px más alta.
- **Comunidad y metas:** la referencia anima imágenes y etiquetas con el desplazamiento dentro de una sección fija de unos 3000 px. Aquí hay apariciones suaves, sin esa coreografía.
- **Testimonios y escuelas:** el número de tarjetas visibles coincide a 1440 px. En móvil no se comparó tarjeta por tarjeta.
- **Footer:** menos columnas y enlaces.
- **Blog y artículo:** conservan sus estilos internos claros dentro del tema oscuro.

## Limitaciones

- No hay autenticación, pagos, perfiles docentes ni testimonios autorizados.
- Las capturas de la referencia no se guardan en el repositorio.
- La referencia cambia de variante entre cargas.

## Comandos

```powershell
npm.cmd run site
```

```powershell
npm.cmd run test:site
```

```powershell
npm.cmd run visual:geometry
```

El primero sirve `site/` en http://127.0.0.1:8874. El tercero necesita el primero en marcha y conexión a internet.

## Cambios del 2026-11-25

- **Diseño anterior restaurado** a pedido, con su aspecto original:
  - en la home, el encabezado, la franja del blog, el hero «Aprende más allá del aula» con «Explora por tema» y la sección «¿Qué quieres aprender?» con sus filtros;
  - `blog.html` y `articulo.html`, completas.
- **Oferta del Documento Maestro cargada en `site/data.js`:**
  - las 6 áreas como escuelas, con los temas de la sección 05;
  - los 20 cursos de la sección 06, con su ola (A, B o C), el público al que se dirigen y sus temas como temario. Nivel, precio y videos quedan «Por definir» o «Por confirmar»;
  - 6 rutas propuestas que agrupan los cursos según ese público;
  - los planes institucionales: programas a medida y capacitación institucional.
- **Se eliminaron los 5 cursos de demostración inventados** en la versión anterior.
- **Home actualizada con el documento:**
  - Programas: las 3 líneas de soluciones y los formatos de entrega;
  - Público: los 6 segmentos;
  - Sobre nosotros: la identidad y la estrategia geográfica;
  - Becas: las 5 propuestas, como programa todavía no abierto.
- **Asignación a revisar:** el área de cada curso no aparece explícitamente en el documento; la elegí yo y está en `catalog` dentro de `data.js`.
- **Pruebas:** `npm run test:site` → 77 superadas.

## Cambios del 2026-11-26 (sin commit)

**SEO**
- **Páginas estáticas:** 70 en total (23 cursos, 6 escuelas y 6 rutas, cada una en español e inglés), generadas con `npm run seo:build`.
- **Direcciones limpias:** en inglés llevan las palabras clave del documento maestro, por ejemplo `/course-outdoor-risk-management-for-schools-camps-and-youth-programs`.
- **Metadatos:** título y descripción propios, canónica, `hreflang`, Open Graph y datos estructurados `Course`, `ItemList` y `BreadcrumbList`. Las páginas principales también tienen canónica y Open Graph, y la portada los datos de la organización.
- **Archivos para buscadores:** `sitemap.xml` con 80 direcciones y `robots.txt`.
- **Idioma:** al cambiarlo, se pasa a la página del otro idioma. Las direcciones antiguas siguen funcionando.
- **Fotos:** de 2,45 MB a 1,52 MB en total.

**Ficha del curso, para vender**
- Tarjeta de compra con precio, «Comprar ahora», «Añadir al carrito» y la lista de lo que incluye el curso.
- Barra fija de compra al bajar por la página.
- Tres ventajas del curso en el hero.
- Secciones «Para quién es este curso», «Preguntas frecuentes» y «Cursos relacionados».
- En los cursos en preparación, el botón dice «Avísame cuando esté disponible».

**Portada y carrito**
- Las tarjetas del catálogo muestran «Clases de muestra» o «Próximamente» y abren el curso en la misma pestaña.
- El carrito muestra la miniatura de cada curso y, si está vacío, un enlace al catálogo.
- En el catálogo, los cursos con clases aparecen primero.

**Pruebas:** `npm run test:site` → 114 superadas, 8 de ellas nuevas de SEO.
