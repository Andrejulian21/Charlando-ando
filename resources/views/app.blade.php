<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full antialiased">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="color-scheme" content="dark">
        <meta name="theme-color" content="#0B0B12">

        <title inertia>{{ config('app.name', 'Charlando-ando') }}</title>

        <link rel="icon" href="/icono.png" sizes="32x32" type="image/png">
        <link rel="icon" href="/icono.png" sizes="64x64" type="image/png">
        <link rel="apple-touch-icon" href="/icono.png" sizes="180x180">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body class="min-h-full bg-deep-space-900 text-slate-100 font-sans">
        @inertia
    </body>
</html>
