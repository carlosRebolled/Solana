<?php

use Illuminate\Filesystem\Filesystem;
use Illuminate\Foundation\Vite;

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$app->make(Vite::class)
    ->useHotFile(storage_path('framework/static-export.hot'))
    ->createAssetPathsUsing(fn (string $path): string => '/'.$path);

$html = view('home')->render();
$files = new Filesystem;
$output = base_path('dist');
$files->ensureDirectoryExists($output);
$files->deleteDirectory($output.'/build');

if (! $files->copyDirectory(public_path('build/assets'), $output.'/build/assets')
    || $files->put($output.'/index.html', $html) === false) {
    throw new RuntimeException('No se pudo exportar la portada.');
}
