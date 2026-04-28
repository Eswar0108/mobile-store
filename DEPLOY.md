# Hostinger Deployment Guide

This guide covers deploying on **Hostinger VPS** (Ubuntu 22.04) or **Hostinger Cloud Hosting** (Node.js plan).

---

## Option A — Hostinger VPS (Recommended)

### 1. Connect to VPS via SSH
```bash
ssh root@YOUR_VPS_IP
```

### 2. Install Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v  # should print v20.x.x
```

### 3. Install PM2 and Nginx
```bash
npm install -g pm2
sudo apt-get install -y nginx
```

### 4. Install Git and clone the repo
```bash
sudo apt-get install -y git
git clone https://github.com/Eswar0108/mobile-store.git /var/www/mobilestore
cd /var/www/mobilestore
```

### 5. Setup Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy

# Create .env (copy from .env.example and fill values)
cp .env.example .env
nano .env
# Set:
#   DATABASE_URL=<your Neon connection string>
#   JWT_ACCESS_SECRET=<long random string>
#   JWT_REFRESH_SECRET=<long random string>
#   RAZORPAY_KEY_ID=rzp_live_xxx
#   RAZORPAY_KEY_SECRET=xxx
#   CLOUDINARY_CLOUD_NAME=xxx
#   CLOUDINARY_API_KEY=xxx
#   CLOUDINARY_API_SECRET=xxx
#   NODE_ENV=production
#   PORT=5000
#   FRONTEND_URL=https://yourdomain.com

# Seed initial data (first deploy only)
npm run db:seed

# Start with PM2
pm2 start src/app.js --name mobilestore-api
pm2 save
pm2 startup
```

### 6. Build and serve Frontend
```bash
cd /var/www/mobilestore/frontend

# Create .env
echo "VITE_RAZORPAY_KEY_ID=rzp_live_xxx" > .env

npm install
npm run build
# Output is in dist/
```

### 7. Configure Nginx

Create `/etc/nginx/sites-available/mobilestore`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend — serve built React app
    root /var/www/mobilestore/frontend/dist;
    index index.html;

    # React Router — serve index.html for all frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io proxy
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/mobilestore /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. Enable HTTPS with Let's Encrypt (free SSL)
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Option B — Hostinger Node.js Managed Hosting

If you're on Hostinger's **Business** or **Cloud** plan with Node.js support:

1. Go to **hPanel → Node.js** section
2. Set **Node.js version** to 20.x
3. Set **entry point** to `backend/src/app.js`
4. Set **environment variables** in hPanel's env manager (same as `.env.example`)
5. Upload files via **File Manager** or connect via **Git deployment** (hPanel → Git)
6. Run in **SSH terminal**:
   ```bash
   cd backend && npm install && npx prisma generate && npx prisma migrate deploy
   ```
7. For the frontend: build locally (`npm run build`), upload the `dist/` folder to `public_html/`
8. Add `.htaccess` in `public_html/` for React Router:
   ```apache
   Options -MultiViews
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteRule ^ index.html [QSA,L]
   ```

---

## Environment Variables Checklist

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | [Neon Console](https://console.neon.tech) → Connection string |
| `JWT_ACCESS_SECRET` | Any 40+ char random string |
| `JWT_REFRESH_SECRET` | Any 40+ char random string (different from above) |
| `RAZORPAY_KEY_ID` | [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Same location |
| `CLOUDINARY_CLOUD_NAME` | [Cloudinary Console](https://cloudinary.com/console) |
| `CLOUDINARY_API_KEY` | Cloudinary Console → API Keys |
| `CLOUDINARY_API_SECRET` | Cloudinary Console → API Keys |
| `FRONTEND_URL` | Your production domain, e.g. `https://mobilestore.in` |

---

## Updating the App

```bash
cd /var/www/mobilestore
git pull origin main
cd backend && npm install && npx prisma migrate deploy
cd ../frontend && npm install && npm run build
pm2 restart mobilestore-api
```
