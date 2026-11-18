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
