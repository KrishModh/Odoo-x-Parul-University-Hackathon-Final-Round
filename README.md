# Velluto Cafe POS

A production-style multi-frontend architecture for a modern cafe point-of-sale system. The ecosystem consists of three distinct React applications powered by a single Flask backend.

## Stack

- **Frontends:** React 18, Vite, React Router, Axios, Lucide icons, and modular CSS
- **Backend:** Flask app factory with Blueprints
- **Database:** PostgreSQL with SQLAlchemy and Flask-Migrate
- **Auth:** JWT authentication with role claims
- **Services:** Cloudinary, Resend, and Razorpay adapters

## Architecture

```text
root/
│
├── cashier/            # Cashier POS App (Port 5173)
├── admin/              # Admin Dashboard App (Port 5174)
├── kitchen/            # Kitchen Display System (Port 5175)
└── backend/            # Flask Backend API (Port 5000)
```

## Local Setup

### 1. Environment Configuration

Copy the `.env.example` templates in each directory to create your local `.env` files.

- `backend/.env` (Contains DB connection, JWT secret, Cloudinary keys, etc.)
- `cashier/.env`
- `admin/.env`
- `kitchen/.env`

Ensure the backend `.env` contains valid keys for `DATABASE_URL` and `JWT_SECRET_KEY` to start.

### 2. PostgreSQL Setup

Create a database named `velluto_pos` locally or update the `DATABASE_URL` in `backend/.env` to point to your existing PostgreSQL database.

### 3. Run Backend API

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
flask --app run.py db init
flask --app run.py db migrate -m "init database"
flask --app run.py db upgrade
python run.py
```
*Backend runs on http://127.0.0.1:5000*

*(Note: Skip `db init` if the migrations directory already exists.)*

### 4. Run Cashier App

```powershell
cd cashier
npm install
npm run dev
```
*Cashier UI runs on http://localhost:5173*

### 5. Run Admin App

```powershell
cd admin
npm install
npm run dev
```
*Admin UI runs on http://localhost:5174*

### 6. Run Kitchen App

```powershell
cd kitchen
npm install
npm run dev
```
*Kitchen UI runs on http://localhost:5175*

## Security Notes

- Passwords are hashed with Werkzeug's scrypt implementation.
- JWT role claims are verified by the respective route middleware.
- Secrets and service URLs are securely managed via environment variables.
- CORS is strictly configured to accept requests only from the specified frontend URLs.
- Axios instances automatically manage and intercept JWTs across all three frontends.
