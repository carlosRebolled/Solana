<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name') }}</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-stone-50 text-stone-900 antialiased">
    <main class="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16 sm:px-12">
        <h1 class="text-6xl font-semibold tracking-tight sm:text-8xl">{{ config('app.name') }}</h1>
        <p class="mt-5 text-lg text-stone-600">Nuestro sitio web está en preparación.</p>
    </main>
</body>
</html>
