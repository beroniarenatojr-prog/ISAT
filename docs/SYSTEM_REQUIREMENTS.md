# ISAT-DMS System Requirements

## Description

This document outlines the complete hardware and software requirements for developing, testing, and deploying the ISAT Document Management System. It provides detailed specifications for:

**Development Environment:**
- **Hardware:** Minimum 4GB RAM, Intel Core i3; Recommended 8GB RAM, Intel Core i5/i7 with SSD
- **Software:** XAMPP 8.2+, PHP 8.2+, MySQL 8.0+, Composer, Node.js 18.x, NPM, Git
- **Tools:** VS Code or PhpStorm, modern web browsers (Chrome, Firefox, Edge)

**Production Environment:**
- **Server:** VPS/Cloud with 2-16 vCPU cores, 4-32GB RAM depending on user load
- **Security:** SSL/TLS certificates, firewall configuration, regular backups
- **Performance:** OPcache, route/config caching, database optimization

The requirements scale from small deployments (50-100 users) to large implementations (500+ users) with detailed specifications for each tier.

---

## Table of Contents
- [Hardware Requirements](#hardware-requirements)
- [Software Requirements](#software-requirements)
- [Network Requirements](#network-requirements)
- [Browser Requirements](#browser-requirements)
- [Development Environment Setup](#development-environment-setup)
- [Production Environment Requirements](#production-environment-requirements)

---

## Hardware Requirements

### For Development

#### Minimum Requirements
| Component | Specification |
|-----------|--------------|
| **Processor** | Intel Core i3 or AMD Ryzen 3 (2.0 GHz or higher) |
| **RAM** | 4 GB |
| **Storage** | 10 GB available space (SSD recommended) |
| **Display** | 1366 x 768 resolution |
| **Network** | Ethernet or Wi-Fi adapter |

#### Recommended Requirements
| Component | Specification |
|-----------|--------------|
| **Processor** | Intel Core i5/i7 or AMD Ryzen 5/7 (2.5 GHz or higher) |
| **RAM** | 8 GB or more |
| **Storage** | 20 GB available space (SSD required) |
| **Display** | 1920 x 1080 resolution or higher |
| **Network** | Gigabit Ethernet or Wi-Fi 5/6 |

#### Optimal Requirements (for large datasets and better performance)
| Component | Specification |
|-----------|--------------|
| **Processor** | Intel Core i7/i9 or AMD Ryzen 7/9 (3.0 GHz or higher, multi-core) |
| **RAM** | 16 GB or more |
| **Storage** | 50 GB available space (NVMe SSD) |
| **Display** | 2560 x 1440 resolution or higher |
| **Network** | Gigabit Ethernet or Wi-Fi 6 |

**Notes for Development:**
- SSD storage significantly improves development experience (faster file access, builds)
- More RAM allows running multiple services (database, web server, IDE, browser)
- Multi-core processors improve build times and parallel processing

---

### For Production Server

#### Small Deployment (50-100 users)
| Component | Specification |
|-----------|--------------|
| **Processor** | 2-4 vCPU cores (2.4 GHz or higher) |
| **RAM** | 4-8 GB |
| **Storage** | 50 GB SSD |
| **Bandwidth** | 10 Mbps (minimum) |
| **Backup Storage** | 100 GB (offsite recommended) |

#### Medium Deployment (100-500 users)
| Component | Specification |
|-----------|--------------|
| **Processor** | 4-8 vCPU cores (2.6 GHz or higher) |
| **RAM** | 8-16 GB |
| **Storage** | 100 GB SSD (RAID 1 recommended) |
| **Bandwidth** | 50 Mbps |
| **Backup Storage** | 500 GB (offsite required) |

#### Large Deployment (500+ users)
| Component | Specification |
|-----------|--------------|
| **Processor** | 8-16 vCPU cores (3.0 GHz or higher) |
| **RAM** | 16-32 GB or more |
| **Storage** | 250 GB SSD (RAID 10 recommended) |
| **Bandwidth** | 100 Mbps or higher |
| **Backup Storage** | 1 TB+ (offsite required, redundant backups) |
| **Load Balancer** | Recommended for high availability |

**Production Server Notes:**
- Virtual Private Server (VPS) or dedicated server recommended
- Cloud hosting options: AWS, DigitalOcean, Vultr, Linode, Azure
- RAID configuration for data redundancy and availability
- Regular backup strategy essential

---

## Software Requirements

### For Development

#### Core Requirements

| Software | Version | Purpose | Download Link |
|----------|---------|---------|--------------|
| **Operating System** | Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+) | Host operating system | - |
| **XAMPP** | 8.2.x or higher | Local development server (Apache, MySQL, PHP) | https://www.apachefriends.org/ |
| **PHP** | 8.2 or higher | Server-side programming language | Included in XAMPP |
| **MySQL** | 8.0 or higher | Relational database | Included in XAMPP |
| **Composer** | 2.x or higher | PHP dependency manager | https://getcomposer.org/ |
| **Node.js** | 18.x or higher (LTS recommended) | JavaScript runtime | https://nodejs.org/ |
| **NPM** | 9.x or higher | Node package manager | Included with Node.js |
| **Git** | 2.x or higher | Version control | https://git-scm.com/ |

#### Development Tools

| Software | Version | Purpose | Download Link |
|----------|---------|---------|--------------|
| **Code Editor** | Latest | IDE for development | VS Code, PhpStorm, Sublime Text |
| **Visual Studio Code** | Latest (Recommended) | Lightweight, extensible IDE | https://code.visualstudio.com/ |
| **Web Browser** | Latest | Testing and debugging | Chrome, Firefox, Edge, Safari |
| **Postman/Insomnia** | Latest (Optional) | API testing | https://www.postman.com/ |
| **MySQL Workbench** | Latest (Optional) | Database management GUI | https://www.mysql.com/products/workbench/ |
| **phpMyAdmin** | Latest | Web-based database management | Included in XAMPP |

#### PHP Extensions (Required)

These extensions should be enabled in `php.ini`:

- **OpenSSL** - Encryption and security
- **PDO** - Database abstraction
- **Mbstring** - Multibyte string support
- **Tokenizer** - PHP tokenizer support
- **XML** - XML parsing
- **Ctype** - Character type checking
- **JSON** - JSON manipulation
- **BCMath** - Arbitrary precision mathematics
- **Fileinfo** - File information
- **GD** - Image processing (for captcha, image manipulation)
- **Zip** - ZIP archive support
- **Curl** - URL transfer library

**To enable extensions in XAMPP:**
1. Open `C:\xampp\php\php.ini`
2. Find the extension line (e.g., `;extension=gd`)
3. Remove the semicolon (`;`) to uncomment
4. Restart Apache in XAMPP Control Panel

---

### For Production Server

#### Core Requirements

| Software | Version | Purpose |
|----------|---------|---------|
| **Operating System** | Ubuntu 20.04/22.04 LTS, CentOS 8+, or Windows Server 2019+ | Server operating system |
| **Web Server** | Apache 2.4+ or Nginx 1.18+ | HTTP server |
| **PHP** | 8.2 or higher | Server-side language |
| **MySQL** | 8.0 or higher | Database server |
| **Composer** | 2.x or higher | Dependency manager |
| **SSL Certificate** | Valid TLS 1.2+ | HTTPS encryption |
| **Node.js** | 18.x LTS | For asset building (if building on server) |

#### Optional Production Software

| Software | Purpose |
|----------|---------|
| **Redis** | Session storage and caching |
| **Memcached** | Alternative caching solution |
| **Supervisor** | Process monitoring for queue workers |
| **Certbot** | Free SSL certificates (Let's Encrypt) |
| **Fail2ban** | Intrusion prevention |
| **UFW/Firewall** | Network security |

#### Production PHP Configuration

**Recommended `php.ini` settings:**

```ini
; Memory and Execution
memory_limit = 256M
max_execution_time = 300
max_input_time = 300
post_max_size = 20M
upload_max_filesize = 20M

; Error Handling (Production)
display_errors = Off
display_startup_errors = Off
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
log_errors = On
error_log = /path/to/php-error.log

; Session
session.cookie_httponly = 1
session.cookie_secure = 1
session.use_strict_mode = 1

; OPcache (Performance)
opcache.enable = 1
opcache.memory_consumption = 128
opcache.interned_strings_buffer = 8
opcache.max_accelerated_files = 10000
opcache.revalidate_freq = 2
opcache.fast_shutdown = 1

; Security
expose_php = Off
allow_url_fopen = On
allow_url_include = Off
```

---

## Network Requirements

### Development Environment

| Requirement | Specification |
|-------------|--------------|
| **Connection Type** | Ethernet or Wi-Fi |
| **Speed** | 5 Mbps minimum (for package downloads) |
| **Ports** | 80 (HTTP), 443 (HTTPS), 3306 (MySQL), 3000 (Vite Dev Server) |

### Production Environment

| Requirement | Specification |
|-------------|--------------|
| **Connection Type** | Dedicated internet connection |
| **Speed** | 10-100 Mbps (based on user load) |
| **Static IP** | Recommended for domain mapping |
| **Firewall** | Must allow HTTP (80), HTTPS (443) |
| **SSH** | Port 22 (for server management) |
| **Database Port** | 3306 (should be restricted, not public) |

**Required Firewall Rules:**

```bash
# Allow HTTP
Allow incoming on port 80 (TCP)

# Allow HTTPS
Allow incoming on port 443 (TCP)

# Allow SSH (restrict to specific IPs if possible)
Allow incoming on port 22 (TCP)

# Block direct MySQL access from internet
Block incoming on port 3306 (TCP) except from localhost/VPN
```

---

## Browser Requirements

### Supported Browsers

The ISAT-DMS web application is compatible with modern web browsers:

| Browser | Minimum Version | Recommended Version |
|---------|----------------|---------------------|
| **Google Chrome** | 90+ | Latest stable |
| **Mozilla Firefox** | 88+ | Latest stable |
| **Microsoft Edge** | 90+ (Chromium-based) | Latest stable |
| **Safari** | 14+ | Latest stable |
| **Opera** | 76+ | Latest stable |

### Browser Requirements

- **JavaScript:** Must be enabled
- **Cookies:** Must be enabled (for session management)
- **Local Storage:** Supported (HTML5)
- **TLS/SSL:** Support for TLS 1.2 or higher
- **Screen Resolution:** Minimum 1024x768 (1366x768 recommended)

### Browser Features Used

- ES6+ JavaScript support
- CSS3 and Flexbox/Grid layout
- Fetch API or XMLHttpRequest
- Web Storage API (localStorage, sessionStorage)
- Form validation API

### Unsupported Browsers

- Internet Explorer (all versions)
- Opera Mini
- Browsers with JavaScript disabled
- Very old browser versions (5+ years old)

---

## Development Environment Setup

### Step-by-Step Installation Guide

#### 1. Install XAMPP

**Windows:**
1. Download XAMPP from https://www.apachefriends.org/
2. Run installer as Administrator
3. Select components: Apache, MySQL, PHP, phpMyAdmin
4. Install to `C:\xampp\`
5. Start Apache and MySQL from XAMPP Control Panel

**macOS:**
1. Download XAMPP for macOS
2. Open DMG file and drag to Applications
3. Run XAMPP from Applications folder
4. Start Apache and MySQL

**Linux (Ubuntu/Debian):**
```bash
# Download and extract
wget https://www.apachefriends.org/xampp-files/8.2.12/xampp-linux-x64-8.2.12-0-installer.run
chmod +x xampp-linux-x64-8.2.12-0-installer.run
sudo ./xampp-linux-x64-8.2.12-0-installer.run

# Start services
sudo /opt/lampp/lampp start
```

#### 2. Install Composer

**Windows:**
1. Download Composer installer from https://getcomposer.org/
2. Run `Composer-Setup.exe`
3. Follow installation wizard
4. Verify: `composer --version`

**macOS/Linux:**
```bash
# Download and install
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php
php -r "unlink('composer-setup.php');"
sudo mv composer.phar /usr/local/bin/composer

# Verify
composer --version
```

#### 3. Install Node.js and NPM

**Windows:**
1. Download Node.js LTS from https://nodejs.org/
2. Run installer (includes NPM)
3. Verify: `node --version` and `npm --version`

**macOS:**
```bash
# Using Homebrew
brew install node

# Verify
node --version
npm --version
```

**Linux (Ubuntu/Debian):**
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

#### 4. Install Git

**Windows:**
1. Download Git from https://git-scm.com/
2. Run installer
3. Use default settings or customize as needed
4. Verify: `git --version`

**macOS:**
```bash
# Using Homebrew
brew install git

# Or use Xcode Command Line Tools
xcode-select --install
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install git

# Verify
git --version
```

#### 5. Clone and Setup Project

```bash
# Navigate to XAMPP htdocs
cd C:\xampp\htdocs  # Windows
cd /Applications/XAMPP/htdocs  # macOS
cd /opt/lampp/htdocs  # Linux

# Clone repository (if using Git)
git clone [repository-url] ISAT-DMS
cd ISAT-DMS

# Or copy project files to this location

# Install PHP dependencies
composer install

# Install JavaScript dependencies
npm install

# Copy environment file
cp .env.example .env  # Linux/macOS
copy .env.example .env  # Windows

# Generate application key
php artisan key:generate

# Create database
# Open phpMyAdmin (http://localhost/phpmyadmin)
# Create new database named: isat_etraces

# Update .env file with database credentials
# DB_DATABASE=isat_etraces
# DB_USERNAME=root
# DB_PASSWORD=

# Run migrations
php artisan migrate

# Seed database (optional - for test data)
php artisan db:seed

# Build frontend assets
npm run build

# For development with hot reload
npm run dev

# Start Laravel development server
php artisan serve
```

#### 6. Access Application

- **Development URL:** http://localhost:8000
- **phpMyAdmin:** http://localhost/phpmyadmin
- **XAMPP Dashboard:** http://localhost/dashboard

---

## Production Environment Requirements

### Server Specifications

**Minimum for production:**
- Ubuntu 20.04/22.04 LTS or CentOS 8+
- 2 CPU cores, 4 GB RAM
- 50 GB SSD storage
- Static IP address
- Domain name (recommended)

### Security Requirements

1. **SSL/TLS Certificate**
   - Valid SSL certificate (Let's Encrypt or commercial)
   - Force HTTPS redirect
   - HSTS header enabled

2. **Firewall Configuration**
   - UFW (Ubuntu) or firewalld (CentOS)
   - Only necessary ports open
   - Rate limiting enabled

3. **File Permissions**
   ```bash
   # Laravel directories
   chmod -R 755 /path/to/project
   chmod -R 775 storage bootstrap/cache
   chown -R www-data:www-data /path/to/project
   ```

4. **Environment Configuration**
   - `APP_ENV=production`
   - `APP_DEBUG=false`
   - Strong `APP_KEY` generated
   - Secure database credentials
   - HTTPS URLs

5. **Regular Backups**
   - Daily database backups
   - Weekly full system backups
   - Offsite backup storage
   - Backup restoration testing

### Performance Requirements

1. **PHP OPcache enabled**
2. **Laravel optimization commands run:**
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   composer install --optimize-autoloader --no-dev
   ```
3. **Database indexing optimized**
4. **CDN for static assets (optional)**
5. **Redis/Memcached for caching (optional)**

---

## Compatibility Matrix

### PHP Version Compatibility

| PHP Version | Laravel 11 | MySQL 8.0 | Status |
|-------------|-----------|-----------|--------|
| 8.2.x | ✅ Full Support | ✅ Compatible | **Recommended** |
| 8.3.x | ✅ Full Support | ✅ Compatible | Supported |
| 8.1.x | ⚠️ Minimum | ✅ Compatible | Not Recommended |
| 8.0.x | ❌ Not Supported | ✅ Compatible | Not Compatible |

### Database Compatibility

| Database | Version | Status |
|----------|---------|--------|
| MySQL | 8.0+ | ✅ **Recommended** |
| MySQL | 5.7+ | ⚠️ Limited Support |
| MariaDB | 10.6+ | ✅ Compatible |
| PostgreSQL | 13+ | ⚠️ Not Tested |
| SQLite | 3.35+ | ⚠️ Development Only |

### Node.js Compatibility

| Node Version | NPM Version | Status |
|--------------|-------------|--------|
| 18.x LTS | 9.x+ | ✅ **Recommended** |
| 20.x LTS | 10.x+ | ✅ Supported |
| 16.x | 8.x+ | ⚠️ End of Life |
| <16.x | - | ❌ Not Supported |

---

## Troubleshooting Common Issues

### Development Environment

**Issue: "composer: command not found"**
- Solution: Add Composer to system PATH or use full path

**Issue: "npm: command not found"**
- Solution: Reinstall Node.js or add to PATH

**Issue: "Port 80 already in use"**
- Solution: Stop conflicting service (IIS, Skype) or change Apache port

**Issue: "SQLSTATE[HY000] [2002] Connection refused"**
- Solution: Start MySQL in XAMPP, check .env database credentials

**Issue: "Class 'ZipArchive' not found"**
- Solution: Enable php_zip extension in php.ini

### Production Environment

**Issue: 500 Internal Server Error**
- Check Laravel logs: `storage/logs/laravel.log`
- Verify file permissions
- Check web server error logs

**Issue: Mix manifest not found**
- Solution: Run `npm run build` to compile assets

**Issue: "Base table or view not found"**
- Solution: Run `php artisan migrate`

---

**Document Version:** 1.0  
**Last Updated:** September 2, 2026  
**Status:** Technical Documentation
