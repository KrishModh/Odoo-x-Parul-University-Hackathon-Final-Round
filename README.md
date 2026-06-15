<div align="center">
  
<img src="https://capsule-render.vercel.app/api?type=waving&color=4E3629&height=200&section=header&text=Velluto%20Cafe%20POS&fontSize=60&fontColor=F5E6D3&fontAlignY=38&desc=☕%20Multi-Portal%20Restaurant%20POS%20Ecosystem&descAlignY=60&descFontColor=D4A574&animation=fadeIn" width="100%"/>

<br/>
  
<p>
  <img src="https://img.shields.io/badge/Odoo%20×%20Parul%20University-Hackathon%20Final%20Round-4E3629?style=for-the-badge&labelColor=D4A574&color=4E3629" />
</p>
  
<p>
  <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=3395FF"/>
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white"/>
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white"/>
</p>
  
<p>
  <img src="https://img.shields.io/badge/Portals-3%20Role--Based-D4A574?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Theme-Coffee%20Premium-4E3629?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Responsive-100%25-success?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge"/>
</p>

<br/>
  
> ### *"Three portals. One backend. Zero chaos."*
> A production-grade SaaS Cafe POS ecosystem — built to eliminate the communication gap between front-of-house, kitchen, and management in real cafe environments.
 
<br/>

</div>

---

<div align="center">

## 👨‍💻 The Team Behind Velluto

</div>

<br/>

<table align="center">
  <tr>
    <td align="center" width="280">
      <a href="https://github.com/KrishModh">
        <img src="https://github-readme-stats.vercel.app/api?username=KrishModh&show_icons=true&theme=dark&bg_color=1a0e08&title_color=D4A574&text_color=F5E6D3&icon_color=D4A574&border_color=4E3629&hide_border=false&card_width=250" width="250"/>
      </a>
      <br/><br/>
      <a href="https://github.com/KrishModh">
        <img src="https://img.shields.io/badge/Krish%20Modh-4E3629?style=for-the-badge&logo=github&logoColor=D4A574"/>
      </a>
      <br/>
      <sub><b>🧑‍💼 Team Leader & Full Stack Dev</b></sub>
      <br/>
      <sub>Architecture · Auth · Integration · DevOps</sub>
    </td>
    <td align="center" width="280">
      <a href="https://github.com/Aakanshapatidar">
        <img src="https://github-readme-stats.vercel.app/api?username=Aakanshapatidar&show_icons=true&theme=dark&bg_color=1a0e08&title_color=D4A574&text_color=F5E6D3&icon_color=D4A574&border_color=4E3629&hide_border=false&card_width=250" width="250"/>
      </a>
      <br/><br/>
      <a href="https://github.com/Aakanshapatidar">
        <img src="https://img.shields.io/badge/Aakansha%20Patidar-4E3629?style=for-the-badge&logo=github&logoColor=D4A574"/>
      </a>
      <br/>
      <sub><b>🎨 Frontend Developer</b></sub>
      <br/>
      <sub>UI/UX · React · Animations · Theming</sub>
    </td>
    <td align="center" width="280">
      <a href="https://github.com/sahilkhan145">
        <img src="https://github-readme-stats.vercel.app/api?username=sahilkhan145&show_icons=true&theme=dark&bg_color=1a0e08&title_color=D4A574&text_color=F5E6D3&icon_color=D4A574&border_color=4E3629&hide_border=false&card_width=250" width="250"/>
      </a>
      <br/><br/>
      <a href="https://github.com/sahilkhan145">
        <img src="https://img.shields.io/badge/Sahil%20Khan-4E3629?style=for-the-badge&logo=github&logoColor=D4A574"/>
      </a>
      <br/>
      <sub><b>⚙️ Backend & Database Engineer</b></sub>
      <br/>
      <sub>Flask API · PostgreSQL · ORM · Migrations</sub>
    </td>
  </tr>
</table>

<br/>

> 🎥 **Demo Video** — [Watch full walkthrough](https://youtu.be/8hALkcVTw6E)

---



<div align="center">

## 📖 Table of Contents

</div>

<div align="center">

[🌟 Overview](#-project-overview) • [✨ Highlights](#-key-highlights) • [🛠️ Features](#️-features) • [🔒 Security](#-authentication--security) • [💻 Tech Stack](#-tech-stack) • [📂 Structure](#-folder-structure) • [🚀 Setup](#-installation-guide) • [🔑 Env Vars](#-environment-variables) • [👥 Demo](#-demo-accounts) • [🔄 Order Flow](#-order-flow) • [🔌 API](#-api-reference) • [🗺️ Roadmap](#️-future-roadmap)

</div>

---

## 🌟 Project Overview

**Velluto Cafe POS** was built to solve a real operational problem — traditional POS systems are single-screen, disconnected, and leave Admins, Cashiers, and Kitchen staff working in complete silos.

We fixed that by distributing operations across **three purpose-built portals**, all powered by one high-performance backend:

```mermaid
graph TD
    A[🖥️ Admin Dashboard<br/>Port 5174] <-->|Analytics · Inventory · Staff Control| API
    B[💳 Cashier POS Portal<br/>Port 5173] <-->|Tables · Orders · Payments| API
    C[🍳 Kitchen Display System<br/>Port 5175] <-->|Live Queue · Prep Status| API
    API[⚡ Flask REST API<br/>Port 5000] <--> D[(🗄️ PostgreSQL Database)]
```

Each portal is **purpose-built** for its user — not a generic screen with hidden tabs.

---

## ✨ Key Highlights

<table>
  <tr>
    <td>🏗️</td>
    <td><b>Multi-Frontend Decoupled Architecture</b></td>
    <td>3 independent React (Vite) frontends — 1 Flask backend</td>
  </tr>
  <tr>
    <td>💳</td>
    <td><b>Live Razorpay Payment Integration</b></td>
    <td>Checkout, signature verification, and invoice in one flow</td>
  </tr>
  <tr>
    <td>🍳</td>
    <td><b>Kitchen Display System</b></td>
    <td>Real-time order queue with state transitions and visual alerts</td>
  </tr>
  <tr>
    <td>📦</td>
    <td><b>Smart Inventory Deduction</b></td>
    <td>Stock auto-reduces as orders progress through kitchen stages</td>
  </tr>
  <tr>
    <td>🔐</td>
    <td><b>JWT + Role-Based Access Control</b></td>
    <td>Scoped tokens — right people see the right portal, always</td>
  </tr>
  <tr>
    <td>📧</td>
    <td><b>Automated Email Invoices</b></td>
    <td>Itemized PDF receipts via Resend API post-payment</td>
  </tr>
  <tr>
    <td>🎨</td>
    <td><b>Premium Coffee Theme Engine</b></td>
    <td>Dark/light modes · micro-animations · mobile-first UX</td>
  </tr>
</table>

---

## 🛠️ Features

### 👑 Admin Panel

| Feature | Description |
|:---|:---|
| 📊 **Analytics & Reports** | Interactive Chart.js graphs — revenue trends, product performance, busy hours, avg order duration |
| 📦 **Inventory Management** | Full CRUD with In Stock / Low Stock / Out of Stock tracking |
| 👥 **Staff Approvals** | Centralized portal to authorize newly registered Cashier and Kitchen staff |
| 🎟️ **Coupon Engine** | Create, edit, delete promo coupons with percentage discounts and usage limits |
| 🪟 **Table Layout Designer** | Map virtual tables matching physical cafe floor plan |
| 🎨 **Appearance Customizer** | Toggle dark/light theme — syncs system-wide across all portals |

### 💳 Cashier POS Portal

| Feature | Description |
|:---|:---|
| 🪑 **Interactive Table Map** | Visual grid — empty, dining, and dirty table states at a glance |
| 🛒 **Instant Cart Manager** | Search, filter by category, add items and modifiers in seconds |
| 💳 **Razorpay Checkout** | Dynamic Razorpay payloads for seamless online payment collection |
| 📧 **Invoice Emails** | Resend API delivers itemized PDF receipts directly to customers |
| 🔄 **Safe Cancellation System** | Restricted cancellation flow preserving financial audit trails |

### 🍳 Kitchen Display System (KDS)

| Feature | Description |
|:---|:---|
| ⏳ **Live Kitchen Queue** | Chronological ticket cards — newest orders never get missed |
| 🚀 **Prep Progression** | `To Cook` ➡️ `Cooking` ➡️ `Completed` with one tap |
| 🔔 **Micro-Animations** | Visual urgency cues for tickets needing immediate attention |
| 📱 **Responsive Grid Display** | Tailored for wall-mounted monitors, iPads, and kitchen tablets |

---

## 🔒 Authentication & Security

| Layer | Implementation |
|:---|:---|
| 🔑 **Token Auth** | Stateless JWT with role identifiers — `admin` · `cashier` · `kitchen` |
| 🛡️ **Password Security** | Werkzeug `scrypt` double-pass hashing — industry standard |
| 📧 **Email Verification** | 2-factor OTP flow via Resend on all new registrations |
| 🔒 **Endpoint Guards** | Custom Flask decorators — `403 Forbidden` on any scope mismatch |

---

## 💻 Tech Stack

<table>
  <tr>
    <th>Layer</th>
    <th>Technology</th>
    <th>Purpose</th>
  </tr>
  <tr>
    <td rowspan="5"><b>⚛️ Frontend</b></td>
    <td>React 18 + Vite</td>
    <td>Fast HMR, component-driven UI</td>
  </tr>
  <tr>
    <td>React Router v6</td>
    <td>Role-specific portal routing</td>
  </tr>
  <tr>
    <td>Axios + Interceptors</td>
    <td>JWT auto-attachment on every request</td>
  </tr>
  <tr>
    <td>Chart.js + React-Chartjs-2</td>
    <td>Admin analytics dashboards</td>
  </tr>
  <tr>
    <td>Custom Vanilla CSS</td>
    <td>Pixel-perfect coffee-themed UI</td>
  </tr>
  <tr>
    <td rowspan="4"><b>🐍 Backend</b></td>
    <td>Python Flask</td>
    <td>Application Factory REST API</td>
  </tr>
  <tr>
    <td>Flask-SQLAlchemy + Migrate</td>
    <td>ORM + Alembic schema migrations</td>
  </tr>
  <tr>
    <td>Flask-JWT-Extended</td>
    <td>Stateless token authentication</td>
  </tr>
  <tr>
    <td>Resend Python SDK</td>
    <td>Transactional email delivery</td>
  </tr>
  <tr>
    <td rowspan="3"><b>☁️ Services</b></td>
    <td>Razorpay</td>
    <td>Payment gateway & checkout</td>
  </tr>
  <tr>
    <td>Cloudinary</td>
    <td>Menu product image hosting</td>
  </tr>
  <tr>
    <td>Resend</td>
    <td>Invoice & OTP email delivery</td>
  </tr>
</table>

---

## 📂 Folder Structure

```
Velluto-Cafe-POS/
│
├── 🖥️  admin/                     # Admin React Frontend  →  Port 5174
│   └── src/
│       ├── components/             # Metrics cards, Modals, Navbars
│       ├── pages/
│       │   ├── admin/              # DashboardPage, ReportsPage
│       │   └── auth/               # Login, Register, OTP screens
│       └── services/               # API service layers
│
├── 💳  cashier/                    # Cashier React Frontend  →  Port 5173
│   └── src/
│       ├── components/             # Table map, Cart, Billing forms
│       ├── pages/cashier/          # POSPage, CashierDashboard
│       └── services/               # POS & Payment services
│
├── 🍳  kitchen/                    # Kitchen Display Frontend  →  Port 5175
│   └── src/
│       └── pages/kitchen/          # KitchenDashboardPage (Live Queue)
│
└── ⚡  backend/                    # Python Flask Backend  →  Port 5000
    └── app/
        ├── config/                 # CORS, JWT, environment settings
        ├── controllers/            # Auth, POS, Reports, Kitchen logic
        ├── models/                 # SQLAlchemy models — User, Order, Table
        ├── routes/                 # Blueprint routing rules
        ├── services/               # Razorpay, Cloudinary, Resend adapters
        └── middleware/             # Role guard decorators
```

---

## 🚀 Installation Guide

### Prerequisites

```
✅ Node.js v18+  &  npm
✅ Python 3.10+
✅ PostgreSQL (local or cloud instance)
```

### Step 1 — Clone the Repository

```bash
git clone https://github.com/KrishModh/Odoo-x-Parul-University-Hackathon-Final-Round.git
cd Odoo-x-Parul-University-Hackathon-Final-Round
```

### Step 2 — Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\Activate.ps1

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

**Initialize & seed the database:**

```bash
flask --app run.py db init
flask --app run.py db migrate -m "initialize schema"
flask --app run.py db upgrade
flask --app run.py seed        # Creates default admin + demo accounts
```

**Start the API:**

```bash
python run.py
# ✅ Backend running at: http://localhost:5000
```

### Step 3 — Frontend Portals

Open **3 separate terminals** and run:

```bash
# 💳 Terminal 1 — Cashier Portal
cd cashier && npm install && npm run dev
# → http://localhost:5173

# 🖥️ Terminal 2 — Admin Dashboard
cd admin && npm install && npm run dev
# → http://localhost:5174

# 🍳 Terminal 3 — Kitchen Display
cd kitchen && npm install && npm run dev
# → http://localhost:5175
```

---

## 🔑 Environment Variables

### `backend/.env`

```env
# Database
DATABASE_URL=postgresql+psycopg://postgres:yourpassword@localhost:5432/velluto_cafe

# Auth
JWT_SECRET_KEY=super-secret-jwt-key-for-velluto-cafe
DEFAULT_ADMIN_EMAIL=admin@velluto.com
DEFAULT_ADMIN_PASSWORD=admin123

# Cloudinary (Menu Images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (OTP + Invoices)
RESEND_API_KEY=re_your_resend_api_key

# Payments
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_SECRET=your_razorpay_secret

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

### `admin/.env` · `cashier/.env` · `kitchen/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 👥 Demo Accounts

> Run `flask --app run.py seed` first to generate these accounts.

| Portal | Port | Email | Password | Access Scope |
|:---|:---:|:---|:---|:---|
| 🖥️ **Admin Dashboard** | `5174` | `admin@velluto.com` | `admin123` | Analytics · Inventory · Staff · Coupons |
| 💳 **Cashier POS** | `5173` | `cashier@velluto.com` | `cashier123` | Tables · Orders · Checkout · Refunds |
| 🍳 **Kitchen System** | `5175` | `kitchen@velluto.com` | `kitchen123` | Live Queue · Prep Status · Alerts |

---

## 🔄 Order Flow

```
  ╔══════════════════╗
  ║   💳 CASHIER POS  ║  ← Selects table, builds cart, submits order
  ╚════════╤═════════╝
           │
           ▼
  ╔══════════════════╗
  ║  🍳 KITCHEN KDS  ║  ← Order appears as  [TO COOK]
  ╚════════╤═════════╝
           │  Chef starts cooking
           ▼
       [COOKING]  ───── 📦 Inventory auto-deducted
           │  Chef marks complete
           ▼
        [READY]   ───── 🔔 Cashier notified
           │  Customer pays
           ▼
  ╔══════════════════════════╗
  ║  💳 Razorpay / Cash Pay  ║
  ╚════════╤═════════════════╝
           │  On success
           ▼
  📧 Invoice Email → Customer (via Resend)
           │
           ▼
  ╔══════════════════════╗
  ║  🖥️ ADMIN DASHBOARD  ║  ← Reports & analytics update dynamically
  ╚══════════════════════╝
```

### Cancellation Policy

| Order State | Cancellable? | Rule |
|:---|:---:|:---|
| 🛒 Cart (not submitted) | ✅ **Yes** | Update or cancel freely |
| 🍳 Cooking | ⚠️ **Restricted** | Requires cashier authorization |
| ✅ Paid / Served | ❌ **No** | Must go through refund/void workflow to preserve audit integrity |

---

## 📸 Screenshots

<table>
  <tr>
    <td align="center" width="50%">
      <!-- <img src="https://via.placeholder.com/700x400/1a0e08/D4A574?text=🖥️+Admin+Dashboard" width="100%" style="border-radius:8px"/> -->
      <img width="2560" height="1440" alt="Screenshot (1740)" src="https://github.com/user-attachments/assets/2ff36f6b-49bc-43a2-a54d-c454ad57e219" />
      <br/><br/>
      <b>🖥️ Admin Dashboard</b>
      <br/>
      <sub>Analytics, Inventory & Staff Management</sub>
    </td>
    <td align="center" width="50%">
      <!-- <img src="https://via.placeholder.com/700x400/1a0e08/D4A574?text=💳+Cashier+POS+Portal" width="100%" style="border-radius:8px"/> -->
      <img width="2560" height="1440" alt="Screenshot (1739)" src="https://github.com/user-attachments/assets/d28218da-15f8-4d95-8ba8-9830838c506b" />
      <br/><br/>
      <b>💳 Cashier POS Portal</b>
      <br/>
      <sub>Table Map, Cart & Razorpay Checkout</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <!-- <img src="https://via.placeholder.com/700x400/1a0e08/D4A574?text=🍳+Kitchen+Display+System" width="100%" style="border-radius:8px"/> -->
      <img width="2560" height="1440" alt="Screenshot (1742)" src="https://github.com/user-attachments/assets/6420cc0c-3819-481f-9985-2f49a74a20de" />
      <br/><br/>
      <b>🍳 Kitchen Display System</b>
      <br/>
      <sub>Live Order Queue & Prep Status</sub>
    </td>
    <td align="center" width="50%">
      <!-- <img src="https://via.placeholder.com/700x400/1a0e08/D4A574?text=📊+Reports+%26+Analytics" width="100%" style="border-radius:8px"/> -->
      <img width="2560" height="1440" alt="Screenshot (1741)" src="https://github.com/user-attachments/assets/730978fe-9ebd-4b20-9943-a716480e9356" />
      <br/><br/>
      <b>📊 Reports & Analytics</b>
      <br/>
      <sub>Revenue Trends & Product Performance</sub>
    </td>
  </tr>
</table>


---

## 🔌 API Reference

> All endpoints prefixed with `/api` · JWT required on protected routes

### 🔐 Auth — `/api/auth`

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/auth/signup` | Register a new user profile |
| `POST` | `/api/auth/login` | Authenticate & receive JWT access token |
| `POST` | `/api/auth/verify-otp` | Verify OTP during registration |
| `POST` | `/api/auth/forgot-password` | Trigger password reset flow |

### 📦 Products — `/api/admin`

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/api/admin/products` | Fetch all products *(Admin only)* |
| `POST` | `/api/admin/products` | Add new product *(Admin only)* |
| `PATCH` | `/api/admin/products/<id>` | Update existing product details |

### 📝 Orders & Tables — `/api/pos` · `/api/orders`

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/api/pos/tables` | Fetch table map with seating status |
| `POST` | `/api/orders` | Place a new order with line items |
| `POST` | `/api/payments/razorpay/create` | Generate a new Razorpay order/invoice |
| `POST` | `/api/payments/razorpay/verify` | Verify payment signature on success |

---

## 🗺️ Future Roadmap

- [ ] 📱 **PWA Support** — offline resilience for the Cashier POS
- [ ] 📲 **QR Code Table Ordering** — customers browse & order from personal devices
- [ ] ⚡ **WebSocket Real-time** — replace HTTP polling in KDS and table map
- [ ] 🤖 **AI Demand Forecasting** — predict stock needs from seasonal sales patterns
- [ ] 📊 **Multi-branch Support** — unified admin view across multiple cafe locations

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=4E3629&height=120&section=footer&text=Built%20with%20☕%20at%20Odoo%20×%20Parul%20University%20Hackathon&fontSize=18&fontColor=D4A574&fontAlignY=65&animation=fadeIn" width="100%"/>

*Velluto — Italian for "Velvet". Because great software, like great coffee, should be smooth.*

</div>
