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

ARG VITE_SOCKETIO_URL
ENV VITE_SOCKETIO_URL=$VITE_SOCKETIO_URL
RUN npm run build

# --------------------------------------------------------------
# Stage 2: PHP + Nginx runtime (serversideup/php)
# --------------------------------------------------------------
FROM serversideup/php:8.4-fpm-nginx

# Nginx document root → Laravel's public/
ENV NGINX_DOCUMENT_ROOT=/var/www/html/public
ENV AUTORUN_ENABLED=false

WORKDIR /var/www/html

# PHP extensions: PostgreSQL driver + Redis (for queues/cache/pubsub)
RUN install-php-extensions pdo_pgsql redis

# Copy application code
COPY . .

# Copy pre-built frontend from Stage 1
COPY --from=frontend /app/public/build ./public/build

# Composer — install production dependencies
RUN composer install --no-dev --no-interaction --optimize-autoloader

# Permissions: storage + bootstrap/cache must be writable
# (image's S6 init handles privilege dropping at runtime)
RUN chown -R nobody:nogroup /var/www/html/storage \
                           /var/www/html/bootstrap/cache

# ── Root entrypoint ──────────────────────────────────────────
# The base image sets USER nobody, but the entrypoint needs root
# to write nginx config. S6 init will drop privileges for services.
USER root

EXPOSE 80
