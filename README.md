<div align="center">

# ☕ Velluto Cafe POS System

### 🏆 Built for Odoo × Parul University Hackathon — Final Round

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF)](https://razorpay.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Theme: Coffee](https://img.shields.io/badge/Theme-Coffee_Premium-4E3629?style=for-the-badge)](#-darklight-theme-system)
[![Responsive](https://img.shields.io/badge/Responsive-100%25-success?style=for-the-badge)](#-screenshots)

<br/>

> **A production-grade, multi-portal Cafe & Restaurant POS ecosystem** built with a decoupled multi-frontend architecture — serving Admin, Cashier, and Kitchen roles through a single secure Flask REST API backed by PostgreSQL.

<br/>

</div>

---

## 👥 Team

| Role | Name | GitHub |
|:---|:---|:---|
| 🧑‍💼 **Team Leader & Full Stack Dev** | Krish Modh | [github.com/KrishModh](https://github.com/KrishModh) |
| 🎨 **Frontend Developer** | Aakansha Patidar | [github.com/your-link-here](#) |
| ⚙️ **Backend & Database** | Sahil Khan | [github.com/your-link-here](#) |

> 📌 Replace the `#` placeholders above with actual GitHub profile links.

---

## 📖 Table of Contents

1. [Project Overview](#-project-overview)
2. [Team](#-team)
3. [Key Highlights](#-key-highlights)
4. [Features](#-features)
5. [Authentication & Security](#-authentication--security)
6. [Tech Stack](#-tech-stack)
7. [Folder Structure](#-folder-structure)
8. [Installation Guide](#-installation-guide)
9. [Environment Variables](#-environment-variables)
10. [Demo Accounts](#-demo-accounts)
11. [Order Flow](#-order-flow)
12. [API Reference](#-api-reference)
13. [Future Roadmap](#-future-roadmap)
14. [License](#-license)

---

## 🌟 Project Overview

**Velluto Cafe POS** was built to solve a real operational problem — traditional POS systems are single-screen, disconnected, and leave Admins, Cashiers, and Kitchen staff working in silos.

We fixed that by distributing the system across **three purpose-built portals**, all connected to one real-time backend:

```mermaid
graph TD
    A[🖥️ Admin Dashboard] <-->|Analytics, Inventory, Staff Control| API[⚡ Flask REST API]
    B[💳 Cashier POS Portal] <-->|Tables, Orders, Payments| API
    C[🍳 Kitchen Display System] <-->|Live Order Queue & Status| API
    API <--> D[(🗄️ PostgreSQL Database)]
```

Each portal is tailored to the user's workflow — not a generic screen with hidden tabs.

---

## ✨ Key Highlights

- 🏗️ **Multi-Frontend Decoupled Architecture** — 3 independent React (Vite) frontends, 1 Flask backend
- 💳 **Live Razorpay Payment Integration** — checkout, verification, and invoice delivery in one flow
- 🍳 **Kitchen Display System** — real-time order queue with state transitions and visual alerts
- 📦 **Smart Inventory Deduction** — stock auto-reduces when orders move through kitchen stages
- 🔐 **JWT + Role-Based Access** — scoped tokens ensure the right people see the right things
- 📧 **Automated Email Invoices** — itemized PDF receipts sent via Resend API post-payment
- 🎨 **Premium Coffee Theme** — dark/light modes with micro-animations and mobile-first UX

---

## 🛠️ Features

### 👑 Admin Panel
| Feature | Description |
|:---|:---|
| 📊 Analytics & Reports | Interactive Chart.js graphs — revenue trends, product performance, busy hours |
| 📦 Inventory Management | Full CRUD with In Stock / Low Stock / Out of Stock tracking |
| 👥 Staff Approvals | Central portal to authorize Cashier and Kitchen staff registrations |
| 🎟️ Coupon Engine | Create, modify, delete promotional coupons with percentage discounts and usage caps |
| 🪟 Table Layout Designer | Virtual table map matching physical cafe layout |
| 🎨 Appearance Customizer | Toggle dark/light theme system-wide |

### 💳 Cashier POS Portal
| Feature | Description |
|:---|:---|
| 🪑 Interactive Table Map | Visual grid — empty, dining, and dirty states |
| 🛒 Instant Cart Manager | Quick search + category filter to build orders fast |
| 💳 Razorpay Checkout | Dynamic Razorpay payloads for seamless online payment |
| 📧 Invoice Emails | Resend API delivers itemized PDF receipts to customers |
| 🔄 Safe Cancellation | Restricted cancellation flow preserving audit logs |

### 🍳 Kitchen Display System (KDS)
| Feature | Description |
|:---|:---|
| ⏳ Live Kitchen Queue | Ticket cards sorted by submission time |
| 🚀 Prep Progression | `To Cook` ➡️ `Cooking` ➡️ `Completed` state transitions |
| 🔔 Micro-Animations | Visual cues for urgent tickets requiring immediate attention |
| 📱 Responsive Display | Optimized for wall-mounted monitors, iPads, and tablets |

---

## 🔒 Authentication & Security

| Layer | Implementation |
|:---|:---|
| Token Auth | Stateless JWT with role identifiers (`admin`, `cashier`, `kitchen`) |
| Password Security | Werkzeug `scrypt` double-pass hashing |
| Email Verification | 2-factor OTP flow via Resend on new registrations |
| Endpoint Guards | Custom Flask middleware — `403 Forbidden` on scope mismatch |

---

## 💻 Tech Stack

### Frontend
- **React 18 + Vite** — fast HMR, component architecture
- **React Router v6** — role-specific routing
- **Axios** — JWT auto-attachment via interceptors
- **Chart.js + React-Chartjs-2** — analytics dashboards
- **Custom Vanilla CSS** — pixel-perfect coffee-themed UI

### Backend
- **Python Flask** — Application Factory pattern
- **Flask-SQLAlchemy + Flask-Migrate** — ORM + Alembic migrations
- **Flask-JWT-Extended** — token auth
- **Resend Python SDK** — transactional emails

### Third-Party Services
- 💳 **Razorpay** — payment gateway
- ☁️ **Cloudinary** — menu image hosting
- 📧 **Resend** — email delivery

---

## 📂 Folder Structure

```
Velluto-Cafe-POS/
├── admin/                     # Admin React Frontend (Port 5174)
│   └── src/
│       ├── components/        # Metrics, Modals, Navbars
│       ├── pages/
│       │   ├── admin/         # DashboardPage, ReportsPage
│       │   └── auth/          # Login, Register, OTP
│       └── services/          # API service layers
│
├── cashier/                   # Cashier React Frontend (Port 5173)
│   └── src/
│       ├── components/        # Table layouts, Cart, Billing
│       ├── pages/cashier/     # POSPage, CashierDashboard
│       └── services/          # POS & Payment services
│
├── kitchen/                   # Kitchen Display Frontend (Port 5175)
│   └── src/
│       └── pages/kitchen/     # KitchenDashboardPage (Live Queue)
│
└── backend/                   # Python Flask Backend (Port 5000)
    └── app/
        ├── config/            # CORS, JWT, settings
        ├── controllers/       # Auth, POS, Reports, Kitchen logic
        ├── models/            # SQLAlchemy models (User, Order, Table)
        ├── routes/            # Blueprint routing
        ├── services/          # Razorpay, Cloudinary, Resend adapters
        └── middleware/        # Role guard decorators
```

---

## 🚀 Installation Guide

### Prerequisites
- Node.js v18+ & npm
- Python 3.10+
- PostgreSQL (local or cloud)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/KrishModh/Odoo-x-Parul-University-Hackathon-Final-Round.git
cd Odoo-x-Parul-University-Hackathon-Final-Round
```

---

### Step 2 — Setup Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\Activate.ps1

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Initialize the database:

```bash
flask --app run.py db init
flask --app run.py db migrate -m "initialize schema"
flask --app run.py db upgrade
flask --app run.py seed    # Seeds default admin + demo accounts
```

Start the backend:

```bash
python run.py
# API running at: http://localhost:5000
```

---

### Step 3 — Run Frontend Portals

Open **3 separate terminals**:

```bash
# Terminal 1 — Cashier Portal (Port 5173)
cd cashier && npm install && npm run dev

# Terminal 2 — Admin Dashboard (Port 5174)
cd admin && npm install && npm run dev

# Terminal 3 — Kitchen Display (Port 5175)
cd kitchen && npm install && npm run dev
```

---

## 🔑 Environment Variables

### `backend/.env`

```env
DATABASE_URL=postgresql+psycopg://postgres:yourpassword@localhost:5432/velluto_cafe
JWT_SECRET_KEY=super-secret-jwt-key-for-velluto-cafe
DEFAULT_ADMIN_EMAIL=admin@velluto.com
DEFAULT_ADMIN_PASSWORD=admin123

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

RESEND_API_KEY=re_your_resend_api_key

RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_SECRET=your_razorpay_secret

CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

### `admin/.env`, `cashier/.env`, `kitchen/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 👥 Demo Accounts

After running `flask --app run.py seed`:

| Portal | Port | Email | Password | Access |
|:---|:---|:---|:---|:---|
| **Admin Dashboard** | `5174` | `admin@velluto.com` | `admin123` | Analytics, Inventory, Staff, Coupons |
| **Cashier POS** | `5173` | `cashier@velluto.com` | `cashier123` | Tables, Orders, Checkout, Refunds |
| **Kitchen System** | `5175` | `kitchen@velluto.com` | `kitchen123` | Live Queue, Prep Status, Alerts |

---

## 🔄 Order Flow

```
[Cashier POS]
     │  builds cart & submits order
     ▼
[Kitchen KDS] ──► status: TO_COOK
     │  chef starts cooking
     ▼
   COOKING ──► inventory auto-deducted
     │  chef marks complete
     ▼
    READY ──► cashier notified, serves table
     │  customer pays
     ▼
[Razorpay / Cash Payment]
     │  on success
     ▼
[Invoice Email Sent via Resend]
     │
     ▼
[Admin Dashboard] ──► Chart.js reports update dynamically
```

### Cancellation Rules

| State | Can Cancel? | Notes |
|:---|:---|:---|
| Cart (not submitted) | ✅ Yes | Update or cancel freely |
| Cooking | ⚠️ Restricted | Requires cashier authorization |
| Paid / Served | ❌ No | Must go through refund/void workflow |

---

## 🔌 API Reference

All endpoints prefixed with `/api`.

### Auth — `/api/auth`
```
POST   /api/auth/signup          Register new user
POST   /api/auth/login           Authenticate, receive JWT
POST   /api/auth/verify-otp      Verify OTP during signup
POST   /api/auth/forgot-password Trigger password reset flow
```

### Admin — `/api/admin`
```
GET    /api/admin/products        List all products (Admin only)
POST   /api/admin/products        Add new product (Admin only)
PATCH  /api/admin/products/<id>   Update product details
```

### POS & Orders — `/api/pos`, `/api/orders`
```
GET    /api/pos/tables                    Fetch table map & status
POST   /api/orders                        Place new order
POST   /api/payments/razorpay/create      Generate Razorpay order
POST   /api/payments/razorpay/verify      Verify payment signature
```

---

## 🗺️ Future Roadmap

- [ ] 📱 **PWA Support** — offline resilience for Cashier POS
- [ ] 📲 **QR Code Table Ordering** — customers browse & order from their phones
- [ ] ⚡ **WebSocket Real-time Updates** — replace HTTP polling in KDS and table map
- [ ] 🤖 **AI Demand Forecasting** — predict inventory needs from seasonal sales patterns
- [ ] 📊 **Multi-branch Support** — single admin view across multiple cafe locations

---

## 📄 License

Distributed under the **MIT License**.

```
MIT License

Copyright (c) 2024 Krish Modh, Aakansha Patidar, Sahil Khan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**Built with ☕ and late nights at Odoo × Parul University Hackathon**

*Velluto — Italian for "Velvet". Because great coffee should be smooth.*

</div>