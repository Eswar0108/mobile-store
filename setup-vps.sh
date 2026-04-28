#!/usr/bin/env bash
# =============================================================
# MobileStore — First-time Hostinger VPS Setup Script
# Run as root on a fresh Ubuntu 22.04 VPS
# Usage: bash setup-vps.sh yourdomain.com
# =============================================================
set -e

DOMAIN=${1:-yourdomain.com}
APP_DIR="/var/www/mobile-store"
REPO="https://github.com/Eswar0108/mobile-store.git"

echo ""
echo "========================================="
echo "  MobileStore VPS Setup"
echo "  Domain: $DOMAIN"
echo "========================================="
echo ""

# 1. System update
echo "[1/9] Updating system..."
apt-get update -q && apt-get upgrade -y -q

# 2. Install Node.js 20
echo "[2/9] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 3. Install Nginx, Git, Certbot
echo "[3/9] Installing Nginx, Git, Certbot..."
apt-get install -y nginx git certbot python3-certbot-nginx

# 4. Install PM2 globally
echo "[4/9] Installing PM2..."
npm install -g pm2

# 5. Create log dir for PM2
mkdir -p /var/log/pm2

# 6. Clone repo
echo "[5/9] Cloning repository..."
rm -rf $APP_DIR
git clone $REPO $APP_DIR

# 7. Setup backend
echo "[6/9] Setting up backend..."
cd $APP_DIR/backend
npm ci --omit=dev

# Create .env from example
cp .env.example .env
echo ""
echo "==========================================="
echo "  ACTION REQUIRED: Fill in .env values"
echo "  nano $APP_DIR/backend/.env"
echo ""
echo "  Required fields:"
echo "    DATABASE_URL    — from Neon console"
echo "    JWT_ACCESS_SECRET — any 40+ char string"
echo "    JWT_REFRESH_SECRET — any 40+ char string"
echo "    RAZORPAY_KEY_ID"
echo "    RAZORPAY_KEY_SECRET"
echo "    CLOUDINARY_CLOUD_NAME"
echo "    CLOUDINARY_API_KEY"
echo "    CLOUDINARY_API_SECRET"
echo "    FRONTEND_URL=https://$DOMAIN"
echo "    NODE_ENV=production"
echo "==========================================="
echo ""
read -rp "Press ENTER after you've filled in .env to continue setup..."

# Run Prisma
echo "[7/9] Running Prisma generate + migrate..."
cd $APP_DIR/backend
npx prisma generate
npx prisma db push
npm run db:seed || echo "(Seed skipped or already done)"

# 8. Build frontend
echo "[8/9] Building frontend..."
cd $APP_DIR/frontend
RAZORPAY_KEY=$(grep RAZORPAY_KEY_ID $APP_DIR/backend/.env | cut -d= -f2)
echo "VITE_RAZORPAY_KEY_ID=$RAZORPAY_KEY" > .env
npm ci
npm run build

# 9. Configure Nginx
echo "[9/9] Configuring Nginx..."
NGINX_CONF="/etc/nginx/sites-available/mobile-store"

cat > $NGINX_CONF << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    root $APP_DIR/frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

ln -sf $NGINX_CONF /etc/nginx/sites-enabled/mobile-store
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Start API with PM2
echo "Starting API with PM2..."
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash

# SSL
echo ""
echo "========================================="
echo "  Setting up HTTPS (Let's Encrypt)..."
echo "========================================="
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect || \
  echo "SSL setup failed — ensure domain DNS points to this server's IP first."

echo ""
echo "========================================="
echo "  SETUP COMPLETE!"
echo ""
echo "  App URL:    https://$DOMAIN"
echo "  API URL:    https://$DOMAIN/api"
echo "  Admin:      https://$DOMAIN/admin"
echo "  PM2 status: pm2 status"
echo "  API logs:   pm2 logs mobilestore-api"
echo "========================================="
