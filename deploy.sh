#!/usr/bin/env bash
#
# Run this ON THE SERVER after uploading + creating .env.
# Safe to re-run for redeploys.
#
#   cd ~/domains/your-domain.com/etraces
#   bash deploy.sh
#
set -e

echo "==> ISAT e-TRACES deploy"

if [ ! -f .env ]; then
    echo "!! .env is missing. Copy .env.example to .env and fill it in first."
    exit 1
fi

if [ ! -d vendor ]; then
    echo "==> Installing production dependencies"
    composer install --no-dev --optimize-autoloader
fi

# Generate APP_KEY only if it is empty
if ! grep -q '^APP_KEY=base64:' .env; then
    echo "==> Generating APP_KEY"
    php artisan key:generate --force
fi

echo "==> Storage symlink"
php artisan storage:link || true

echo "==> Database migrations"
php artisan migrate --force

# First deploy only: seed reference data + accounts.
if [ "$1" = "--seed" ]; then
    echo "==> Seeding (KRAs, objectives, accounts)"
    php artisan db:seed --force
fi

echo "==> Clearing + caching config/routes/views"
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "==> Permissions"
chmod -R 775 storage bootstrap/cache || true

echo "==> Done. Open https://your-domain.com and log in as principal@deped.gov.ph"
echo "   Remember to change every default password (all seeded accounts = 'password')."
