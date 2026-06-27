# Charlando-ando

Plataforma de chat en tiempo real inspirada en Discord — Laravel 13 + Inertia.js + React + Socket.io.

## Stack

| Capa        | Tecnología                                    |
|-------------|-----------------------------------------------|
| Backend     | Laravel 13 (PHP 8.4)                          |
| Tiempo real | Socket.io 4 (sidecar Node.js 22 vía Redis pub/sub) |
| Autenticación | Laravel Socialite — Google OAuth              |
| Frontend    | Inertia.js 2 + React 19 + Tailwind CSS 4      |
| Estado      | Zustand                                       |
| Base de datos | MySQL 8                                     |
| Desarrollo local | Laravel Sail (Docker Compose)                 |

## Desarrollo local

```bash
# Levantar el stack completo: Laravel, MySQL, Redis, sidecar Socket.io
./vendor/bin/sail up -d

# Instalar dependencias PHP y JS
./vendor/bin/sail composer install
./vendor/bin/sail npm install

# Ejecutar migraciones y sembrar permisos
./vendor/bin/sail artisan migrate --seed

# Compilar y observar el frontend
./vendor/bin/sail npm run dev
```

El sidecar de Socket.io expone un endpoint `/health` en el puerto 3000.
El puente completo pub/sub, verificación JWT y seguimiento de presencia se agregaron en PR3.

## Arquitectura

```
React  --HTTP-->  Laravel  --Redis publish-->  Socket.io sidecar  --WebSocket-->  React
                                                       |
                                                       +-- Redis SETEX presencia
```

Inertia sirve la SPA de React desde el mismo proceso de Laravel. Las páginas viven en
`resources/js/pages/` y se cargan de forma diferida mediante `resources/js/app.jsx`.

## Modelo de datos

- `users` (extendido con `provider`, `provider_id`, `display_name`, `status`, `last_seen_at`)
- `servers`, `channels`, `server_members`, `roles`, `permissions`, `role_permission`
- `messages` (polimórfico — pertenece a un canal o a un hilo de mensaje directo)
- `direct_messages` (par único mediante índice funcional `LEAST`/`GREATEST` en MySQL)
- `channel_overrides`, `channel_override_permission` (matriz de permisos por canal)
- `invites` (de un solo uso o multi-uso, con caducidad opcional)

## Historia del proyecto

Este repositorio se construyó mediante PRs encadenados. Estado actual: **completo**.

- [x] **PR1** — Cimientos: Laravel scaffold, compose de MySQL/Redis/Socket.io, 12 migraciones, 10 modelos, Inertia + React + Tailwind + tema Deep Space.
- [x] **PR2** — Auth + Backend principal (Socialite, JWT, controladores de Server/Channel/Message, PermissionResolver, InviteService).
- [x] **PR3** — Infraestructura en tiempo real (Socket.io server.js, presencia, broadcasting de eventos).
- [x] **PR4** — Frontend (store Zustand, páginas de chat, scroll infinito, DMs, configuración).
- [x] **PR5** — Tests (PHPUnit feature/unit + humo manual).
