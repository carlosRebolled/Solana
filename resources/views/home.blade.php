<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Solara Field School. Una invitación a aprender en contacto con el entorno.">
    <title>Solara Field School</title>
    @vite(['resources/css/app.css'])
</head>
<body class="bg-[#f7f4e9] text-[#19382f] antialiased">
    <header class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6 sm:px-10">
        <a href="{{ route('home') }}" class="flex items-center gap-3 font-bold">
            <span aria-hidden="true" class="size-5 shrink-0 rounded-full bg-[#da8b3b]"></span>
            Solara Field School
        </a>
        <a href="#enfoque" class="underline decoration-[#88643b] underline-offset-4">Enfoque</a>
    </header>

    <main class="mx-auto max-w-6xl px-6 sm:px-10">
        <section class="grid items-center gap-10 border-t border-[#19382f]/20 py-12 md:grid-cols-2 md:gap-16 md:py-20">
            <div>
                <h1 class="font-serif text-5xl leading-[1.04] tracking-tight sm:text-7xl">Aprender al aire libre</h1>
                <p class="mt-6 max-w-md text-lg leading-relaxed">Solara Field School es una invitación a observar, hacer preguntas y aprender en contacto con el entorno.</p>
                <a href="#enfoque" class="mt-8 inline-block rounded-full bg-[#19382f] px-6 py-3 font-semibold text-white hover:bg-[#295444]">Conoce el enfoque</a>
            </div>

            <div class="field-illustration min-h-64 rounded-[2rem] md:min-h-96" aria-hidden="true"></div>
        </section>

        <section id="enfoque" class="scroll-mt-6 border-t border-[#19382f]/20 py-12 md:grid md:grid-cols-2 md:gap-16 md:py-16">
            <h2 class="font-serif text-4xl">El entorno como aula</h2>
            <p class="mt-4 max-w-lg text-lg leading-relaxed md:mt-0">Un recorrido puede empezar con una pregunta sencilla. ¿Qué cambia en un mismo lugar con el paso de las estaciones? Observar, registrar y comparar ayuda a encontrar respuestas.</p>
        </section>
    </main>

    <footer class="border-t border-[#19382f]/20">
        <div class="mx-auto max-w-6xl px-6 py-6 font-semibold sm:px-10">Solara Field School</div>
    </footer>
</body>
</html>
