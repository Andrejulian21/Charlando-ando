# ==============================================================
# Charlando-ando — Production Dockerfile (Render + Supabase)
# ==============================================================
# Stage 1: Build frontend assets (Node.js)
# --------------------------------------------------------------
FROM node:22-alpine AS frontend

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_SOCKETIO_URL
ENV VITE_SOCKETIO_URL=$VITE_SOCKETIO_URL
RUN npm run build

# --------------------------------------------------------------
# Stage 2: PHP + Nginx runtime (serversideup/php)
# --------------------------------------------------------------
FROM serversideup/php:8.3-fpm-nginx

# Nginx document root → Laravel's public/
ENV NGINX_DOCUMENT_ROOT=/var/www/html/public
ENV AUTORUN_ENABLED=false

WORKDIR /var/www/html

# ── Root steps ──────────────────────────────────────────────
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
RUN chown -R nobody:nobody /var/www/html/storage \
                           /var/www/html/bootstrap/cache

# ── Nobody user (runtime) ────────────────────────────────────
USER nobody

# Migration & cache commands run at container startup
# via Render's post-deploy hook, NOT at build time,
# because env vars (DB_HOST, etc.) are only available at runtime.

EXPOSE 80
