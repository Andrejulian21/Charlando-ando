# ==============================================================
# Charlando-ando — Production Dockerfile (Render + Supabase)
# ==============================================================
# Stage 1: Build frontend assets (Node.js)
# --------------------------------------------------------------
FROM node:22-alpine AS frontend

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_SOCKETIO_URL=https://charlando-ando-socketio.onrender.com
ENV VITE_SOCKETIO_URL=$VITE_SOCKETIO_URL
RUN npm run build

# --------------------------------------------------------------
# Stage 2: PHP + Nginx runtime (serversideup/php)
# --------------------------------------------------------------
FROM serversideup/php:8.4-fpm-nginx

# Nginx document root → Laravel's public/
ENV NGINX_DOCUMENT_ROOT=/var/www/html/public
# Auto-run migrations at container startup (AUTORUN handles artisan commands)
ENV AUTORUN_ENABLED=true
ENV PHP_OPCACHE_ENABLE=1

WORKDIR /var/www/html

# Base image sets USER nobody → switch to root for build steps
USER root

# PHP extensions: PostgreSQL driver + Redis (for queues/cache/pubsub)
RUN install-php-extensions pdo_pgsql redis

# Copy application code
COPY . .

# Copy pre-built frontend from Stage 1
COPY --from=frontend /app/public/build ./public/build

# Composer — install production dependencies
RUN composer install --no-dev --no-interaction --optimize-autoloader

# Permissions: storage + bootstrap/cache must be writable
RUN mkdir -p /var/www/html/storage/logs \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/framework/cache/data \
    /var/www/html/bootstrap/cache && \
    touch /var/www/html/storage/logs/laravel.log && \
    chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache

# Container runs as root so S6 init can write nginx config at startup.
# S6 handles dropping privileges for PHP-FPM & Nginx services.
EXPOSE 80
