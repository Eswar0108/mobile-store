# Mobile Showcase & E-Commerce Platform

A full-featured single-vendor mobile phone e-commerce platform for the Indian market, built with React + Node.js.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, Zustand 4, TanStack Query 5, React Router v6, Recharts, Socket.io-client |
| **Backend** | Node.js, Express 4, Prisma 5, PostgreSQL, JWT, Socket.io 4, Razorpay, Cloudinary, Nodemailer |
| **Auth** | JWT (15min access + 7d refresh), HTTP-only cookies, RBAC (CUSTOMER / ADMIN / SALESPERSON / DELIVERY_AGENT) |
| **Payments** | Razorpay Orders API + HMAC webhook verification |
| **Media** | Cloudinary via multer-storage-cloudinary |
| **PDF** | PDFKit (invoice generation) |

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or a hosted instance via Railway / Render / Supabase)
- A [Razorpay](https://razorpay.com) test account
- A [Cloudinary](https://cloudinary.com) account
- A [SendGrid](https://sendgrid.com) API key (for transactional email)

---

## Project Structure

```
mobile selling/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── store/
    │   └── lib/
    ├── .env.example
    └── package.json
```

---

## Backend Setup

### 1. Install dependencies

```bash
cd "mobile selling/backend"
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

Required variables:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_ACCESS_SECRET=your_strong_secret_here
JWT_REFRESH_SECRET=your_other_strong_secret_here
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
CLIENT_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

### 3. Run database migration

```bash
npx prisma migrate dev --name init
```

### 4. Seed the database

```bash
npm run db:seed
```

This creates:
- Admin user: `admin@mobilestore.in` / `Admin@1234`
- Sample products, categories, banners, help articles

### 5. Start development server

```bash
npm run dev
```

Backend runs on **http://localhost:5000**

---

## Frontend Setup

### 1. Install dependencies

```bash
cd "mobile selling/frontend"
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

```env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Start development server

```bash
npm run dev
```

Frontend runs on **http://localhost:5173** with Vite proxy forwarding `/api` and `/socket.io` to `http://localhost:5000`.

---

## Deployment

### Build frontend

```bash
cd "mobile selling/frontend"
npm run build
# Output in dist/ — serve with any static host (Vercel, Netlify, etc.)
```

### Build backend

```bash
cd "mobile selling/backend"
npx prisma generate
npm start
```

For production, set `NODE_ENV=production` and use a process manager like PM2.

---

## Key Features

- **Product catalogue** with search, filters (category, price range, sale), compare (up to 3), and wishlist
- **Razorpay** online payment + COD checkout with address selection
- **JWT auth** with silent refresh and protected routes
- **Order tracking** with 6-step progress bar and status timeline
- **Return & refund** workflow (customer request → admin approve → refund)
- **Admin panel** with analytics (Recharts), product/inventory/coupon/banner management
- **Real-time notifications** via Socket.io
- **Role-based access** — ADMIN, SALESPERSON, DELIVERY_AGENT, CUSTOMER
- **PDF invoices** generated server-side with PDFKit
- **GST 18%** included in displayed prices
- **Help centre** with grouped articles and helpful/not-helpful feedback

---

## API Overview

All routes are prefixed with `/api`.

| Prefix | Description |
|---|---|
| `/auth` | Register, login, refresh, logout, forgot/reset password, addresses |
| `/products` | List, detail (by slug), admin CRUD, image upload |
| `/orders` | Create, list, detail, status update, invoice PDF, CSV export |
| `/payments` | Create Razorpay order, verify payment, webhook |
| `/returns` | Create return request, admin approve/reject/refund |
| `/reviews` | Create, admin moderate (pending/flagged) |
| `/coupons` | Validate, admin CRUD |
| `/banners` | List active, admin CRUD |
| `/wishlist` | Add, remove, list |
| `/notifications` | List, mark read |
| `/search` | Full-text product search |
| `/analytics` | Revenue, top products, orders, customers, categories |
| `/admin` | Users, inventory, audit logs |
| `/help` | Articles list, detail, feedback, admin CRUD |

---

## License

MIT
