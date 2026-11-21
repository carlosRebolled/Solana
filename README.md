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

Para probar la vitrina en local, ejecuta `php -S 127.0.0.1:8874 -t site` y abre `http://127.0.0.1:8874`.

El catálogo, los precios y el carrito son de demostración. Los clips están disponibles públicamente y el progreso se conserva en el navegador. Para vender cursos reales hará falta integrar un proveedor de pagos y alojar los videos de pago con acceso controlado.

Para publicar resultados reales, edita `metrics` en `site/app.js` con los totales verificados y su periodo de medición en ambos idiomas. Un valor `null` se muestra como «Por publicar». El encabezado de contacto de `site/index.html` puede actualizarse cuando esté definido el canal oficial.

Cloudflare Workers publica la carpeta `site/` desde la rama `main`, con `npx wrangler deploy` como comando de despliegue. Deja vacío el comando de compilación. El archivo `wrangler.jsonc` identifica el Worker y su dominio personalizado.
