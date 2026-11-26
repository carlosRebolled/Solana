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

Cada ficha utiliza la plantilla `site/curso.html` y el identificador del curso en la URL, por ejemplo `/curso.html?curso=campo`. En `site/data.js`, actualiza `courses` y su entrada en `englishCourses` para cambiar la descripción, los objetivos y las lecciones. Los videos siguen el nombre `<identificador>-<número de lección>.mp4`.

Para probar la vitrina en local, ejecuta `php -S 127.0.0.1:8874 -t site` y abre `http://127.0.0.1:8874`.

La navegación pública incluye `catalogo.html` (búsqueda y filtros), `escuelas.html` (directorio y fichas con `?area=`), `curso.html?curso=` y `precios.html` (precios de muestra). La lista `schools` de `site/data.js` organiza los cursos por área (cada escuela tiene un `topic`), y `paths` define las rutas de aprendizaje (`ruta.html?ruta=`).

El catálogo, los precios y el carrito son de demostración. Los clips están disponibles públicamente y el progreso se conserva en el navegador. Para vender cursos reales hará falta integrar un proveedor de pagos y alojar los videos de pago con acceso controlado.

Para publicar resultados reales, edita `metrics` en `site/app.js` con los totales verificados y su periodo de medición en ambos idiomas. Un valor `null` se muestra como «Por publicar». El encabezado de contacto de `site/index.html` puede actualizarse cuando esté definido el canal oficial.

Cloudflare Workers se despliega desde la rama `main` con `npx wrangler deploy`. Mientras la publicación esté pausada, `wrangler.jsonc` despliega `cloudflare/private-site.js` y deja fuera la carpeta `site/`. Para reabrir el sitio, se puede revertir el commit que activó la pausa.

## Dónde editar el contenido

Todo lo publicado vive en `site/`. Cada texto visible tiene su versión en inglés junto a la española (atributo `data-en` en HTML o la pareja `es`/`en` en JavaScript); actualiza siempre las dos.

| Contenido | Archivo | Qué cambiar |
| --- | --- | --- |
| Cursos (título, nivel, descripción, lecciones) | `site/data.js` | `courses` (español) y `englishCourses` (inglés), con el mismo `id` |
| Videos de las lecciones | `site/media/` | `<id del curso>-<número de lección>.mp4`, por ejemplo `campo-1.mp4` |
| Fotos de cursos y escuelas | `site/media/` | `<image>.jpg`, según el campo `image` del curso o la escuela |
| Precios | `site/data.js` | `price` de cada curso (USD). Son precios de muestra hasta que se confirmen los definitivos |
| Escuelas | `site/data.js` | `schools`: `id`, `topic`, título y descripción en ambos idiomas |
| Rutas, planes, testimonios de ejemplo, footer | `site/data.js` | `paths`, `plans`, `testimonials`, `events`, `footerColumns` |
| Campaña promocional | `site/data.js` | `promotion`: déjala con `active: false` mientras no haya campaña real |
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

## Pruebas del sitio público

El diseño de las páginas públicas usa `site/ui.css` y los módulos `site/ui.js`, `home.js`, `catalog.js`, `school.js`, `path.js`, `course.js` y `prices.js`. Para revisarlo en local:

```powershell
npm.cmd run site
```

Las pruebas de Playwright abren cada página y comprueban errores, resoluciones y componentes interactivos:

```powershell
npm.cmd run test:site
```

El informe del rediseño y la comparación de medidas están en `tests/visual/INFORME.md`.

## Pagos

El carrito lleva a `site/pago.html`, donde la persona revisa el pedido, escribe sus datos, acepta las condiciones y elige PayPal. Por ahora es una **vista previa**: `payments.paypal.enabled` vale `false` en `site/data.js`, así que no se abre PayPal, no se cobra nada y los datos del formulario no se envían ni se guardan.

Para cobrar de verdad hace falta:

1. Una cuenta de PayPal Business y una app creada en el panel de desarrolladores de PayPal, primero en modo *sandbox*.
2. El Client ID público en `payments.paypal.clientId`. La clave secreta nunca va en `site/`: se guarda en Cloudflare con `wrangler secret put PAYPAL_CLIENT_SECRET`.
3. Un Worker que cree y capture la orden en el servidor con el precio de `site/data.js`. El total que envía el navegador no se debe tomar como válido.
4. Precios definitivos, las condiciones de compra, la política de privacidad y de reembolsos publicadas, y los videos de pago con acceso controlado. Hoy los videos de `site/media/` son públicos.

## Cuentas

El botón «Iniciar sesión» de la esquina superior derecha lleva a `site/login.html`. Las cuentas todavía no están activas: el formulario con correo y contraseña solo valida los campos y no guarda ni envía la contraseña. El botón «Entrar con la cuenta de demostración» abre `site/mi-cuenta.html`, el panel de un cliente que ya compró cursos, con:

- resumen: cursos activos, clases completadas, progreso general, tiempo de video visto y total pagado;
- «Continúa donde lo dejaste», con un enlace a la siguiente clase;
- tabla de cursos con su progreso y estado, y cursos guardados;
- rutas en las que avanza, historial de pagos, certificados de finalización y perfil.

La cuenta y sus pagos vienen de `demoAccount` en `site/data.js` y se muestran con la etiqueta «Demostración». El progreso de las clases es el real de este navegador. La sesión de demostración solo guarda una marca en `localStorage` (`solara-demo-session`).

Para las cuentas reales, `cloudflare/schema.sql` propone las tablas para Cloudflare D1: usuarios, sesiones, organizaciones, cursos, clases, pedidos, pagos, accesos, progreso, certificados, becas y cursos guardados. Al final del archivo se indica de qué tablas sale cada estadística del panel. Hará falta además un Worker que gestione el registro, el inicio de sesión con contraseñas cifradas y las cookies de sesión.
