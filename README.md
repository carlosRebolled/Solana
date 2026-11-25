# Solana

Base del sitio web de Solana con Laravel 13, Blade, Tailwind CSS y Vite.

## Desarrollo local

Requisitos: PHP 8.3 o superior con PDO SQLite, Composer y Node.js 22.12 o superior con npm.

Para preparar una copia recién clonada desde PowerShell:

```powershell
composer install
Copy-Item .env.example .env
php artisan key:generate
php -r "file_exists('database/database.sqlite') || touch('database/database.sqlite');"
php artisan migrate
npm.cmd ci
npm.cmd run build
php artisan serve
```

Abre [http://127.0.0.1:8000](http://127.0.0.1:8000). Si vas a editar CSS o JavaScript, ejecuta `npm.cmd run dev` en otra terminal para ver los cambios al guardar.

La página inicial está en `resources/views/home.blade.php` y las rutas web están en `routes/web.php`. Cada entorno utiliza su propio archivo `.env`. Comparte los valores de ejemplo en `.env.example`.

## Pruebas

```powershell
php artisan test
```

## Publicación en Cloudflare

La vitrina pública de [solarafieldschool.com](https://solarafieldschool.com) vive en `site/`. Edita `index.html` para cambiar la presentación, `styles.css` para el diseño y `app.js` para actualizar el catálogo y el temario. Las fotos y los clips están en `site/media/`.

Cada ficha utiliza la plantilla `site/curso.html` y el identificador del curso en la URL, por ejemplo `/curso.html?curso=campo`. En `site/app.js`, actualiza `courses` y su entrada en `englishCourses` para cambiar la descripción, los objetivos y las lecciones. Los videos siguen el nombre `<identificador>-<número de lección>.mp4`.

Para probar la vitrina en local, ejecuta `php -S 127.0.0.1:8874 -t site` y abre `http://127.0.0.1:8874`.

La navegación pública incluye `catalogo.html` (búsqueda y filtros), `escuelas.html` (directorio y fichas con `?area=`), `curso.html?curso=` y `precios.html` (precios de muestra). La lista `schools` de `site/app.js` organiza los cursos por área.

El catálogo, los precios y el carrito son de demostración. Los clips están disponibles públicamente y el progreso se conserva en el navegador. Para vender cursos reales hará falta integrar un proveedor de pagos y alojar los videos de pago con acceso controlado.

Para publicar resultados reales, edita `metrics` en `site/app.js` con los totales verificados y su periodo de medición en ambos idiomas. Un valor `null` se muestra como «Por publicar». El encabezado de contacto de `site/index.html` puede actualizarse cuando esté definido el canal oficial.

Cloudflare Workers publica la carpeta `site/` en el dominio personalizado desde la rama `main`, con `npx wrangler deploy` como comando de despliegue. Deja vacío el comando de compilación. El archivo `wrangler.jsonc` identifica el Worker y su dominio.

## Dónde editar el contenido

Todo lo publicado vive en `site/`. Cada texto visible tiene su versión en inglés junto a la española (atributo `data-en` en HTML o la pareja `es`/`en` en JavaScript); actualiza siempre las dos.

| Contenido | Archivo | Qué cambiar |
| --- | --- | --- |
| Cursos (título, nivel, descripción, lecciones) | `site/app.js` | `courses` (español) y `englishCourses` (inglés), con el mismo `id` |
| Videos de las lecciones | `site/media/` | `<id del curso>-<número de lección>.mp4`, por ejemplo `campo-1.mp4` |
| Fotos de cursos y escuelas | `site/media/` | `<image>.jpg`, según el campo `image` del curso o la escuela |
| Precios | `site/app.js` | `price` de cada curso (USD). Son precios de muestra hasta que se confirmen los definitivos |
| Escuelas | `site/app.js` | `schools`: `id`, título en ambos idiomas y lista de cursos |
| Seis áreas temáticas | `site/index.html` y `site/catalogo.html` | `<select id="catalog-topic">`; el `value` debe coincidir con el `topic` de cada curso |
| Temas de la portada («Explora por tema») | `site/index.html` | Botones `data-topic` (usan el `id` de un curso) |
| Artículos del blog | `site/editorial.js` | `topics` y `posts` (texto en `es` y `en`, foto y curso relacionado) |
| Resultados | `site/app.js` | `metrics`: solo totales verificados y su periodo; `null` muestra «Por publicar» |
| Contacto | `site/index.html` | Sección `id="contacto"`; actualiza también la respuesta de contacto en `site/help-chat.js` |
| Burbuja de ayuda | `site/help-chat.js` | `questions`: pregunta, respuesta y enlace opcional en ambos idiomas |
| Programas, público y sobre nosotros | `site/index.html` | Secciones `id="programas"`, `id="publico"` y la sección «Sobre nosotros» |
| Diseño | `site/styles.css` | Colores de marca en las variables de `:root` |

Los nuevos archivos que pongas en `site/` quedan públicos al publicar. No guardes ahí videos de pago, borradores ni datos privados. Cloudflare rechaza archivos de más de 25 MiB en `site/`.

Para publicar, sube los cambios a `main`. Cloudflare despliega automáticamente y el cambio aparece en solarafieldschool.com cuando termine el despliegue (revisa su estado en el panel de Workers).
