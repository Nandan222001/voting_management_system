# Digital Voting System

**Secure • Transparent • Reliable**

A full-stack digital voting platform with Admin Web Panel, REST API, and Mobile App placeholder.

## Architecture

```
voting_management_system/
├── backend/        # Python FastAPI + SQLAlchemy + MySQL
├── frontend/       # React + Vite + TailwindCSS + Redux Toolkit (Admin Panel)
└── mobile/         # React Native (Placeholder)
```

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Backend  | Python 3.11, FastAPI, SQLAlchemy 2, Alembic, MySQL |
| Frontend | React 18, Vite, Tailwind CSS, Redux Toolkit     |
| Mobile   | React Native + Expo (planned)                   |
| Auth     | JWT (access + refresh tokens), bcrypt           |
| DB       | MySQL 8+ with Alembic migrations                |

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL 8+

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: source venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env          # Edit with your DB credentials
alembic upgrade head          # Run all migrations (creates tables + seeds admin)
python main.py                # Start API server on :8000
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local    # Edit if needed
npm run dev                   # Start dev server on :5173
```

### Mobile App Setup
Web
<!-- cd mobile -->
<!-- npm run web -->

<!-- Emulator -->
<!-- npm start -->
<!-- npm run android  -->

### Default Admin Credentials
- **Email:** admin@voting.com
- **Password:** Admin@123

## API Documentation

Once backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Core Modules

| Module              | Description                                     |
|---------------------|-------------------------------------------------|
| User Management     | Register, OTP verify, approve/block voters      |
| Election Management | Create, schedule, activate, close elections     |
| Candidate Management| Add candidates with party/symbol to elections   |
| Voting Engine       | One user = one vote, tamper-proof               |
| Results & Reports   | Real-time stats, charts, PDF export             |
| Audit Logs & Security | Full audit trail of all actions              |

## SOLID Principles Applied

- **S** — Each class/module has a single responsibility (Repository, Service, Controller layers separate)
- **O** — BaseRepository is open for extension, closed for modification
- **L** — All repositories extend BaseRepository without breaking its contract
- **I** — Separate schemas for request/response; no fat interfaces
- **D** — Controllers depend on Service abstractions; Services depend on Repository abstractions

## MVC Architecture

```
Request → Controller (Router) → Service (Business Logic) → Repository (DB) → Model
                              ← Schema (Pydantic)        ←                ←
```
