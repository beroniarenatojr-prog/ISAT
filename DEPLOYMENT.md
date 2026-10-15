# Deploying ISAT e-TRACES to Hostinger

Laravel 12 + Inertia/React + Vite. Target: Hostinger shared / Business hosting
(hPanel, PHP 8.2 or 8.3, MySQL).

---

## 1. Prepare the build locally (already done for you)

```bash
composer install --no-dev --optimize-autoloader   # lean vendor for production
npm ci                                             # exact deps
npm run build                                       # -> public/build/  (committed to the zip)
```

> `public/build/` and `vendor/` are `.gitignore`d, so they will **not** come from
> Git. They must be in the uploaded zip (see step 3) OR rebuilt on the server.

---

## 2. Create the database (hPanel)

hPanel -> **Databases -> MySQL Databases**

1. Create a database, e.g. `u123456_etraces`.
2. Create a user, e.g. `u123456_etraces`, strong password.
3. Add the user to the database with **ALL PRIVILEGES**.
4. Note: `DB_HOST` is `localhost`, `DB_PORT` `3306`.

hPanel -> **Advanced -> PHP Configuration**

- Set PHP version to **8.2** or **8.3**.
- Enable extensions: `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `curl`,
  `zip`, `bcmath`, `ctype`, `tokenizer`, `xml`, `gd`.

---

## 3. Upload the project

Zip the project **excluding** these, then upload via hPanel File Manager or SFTP:

```
.git/  node_modules/  tests/  .env  storage/logs/*  .phpunit.cache/  storage/framework/cache/data/*
```

**Include**: `vendor/`, `public/build/`, `public/pictures/`, everything else.

### Directory layout

Recommended — put the app OUTSIDE the web root and point the domain at `public/`:

```
~/domains/your-domain.com/
├── etraces/                 <-- extract the zip here (the Laravel project root)
│   ├── app/  bootstrap/  config/  public/  vendor/  ...
└── public_html/             <-- leave empty or delete
```

Then hPanel -> **Websites -> your-domain.com -> Dashboard -> "Website settings" /
"Change document root"** and set it to:

```
domains/your-domain.com/etraces/public
```

**If you cannot change the document root** (locked to `public_html`):

1. Move everything **except** the `public/` folder to `~/domains/your-domain.com/etraces/`.
2. Move the **contents** of `public/` into `public_html/`.
3. Edit `public_html/index.php` — change the two `require` paths:
   ```php
   require __DIR__.'/../etraces/vendor/autoload.php';
   $app = require_once __DIR__.'/../etraces/bootstrap/app.php';
   ```
4. Make sure `public_html/.htaccess` (Laravel's) was moved too.

---

## 4. Configure `.env` on the server

Copy `.env.example` to `.env` and fill it in:

```bash
cp .env.example .env
php artisan key:generate        # sets APP_KEY  (or paste one manually)
```

Edit `.env`:

| Key | Value |
|---|---|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_URL` | `https://your-domain.com` |
| `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` | from step 2 |
| `SESSION_SECURE_COOKIE` | `true` (needs HTTPS on) |

Session / cache / queue are set to `database` — no Redis needed on shared hosting.

---

## 5. Run the one-time setup (SSH / hPanel Browser Terminal)

```bash
cd ~/domains/your-domain.com/etraces

# if you did NOT upload vendor/:
composer install --no-dev --optimize-autoloader

php artisan storage:link          # public/storage -> storage/app/public (MOV uploads)
php artisan migrate --force
php artisan db:seed --force        # creates all KRAs, objectives and accounts

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

Permissions (File Manager or shell):

```bash
chmod -R 775 storage bootstrap/cache
```

---

## 6. SSL + HTTPS

hPanel -> **Security -> SSL** -> install the free Let's Encrypt certificate for
the domain, then enable **"Force HTTPS"**. (Required for `SESSION_SECURE_COOKIE=true`.)

---

## 7. Go-live security checklist

- [ ] `APP_DEBUG=false`, `APP_ENV=production` in `.env`
- [ ] `APP_KEY` is set
- [ ] **Change every seeded password.** All seeded accounts use `password`.
      Quick reset for the Principal, then use the User Management / Teacher
      Management pages for the rest:
      ```bash
      php artisan tinker --execute="\App\Models\User::where('email','principal@deped.gov.ph')->update(['password'=>bcrypt('a-strong-password')]);"
      ```
- [ ] Delete the test account: `php artisan tinker --execute="\App\Models\User::where('email','prince@gmail.com')->delete();"`
- [ ] `storage/` and `bootstrap/cache/` are writable (775)
- [ ] Log in as `principal@deped.gov.ph`, confirm the panels load
- [ ] Upload a test MOV as a teacher, confirm the file saves under `storage/app/public`

---

## 8. Re-deploying after code changes

```bash
# locally
git pull            # or upload changed files
npm run build       # if resources/js/** changed
# upload changed app/, resources/js/build output, etc.

# on the server
php artisan migrate --force        # if new migrations
php artisan optimize:clear
php artisan config:cache route:cache view:cache event:cache
```

---

## Notes

- **No `IpcrfRatingSeeder`** runs by default — ratings start empty (teachers show
  "Not rated yet"). Run `php artisan db:seed --class=IpcrfRatingSeeder --force`
  only if you want demo ratings.
- Uploaded files live in `storage/app/public/` and are served through the
  `public/storage` symlink. If the host blocks symlinks, create `public/storage`
  as a real folder and set `FILESYSTEM_DISK` accordingly, or copy files.
- The favicon (`public/favicon*.png`, `public/favicon.ico`) and
  `public/pictures/` assets must be uploaded.
- Cron (optional): if you later use queued jobs, add a cron job in hPanel:
  `* * * * * php ~/domains/your-domain.com/etraces/artisan schedule:run >/dev/null 2>&1`
