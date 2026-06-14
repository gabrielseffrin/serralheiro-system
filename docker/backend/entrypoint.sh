#!/bin/bash
set -e

cd /var/www/html

# Install/update Composer dependencies
if [ -f composer.json ]; then
    composer install --no-interaction --prefer-dist --optimize-autoloader 2>&1
fi

# Generate app key if not set
if [ -f .env ] && grep -q "^APP_KEY=$" .env 2>/dev/null; then
    php artisan key:generate --no-interaction 2>&1
fi

# Run migrations
php artisan migrate --no-interaction 2>&1 || true

# Start the development server
exec php artisan serve --host=0.0.0.0 --port=8000
