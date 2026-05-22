# Software Requirements Specification (SRS)

## Digital Voting System — Multi-Tenant SaaS Platform

| Field | Value |
|---|---|
| **Document Version** | 2.0.0 |
| **Date** | 2026-05-22 |
| **Status** | Approved |
| **Project** | voting_management_system |
| **Repository Branch** | `claude/admin-panel-mvc-setup-YHJmi` |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [Stakeholders & User Classes](#3-stakeholders--user-classes)
4. [System Architecture](#4-system-architecture)
5. [Functional Requirements](#5-functional-requirements)
   - 5.1 Authentication & Onboarding
   - 5.2 Multi-Tenant Management (SuperAdmin)
   - 5.3 Election Management
   - 5.4 Candidate Management
   - 5.5 Voting Engine
   - 5.6 Live Results & Analytics
   - 5.7 User Administration
   - 5.8 Audit Logs & Security
   - 5.9 Reports & Data Export
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Database Design](#7-database-design)
8. [API Specification](#8-api-specification)
9. [Security Requirements](#9-security-requirements)
10. [Tenant Isolation Model](#10-tenant-isolation-model)
11. [Technology Stack](#11-technology-stack)
12. [Constraints & Assumptions](#12-constraints--assumptions)
13. [Glossary](#13-glossary)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document defines the complete functional and non-functional requirements for the **Digital Voting System**, a secure, transparent, and reliable multi-tenant SaaS platform for conducting digital elections.

The system enables a platform provider (TechElect Solutions) to licence the voting infrastructure to multiple independent organizations — political parties, corporate boards, student unions, NGOs — each operating in complete data isolation from one another.

### 1.2 Scope

The system provides:

- A **REST API** (FastAPI / Python) serving all business logic
- An **Admin Web Panel** (React) for election administrators and the platform superadmin
- A **Mobile Application** (React Native — planned v2.0) for voters
- A **MySQL relational database** with versioned Alembic migrations
- **Multi-tenant row-level isolation** ensuring zero data leakage between organizations

### 1.3 Definitions

| Term | Definition |
|---|---|
| **Tenant** | An organization (e.g. a political party) that subscribes to the platform |
| **SuperAdmin** | The platform owner who manages tenants. Has global access. |
| **Admin** | A tenant-level user who manages elections, candidates, and voters within their organization |
| **Voter** | A registered, OTP-verified, admin-approved end-user who casts votes |
| **Election** | A voting event with a defined set of candidates and a lifecycle (draft → active → closed) |
| **Candidate** | A person registered to receive votes in a specific election |
| **OTP** | One-Time Password — a 6-digit code used for identity verification |
| **JWT** | JSON Web Token — used for stateless authentication |
| **Tenant Isolation** | The guarantee that one tenant's data is never visible to another tenant |

### 1.4 Overview

The remainder of this document is organized as follows: Section 2 describes the product from a high level. Section 3 identifies all stakeholders. Section 4 covers the system architecture. Sections 5 through 9 specify detailed requirements. Sections 10 through 13 cover cross-cutting concerns.

---

## 2. Overall Description

### 2.1 Product Perspective

The Digital Voting System is a standalone SaaS application delivered over the internet. It replaces paper-based or spreadsheet-managed voting processes with a tamper-proof, auditable, real-time digital alternative.

```
┌─────────────────────────────────────────────────────────┐
│                  TechElect Platform                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │              SuperAdmin Portal                  │    │
│  │   Manages tenants, monitors platform health     │    │
│  └───────────────────┬─────────────────────────────┘    │
│                      │ provisions                        │
│         ┌────────────┼────────────┬────────────┐         │
│         ▼            ▼            ▼            ▼         │
│    ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│    │Tenant A │  │Tenant B │  │Tenant C │  │Tenant N │  │
│    │ (BJP)   │  │Congress │  │ Union   │  │  ...    │  │
│    └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  │
│         │            │            │             │        │
│    Admin Panel  Admin Panel  Admin Panel   Admin Panel   │
│    Mobile App   Mobile App   Mobile App   Mobile App    │
└─────────────────────────────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │   FastAPI REST API  │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │   MySQL Database    │
              │  (Row-level tenant  │
              │    isolation)       │
              └─────────────────────┘
```

### 2.2 Product Functions (Summary)

1. **Tenant Provisioning** — SuperAdmin creates organizations; each gets an isolated environment
2. **Voter Registration & OTP Verification** — Citizens register and verify identity
3. **Admin Approval** — Tenant admins review and approve voter registrations
4. **Election Lifecycle** — Draft → Activate → Close with candidate management
5. **One-Vote-One-Person Engine** — Atomic, tamper-proof vote recording
6. **Real-Time Results** — Live charts and analytics during and after voting
7. **Audit Trail** — Immutable logs of every system action
8. **Reports & Exports** — PDF/CSV/Excel exports for official records

### 2.3 Operating Environment

- **Server**: Linux (Ubuntu 20.04+), Python 3.11+, MySQL 8.0+
- **Client (Web)**: Modern browsers — Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Client (Mobile)**: Android 8+, iOS 13+ (v2.0)
- **Deployment**: Docker-compatible; deployable to AWS, GCP, Azure, or on-premise

---

## 3. Stakeholders & User Classes

### 3.1 SuperAdmin (Platform Owner)

**Who:** TechElect Solutions employee — the platform operator.

**Responsibilities:**
- Create, configure, suspend, and delete tenant organizations
- Monitor platform-wide usage (total tenants, elections, votes)
- Enforce plan limits (election quotas, voter quotas)
- Inspect any tenant's data for support purposes
- Manage the platform branding and global settings

**Access:** Global — unrestricted across all tenants. Cannot cast votes.

---

### 3.2 Tenant Admin (Organization Administrator)

**Who:** The IT officer or election commissioner of a subscribing organization.

**Responsibilities:**
- Create and manage elections within their organization
- Add, edit, and remove candidates from elections
- Review and approve/reject voter registrations
- Block or suspend fraudulent voter accounts
- View results and download reports
- Monitor the audit log

**Access:** Scoped strictly to their own tenant. Cannot access other tenants' data.

---

### 3.3 Voter (End User)

**Who:** A citizen, member, or employee eligible to vote in their organization's elections.

**Responsibilities:**
- Register with email/phone and complete OTP verification
- Await admin approval before voting
- View active elections and candidate profiles
- Cast exactly one vote per election
- View results after or during elections (as permitted)

**Access:** Own profile and own-tenant elections only. Cannot see other voters' choices.

---

### 3.4 External Observers (Future)

- **Journalists / Public:** View published results via a public URL (no authentication)
- **Election Auditors:** Review audit logs and integrity checks

---

## 4. System Architecture

### 4.1 Architectural Pattern

The system follows **MVC (Model-View-Controller)** architecture with a **Repository-Service-Controller** layering:

```
HTTP Request
    │
    ▼
┌──────────────────┐
│   Controller     │  FastAPI APIRouter — HTTP boundary, request/response shaping
│  (routes layer)  │
└────────┬─────────┘
         │ calls
         ▼
┌──────────────────┐
│    Service       │  Business logic, validation, orchestration, SOLID principles
│  (domain layer)  │
└────────┬─────────┘
         │ calls
         ▼
┌──────────────────┐
│   Repository     │  Data access abstraction — tenant-scoped SQLAlchemy queries
│  (data layer)    │
└────────┬─────────┘
         │ queries
         ▼
┌──────────────────┐
│     Model        │  SQLAlchemy ORM models — table definitions
│  (schema layer)  │
└────────┬─────────┘
         │
         ▼
     MySQL DB
```

### 4.2 SOLID Principles Applied

| Principle | Implementation |
|---|---|
| **S** — Single Responsibility | Each class owns one concern: models define schema, repositories query data, services orchestrate logic, controllers handle HTTP |
| **O** — Open/Closed | `BaseRepository[T]` is extended by concrete repos without modification; new tenant methods added without changing existing ones |
| **L** — Liskov Substitution | All repositories honour the `BaseRepository` contract; substituting one for another doesn't break callers |
| **I** — Interface Segregation | Separate Pydantic schemas for create/update/response; no "fat" DTOs |
| **D** — Dependency Inversion | Controllers depend on Service abstractions; Services depend on Repository abstractions; never on concrete SQLAlchemy queries |

### 4.3 Directory Structure

```
voting_management_system/
├── backend/                    # Python FastAPI API server
│   ├── app/
│   │   ├── config/             # Settings (pydantic-settings), DB engine/session
│   │   ├── controllers/        # FastAPI APIRouters (HTTP layer)
│   │   ├── middlewares/        # Auth dependencies, audit middleware
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── repositories/       # Data access layer (BaseRepository + concrete)
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic layer
│   │   └── utils/              # Security (JWT/bcrypt), response helpers
│   ├── migrations/             # Alembic versioned migrations
│   │   └── versions/           # 001 → 006 migration files
│   ├── requirements.txt
│   ├── .env.example
│   └── main.py                 # Uvicorn entry point
│
├── frontend/                   # React Admin Panel (Vite + Tailwind + Redux)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/         # DataTable, Modal, Badge, Pagination…
│   │   │   └── layout/         # Sidebar, Header, MainLayout
│   │   ├── hooks/              # useAuth, useElections custom hooks
│   │   ├── pages/              # Full-page components (one per route)
│   │   ├── services/           # Axios API service modules
│   │   ├── store/              # Redux Toolkit store + slices
│   │   └── utils/              # Constants, helpers
│   └── package.json
│
└── mobile/                     # React Native voter app (planned v2.0)
```

---

## 5. Functional Requirements

### 5.1 Authentication & Onboarding

#### FR-AUTH-01: Voter Self-Registration
- The system SHALL accept voter registration with: full_name (required), email (required, unique), phone (optional), password (required, min 8 chars, must contain 1 number and 1 special character)
- The system SHALL reject duplicate email addresses with HTTP 409
- New accounts SHALL be created with `status = pending` and `is_verified = false`
- A 6-digit OTP SHALL be generated and stored (bcrypt-hashed) with a 10-minute TTL

#### FR-AUTH-02: OTP Verification
- The system SHALL provide `POST /api/v1/auth/verify-otp` accepting email and otp_code
- On success: `is_verified = true`, OTP fields cleared
- On failure: HTTP 400 with descriptive message (invalid code / expired)
- Expired OTPs SHALL return HTTP 400 with message "OTP has expired. Please request a new one."

#### FR-AUTH-03: JWT Login
- `POST /api/v1/auth/login` SHALL accept email + password (OAuth2 form)
- On success: return `{ access_token, refresh_token, token_type, user }`
- The JWT payload SHALL contain: `{ sub: user_id, role, tenant_id, type, exp }`
- Access token TTL: 30 minutes. Refresh token TTL: 7 days
- Blocked accounts SHALL return HTTP 401
- Pending (unapproved) accounts SHALL return HTTP 403
- Users of suspended tenants SHALL return HTTP 403

#### FR-AUTH-04: Token Refresh
- `POST /api/v1/auth/refresh-token` SHALL accept a valid refresh token
- Shall return a new access token with updated expiry
- Invalid or expired refresh tokens SHALL return HTTP 401

#### FR-AUTH-05: Current User Profile
- `GET /api/v1/auth/me` (authenticated) SHALL return the current user's profile including `tenant_id` and `role`

---

### 5.2 Multi-Tenant Management (SuperAdmin)

#### FR-TENANT-01: Create Tenant
- SuperAdmin SHALL be able to create a tenant via `POST /api/v1/tenants/`
- Required fields: `name`, `contact_email`, `admin_email`, `admin_password`, `admin_full_name`
- Optional fields: `slug` (auto-generated from name if omitted), `plan`, `logo_url`, `primary_color`
- Creation SHALL atomically create the tenant record AND the first admin user in a single transaction
- The slug SHALL be unique, URL-safe, and max 100 characters

#### FR-TENANT-02: Plan-Based Limits
| Plan | Max Elections | Max Voters |
|---|---|---|
| starter | 5 | 1,000 |
| professional | 25 | 10,000 |
| enterprise | 999,999 | 99,999,999 |

- Exceeding election limit SHALL return HTTP 402 with upgrade message
- Exceeding voter limit SHALL return HTTP 402 with upgrade message
- SuperAdmin MAY override limits by editing the tenant record

#### FR-TENANT-03: Tenant Lifecycle
- Status transitions: `trial → active → suspended → cancelled`
- `POST /api/v1/tenants/{id}/suspend` — blocks all tenant user logins immediately, reason required
- `POST /api/v1/tenants/{id}/activate` — restores all access
- `DELETE /api/v1/tenants/{id}` — soft delete (status = `cancelled`); data preserved

#### FR-TENANT-04: Cross-Tenant Inspection
- SuperAdmin SHALL be able to view any tenant's elections via `GET /api/v1/tenants/{id}/elections`
- SuperAdmin SHALL be able to view any tenant's users via `GET /api/v1/tenants/{id}/users`
- SuperAdmin cross-tenant actions SHALL be logged in the audit trail

#### FR-TENANT-05: Platform Statistics
- `GET /api/v1/tenants/platform-stats` SHALL return: total_tenants, active_tenants, trial_tenants, suspended_tenants, total_users, total_elections, total_votes

---

### 5.3 Election Management

#### FR-ELEC-01: Create Election
- Authenticated admins SHALL create elections via `POST /api/v1/elections/`
- Required: `title`, `start_date`, `end_date`
- `end_date` must be after `start_date` (validated server-side)
- New elections start in `draft` status
- `created_by` (admin user ID) and `tenant_id` SHALL be set automatically

#### FR-ELEC-02: Election Lifecycle State Machine
```
draft ──activate──► active ──close──► closed
  │                    │
  └──cancel──► cancelled (terminal)
```
- Activation SHALL be rejected if candidate count < 2 (HTTP 400)
- All state transitions SHALL be recorded in `audit_logs`
- No transitions from terminal states (`closed`, `cancelled`)

#### FR-ELEC-03: Election CRUD
- `GET /api/v1/elections/` — list elections (filterable by status)
- `GET /api/v1/elections/{id}` — get single election
- `PUT /api/v1/elections/{id}` — update (draft only)
- `DELETE /api/v1/elections/{id}` — soft delete (draft only)
- `POST /api/v1/elections/{id}/activate` — go live
- `POST /api/v1/elections/{id}/close` — end voting

#### FR-ELEC-04: Tenant Scoping
- All election queries SHALL be automatically filtered to the requesting user's `tenant_id`
- A tenant admin SHALL NOT be able to see or modify elections belonging to another tenant

---

### 5.4 Candidate Management

#### FR-CAND-01: Add Candidate
- Admin SHALL add candidates via `POST /api/v1/candidates/`
- Required: `election_id`, `full_name`; Optional: `party`, `symbol`, `bio`, `image_url`
- Candidates SHALL only be added to elections in `draft` status
- `vote_count` SHALL default to 0 and is managed by the system (not settable by API)

#### FR-CAND-02: Edit / Remove Candidate
- Update and delete SHALL only be allowed when election is in `draft` status
- Removing the 2nd-to-last candidate from a draft election SHALL be permitted (but activation will then be blocked)

#### FR-CAND-03: Candidate Display for Voters
- `GET /api/v1/candidates/election/{election_id}` — returns candidate list
- `vote_count` SHALL be visible in results but NOT in the active-election voter view (prevents bandwagon effect — returned as 0 during active elections)

#### FR-CAND-04: Election Results
- `GET /api/v1/candidates/results/{election_id}` — returns candidates ranked by vote_count desc

---

### 5.5 Voting Engine

#### FR-VOTE-01: Cast Vote
- `POST /api/v1/votes/cast` — accepts `{ election_id, candidate_id }`
- The voter MUST be: authenticated, `is_verified = true`, `status = active`
- The election MUST be in `active` status
- The candidate MUST belong to the specified election AND the same `tenant_id`
- Vote record SHALL include: `user_id`, `election_id`, `candidate_id`, `voted_at`, `ip_address`, `tenant_id`
- `candidates.vote_count` SHALL be incremented atomically in the same DB transaction as the vote insert

#### FR-VOTE-02: One Vote Per Election (Critical)
- A `UNIQUE(user_id, election_id)` constraint SHALL be enforced at the database level (NOT application-level only)
- Duplicate vote attempt SHALL return HTTP 409 with message "You have already cast your vote in this election"
- Duplicate attempt SHALL be logged in `audit_logs` as `DUPLICATE_VOTE_ATTEMPT`

#### FR-VOTE-03: Vote Immutability
- Votes SHALL never be updated or deleted via any API endpoint
- The DB user for the application SHALL have no `UPDATE` or `DELETE` permission on the `votes` table (production hardening)

#### FR-VOTE-04: Vote Status Check
- `GET /api/v1/votes/my-vote/{election_id}` — returns `{ has_voted: bool, voted_at: timestamp }`
- The candidate the voter chose SHALL NOT be exposed via any API response

#### FR-VOTE-05: Vote Validation Guards (ordered)
1. Election exists → HTTP 404 if not
2. Election is active → HTTP 400 if not
3. Candidate belongs to election and same tenant → HTTP 400 if mismatch
4. Voter is verified and active → HTTP 403 if not
5. No prior vote in this election → HTTP 409 if duplicate

---

### 5.6 Live Results & Analytics

#### FR-RESULT-01: Election Results
- `GET /api/v1/votes/results/{election_id}` — returns:
  ```json
  {
    "election_id": 1,
    "election_title": "...",
    "total_votes": 1240,
    "results": [
      { "candidate_id": 3, "candidate_name": "...", "party": "...",
        "vote_count": 720, "percentage": 58.1 }
    ]
  }
  ```
- Percentage = (candidate_votes / total_votes) × 100, rounded to 1 decimal
- If total_votes = 0, all percentages = 0.0 (no division by zero)
- Accessible without authentication (public endpoint)
- Authenticated non-superadmin users are auto-scoped to their tenant

#### FR-RESULT-02: Live Stats
- `GET /api/v1/votes/live/{election_id}` — same structure as results, available during active elections
- Admin panel SHALL auto-refresh live stats every 30 seconds

#### FR-RESULT-03: Dashboard Overview
- `GET /api/v1/reports/dashboard` — returns: total_users, total_elections, total_votes, active_elections (tenant-scoped)

---

### 5.7 User Administration

#### FR-USER-01: List Users
- `GET /api/v1/users/` — paginated, filterable by role and status
- SHALL only return users within the admin's tenant
- SuperAdmin sees all users across all tenants

#### FR-USER-02: Approve Voter
- `POST /api/v1/users/{id}/approve` — transitions `pending → active`
- Returns HTTP 400 if user is not in `pending` status
- Logs action in audit trail

#### FR-USER-03: Block / Unblock Voter
- `POST /api/v1/users/{id}/block` — transitions `active → blocked`
- Blocked users are denied login immediately (all subsequent requests return HTTP 401)
- Admin accounts SHALL NOT be blockable by other tenant admins

#### FR-USER-04: User Statistics
- `GET /api/v1/users/stats/overview` — returns: total_users, total_voters, total_admins, pending_users, active_users, blocked_users (tenant-scoped)

---

### 5.8 Audit Logs & Security

#### FR-AUDIT-01: Automatic Event Logging
The following events SHALL be automatically logged to `audit_logs`:

| Event | action value |
|---|---|
| User login | `user_login` |
| User registration | `user_register` |
| OTP verified | `otp_verified` |
| Vote cast | `vote_cast` |
| Duplicate vote attempt | `DUPLICATE_VOTE_ATTEMPT` |
| Election created | `election_created` |
| Election activated | `election_activated` |
| Election closed | `election_closed` |
| User approved | `user_approved` |
| User blocked | `user_blocked` |
| Candidate added | `candidate_added` |
| Tenant created | `tenant_created` |
| Tenant suspended | `tenant_suspended` |

#### FR-AUDIT-02: Audit Log Fields
Each entry SHALL contain: `user_id` (nullable), `action`, `entity_type`, `entity_id`, `details` (JSON text), `ip_address`, `created_at`, `tenant_id` (nullable)

#### FR-AUDIT-03: Audit Log Immutability
- The application DB user SHALL have INSERT-only permission on `audit_logs` (no UPDATE, no DELETE)
- No API endpoint SHALL allow modifying or deleting audit log entries

#### FR-AUDIT-04: Audit Log Query
- `GET /api/v1/reports/audit-logs` (admin only) — paginated, filterable by action, date range, user

---

### 5.9 Reports & Data Export

#### FR-REPORT-01: Election Report
- `GET /api/v1/reports/elections/{id}` — detailed report including participation rate, candidate results, and timestamps

#### FR-REPORT-02: PDF Export *(v2.0)*
- `GET /api/v1/reports/elections/{id}/pdf` — professionally formatted PDF
- Includes: election info, candidate rankings, charts, winner banner, timestamp footer

#### FR-REPORT-03: CSV / Excel Export *(v2.0)*
- `GET /api/v1/reports/elections/{id}/csv` — results as UTF-8 CSV
- `GET /api/v1/reports/elections/{id}/excel` — results as .xlsx with formatting
- `GET /api/v1/reports/audit-logs/csv` — audit log export

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Metric | Requirement |
|---|---|
| API response time (p95) | < 300ms for read endpoints |
| Vote cast endpoint latency | < 500ms including DB write |
| Concurrent votes supported | ≥ 500 simultaneous vote submissions without error |
| Dashboard load time | < 1 second with real data |
| Database query performance | All tenant-scoped queries use indexed `tenant_id` column |

### 6.2 Reliability

- System uptime: ≥ 99.5% monthly
- Vote data durability: 100% — no votes may be lost due to partial failures
- All vote transactions use DB-level atomic operations; partial writes roll back completely
- Migrations are versioned and reversible (downgrade() implemented for all)

### 6.3 Security

- All passwords hashed with bcrypt (cost factor ≥ 12)
- JWT tokens signed with HS256; secret rotatable
- All endpoints use HTTPS in production (TLS 1.2+)
- Rate limiting: auth endpoints ≤ 10 req/min per IP (production)
- SQL injection prevented via SQLAlchemy parameterized queries (no raw string interpolation)
- XSS prevented via React's default escaping; no `dangerouslySetInnerHTML`
- CORS restricted to known origins in production (currently `*` in dev)
- No secrets committed to git (`.env` gitignored; `.env.example` provided)

### 6.4 Scalability

- Row-level multi-tenancy allows unlimited tenant growth without schema changes
- Stateless API allows horizontal scaling behind a load balancer
- Database connection pooling via SQLAlchemy

### 6.5 Maintainability

- All DB schema changes managed via numbered Alembic migrations (001–006)
- Repository pattern ensures DB engine is swappable without touching business logic
- API versioned under `/api/v1/` prefix for future versioning
- Swagger UI auto-generated at `/docs`; ReDoc at `/redoc`

### 6.6 Usability

- Admin panel loads within 2 seconds on a standard broadband connection
- All form validation errors displayed inline with descriptive messages
- All destructive actions (delete, suspend, block) require explicit confirmation dialogs
- Color-coded status badges for election status, user status, and action types in audit logs

---

## 7. Database Design

### 7.1 Entity Relationship Overview

```
tenants
  ├── 1:N → users (tenant_id)
  ├── 1:N → elections (tenant_id)
  │           └── 1:N → candidates (election_id, tenant_id)
  │           └── 1:N → votes (election_id, tenant_id)
  └── 1:N → audit_logs (tenant_id)

users
  ├── 1:N → votes (user_id)
  ├── 1:N → elections [created_by]
  └── 1:N → audit_logs (user_id)

votes
  ├── N:1 → users (user_id)
  ├── N:1 → elections (election_id)
  └── N:1 → candidates (candidate_id)
  └── UNIQUE(user_id, election_id)
```

### 7.2 Table Definitions

#### `tenants`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| name | VARCHAR(255) | NOT NULL | Display name |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-safe identifier |
| domain | VARCHAR(255) | NULL | Custom domain |
| logo_url | VARCHAR(500) | NULL | |
| primary_color | VARCHAR(7) | DEFAULT '#4f46e5' | Hex colour |
| status | ENUM | DEFAULT 'trial' | trial/active/suspended/cancelled |
| plan | ENUM | DEFAULT 'starter' | starter/professional/enterprise |
| max_elections | INT | DEFAULT 5 | Plan limit |
| max_voters | INT | DEFAULT 1000 | Plan limit |
| contact_email | VARCHAR(255) | NULL | |
| created_by | INT | FK → users.id SET NULL | SuperAdmin who created it |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

#### `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| tenant_id | INT | FK → tenants.id SET NULL, NULL | NULL = superadmin |
| full_name | VARCHAR(150) | NOT NULL | |
| email | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | |
| phone | VARCHAR(20) | NULL | |
| hashed_password | VARCHAR(255) | NOT NULL | bcrypt |
| role | ENUM | NOT NULL, DEFAULT 'voter' | superadmin/admin/voter |
| status | ENUM | NOT NULL, DEFAULT 'pending' | active/blocked/pending |
| otp_code | VARCHAR(10) | NULL | Bcrypt-hashed OTP |
| otp_expires_at | DATETIME | NULL | |
| is_verified | BOOLEAN | DEFAULT false | |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

#### `elections`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| tenant_id | INT | FK → tenants.id CASCADE, INDEX | |
| title | VARCHAR(255) | NOT NULL | |
| description | TEXT | NULL | |
| start_date | DATETIME | NOT NULL | |
| end_date | DATETIME | NOT NULL | |
| status | ENUM | DEFAULT 'draft' | draft/active/closed/cancelled |
| created_by | INT | FK → users.id SET NULL | |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

#### `candidates`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| tenant_id | INT | FK → tenants.id CASCADE, INDEX | |
| election_id | INT | FK → elections.id CASCADE | |
| full_name | VARCHAR(255) | NOT NULL | |
| party | VARCHAR(255) | NULL | |
| symbol | VARCHAR(10) | NULL | Emoji or abbreviation |
| image_url | VARCHAR(500) | NULL | |
| bio | TEXT | NULL | Max 500 chars (app-enforced) |
| vote_count | INT | DEFAULT 0 | Atomically incremented |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

#### `votes`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| tenant_id | INT | FK → tenants.id CASCADE, INDEX | |
| user_id | INT | FK → users.id | |
| election_id | INT | FK → elections.id | |
| candidate_id | INT | FK → candidates.id | |
| voted_at | DATETIME | NOT NULL | |
| ip_address | VARCHAR(45) | NULL | IPv4 or IPv6 |
| UNIQUE | | (user_id, election_id) | One vote per election |

#### `audit_logs`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| tenant_id | INT | FK → tenants.id SET NULL, NULL | |
| user_id | INT | FK → users.id, NULL | NULL = system action |
| action | VARCHAR(100) | NOT NULL | e.g. `vote_cast` |
| entity_type | VARCHAR(50) | NULL | e.g. `election` |
| entity_id | INT | NULL | PK of related entity |
| details | TEXT | NULL | JSON string |
| ip_address | VARCHAR(45) | NULL | |
| created_at | DATETIME | NOT NULL | |

### 7.3 Migration History

| # | File | Description |
|---|---|---|
| 001 | `001_initial_schema.py` | Creates users, elections, candidates, votes, audit_logs |
| 002 | `002_seed_admin.py` | Seeds default tenant admin (admin@voting.com / Admin@123) |
| 003 | `003_add_tenants_table.py` | Creates tenants table with plan/status/limit columns |
| 004 | `004_add_tenant_id_to_tables.py` | Adds tenant_id FK + index to all 5 tables |
| 005 | `005_update_role_enum_add_superadmin.py` | Adds `superadmin` to users.role enum |
| 006 | `006_seed_superadmin_and_default_tenant.py` | Seeds TechElect tenant + superadmin user |

---

## 8. API Specification

### 8.1 Base URL

```
http://localhost:8000/api/v1     (development)
https://api.yourdomain.com/api/v1  (production)
```

### 8.2 Authentication

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

### 8.3 Endpoint Summary

#### Authentication
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Register new voter |
| POST | `/auth/login` | None | Login, get JWT |
| POST | `/auth/verify-otp` | None | Verify OTP |
| POST | `/auth/refresh-token` | None | Refresh access token |
| GET | `/auth/me` | Required | Get current user |

#### Tenants (SuperAdmin only)
| Method | Path | Description |
|---|---|---|
| GET | `/tenants/platform-stats` | Platform-wide statistics |
| GET | `/tenants/` | List all tenants |
| POST | `/tenants/` | Create tenant + first admin |
| GET | `/tenants/{id}` | Get tenant with usage stats |
| PUT | `/tenants/{id}` | Update tenant settings |
| DELETE | `/tenants/{id}` | Soft-delete tenant |
| POST | `/tenants/{id}/suspend` | Suspend tenant |
| POST | `/tenants/{id}/activate` | Activate tenant |
| GET | `/tenants/{id}/elections` | All elections for tenant |
| GET | `/tenants/{id}/users` | All users for tenant |

#### Elections
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/elections/` | Optional | List elections (tenant-scoped) |
| POST | `/elections/` | Admin | Create election |
| GET | `/elections/{id}` | Optional | Get election |
| PUT | `/elections/{id}` | Admin | Update election (draft) |
| DELETE | `/elections/{id}` | Admin | Delete election (draft) |
| POST | `/elections/{id}/activate` | Admin | Activate election |
| POST | `/elections/{id}/close` | Admin | Close election |
| GET | `/elections/stats/overview` | Admin | Election statistics |

#### Candidates
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/candidates/election/{id}` | Optional | List candidates |
| POST | `/candidates/` | Admin | Add candidate |
| GET | `/candidates/{id}` | Optional | Get candidate |
| PUT | `/candidates/{id}` | Admin | Update candidate |
| DELETE | `/candidates/{id}` | Admin | Delete candidate |
| GET | `/candidates/results/{election_id}` | Optional | Election results (ranked) |

#### Votes
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/votes/cast` | Voter | Cast a vote |
| GET | `/votes/my-vote/{election_id}` | Voter | Check if voted |
| GET | `/votes/results/{election_id}` | Optional | Get results with % |
| GET | `/votes/live/{election_id}` | Optional | Live vote stats |

#### Users (Admin)
| Method | Path | Description |
|---|---|---|
| GET | `/users/` | List users (tenant-scoped) |
| GET | `/users/stats/overview` | User statistics |
| GET | `/users/{id}` | Get user |
| PUT | `/users/{id}` | Update user |
| DELETE | `/users/{id}` | Delete user |
| POST | `/users/{id}/approve` | Approve pending voter |
| POST | `/users/{id}/block` | Block user |

#### Reports
| Method | Path | Description |
|---|---|---|
| GET | `/reports/dashboard` | Overview stats |
| GET | `/reports/elections/{id}` | Election report |
| GET | `/reports/participation/{id}` | Participation stats |
| GET | `/reports/audit-logs` | Audit log (paginated) |

### 8.4 Standard Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "detail": "Descriptive error message."
}
```

**Paginated:**
```json
{
  "success": true,
  "data": [...],
  "total": 240,
  "page": 1,
  "per_page": 20
}
```

---

## 9. Security Requirements

### 9.1 Authentication Security

| Requirement | Implementation |
|---|---|
| Password storage | bcrypt, cost factor 12 |
| JWT signing | HS256, configurable secret |
| Token expiry | Access: 30 min, Refresh: 7 days |
| OTP storage | Bcrypt-hashed (not plaintext) |
| OTP expiry | 10 minutes |

### 9.2 Authorisation Model

```
superadmin  ──can do──►  everything (platform + all tenants)
    │
admin       ──can do──►  tenant CRUD (own tenant only)
    │
voter       ──can do──►  register, vote, view results (own tenant only)
```

### 9.3 Data Isolation Guarantees

All tenant-scoped queries enforce isolation at **three independent layers**:

1. **Repository layer**: `get_all_by_tenant(tenant_id)` — every query filters by `tenant_id`
2. **Service layer**: methods accept and validate `tenant_id` parameter
3. **Controller layer**: extracts `tenant_id` from JWT, passes to service

A tenant admin accessing another tenant's resource returns HTTP 404 (not 403 — the resource appears not to exist, preventing information leakage).

### 9.4 Input Validation

- All request bodies validated by Pydantic schemas before reaching service layer
- String fields have `max_length` constraints
- Email fields validated as RFC-5322 compliant
- Date fields validated for logical ordering (end_date > start_date)
- No raw SQL string interpolation; all queries via SQLAlchemy ORM

---

## 10. Tenant Isolation Model

### 10.1 Isolation Strategy

**Row-Level Tenancy** — single database, `tenant_id` foreign key column on all business tables.

**Chosen over alternatives because:**
- Simpler operational model (one DB to manage)
- Easy to migrate to schema-per-tenant or DB-per-tenant later if needed
- SQLAlchemy ORM filters are transparent and testable
- Indexes on `tenant_id` ensure query performance doesn't degrade with tenant count

### 10.2 Superadmin Bypass

SuperAdmin users have `tenant_id = NULL` in the database. The `get_tenant_context()` middleware dependency returns `None` for superadmins. Services receiving `tenant_id = None` apply no tenant filter and see all records.

### 10.3 Suspension Enforcement

When a tenant is suspended:
1. `tenants.status = 'suspended'` is set in the DB
2. On every login attempt, `auth_service.login()` fetches the tenant record and checks status
3. If status = `suspended`, HTTP 403 is returned before a token is issued
4. Existing tokens continue to work until they expire (30-minute window)
5. **Hardening option (v2)**: maintain a token revocation list in Redis to invalidate immediately

### 10.4 Isolation Test Checklist

- [ ] Tenant A admin cannot read Tenant B's elections
- [ ] Tenant A voter cannot vote in Tenant B's elections
- [ ] Tenant A admin cannot approve Tenant B's users
- [ ] SuperAdmin cross-tenant view returns correct tenant's data
- [ ] Suspended tenant users cannot obtain new tokens
- [ ] Duplicate vote attempt within one tenant does not affect another tenant

---

## 11. Technology Stack

### 11.1 Backend

| Component | Technology | Version |
|---|---|---|
| Language | Python | 3.11+ |
| Framework | FastAPI | 0.111.0 |
| ORM | SQLAlchemy | 2.0.30 |
| Migrations | Alembic | 1.13.1 |
| Database | MySQL | 8.0+ |
| DB Driver | PyMySQL | 1.1.1 |
| Auth | python-jose, passlib[bcrypt] | 3.3.0, 1.7.4 |
| Validation | Pydantic v2 | 2.7.1 |
| Server | Uvicorn | 0.29.0 |

### 11.2 Frontend (Admin Panel)

| Component | Technology | Version |
|---|---|---|
| Language | JavaScript (JSX) | ES2022 |
| Framework | React | 18.3.1 |
| Build Tool | Vite | 5.2.13 |
| Styling | Tailwind CSS | 3.4.4 |
| State Management | Redux Toolkit | 2.2.5 |
| Routing | React Router | 6.23.1 |
| HTTP Client | Axios | 1.7.2 |
| Charts | Recharts | 2.12.7 |
| UI Primitives | Headless UI | 2.1.1 |
| Notifications | React Hot Toast | 2.4.1 |
| Icons | React Icons | 5.2.1 |

### 11.3 Mobile (Planned v2.0)

| Component | Technology |
|---|---|
| Framework | React Native (Expo) |
| State | Redux Toolkit |
| Navigation | React Navigation |
| HTTP | Axios |

---

## 12. Constraints & Assumptions

### 12.1 Constraints

- The system currently uses MySQL only; PostgreSQL support is not in scope for v1
- OTP delivery is console-logged in development; a transactional email service (SendGrid, SES) is required for production
- PDF/Excel export (FR-REPORT-02, FR-REPORT-03) is deferred to v2.0
- Auto-scheduling of elections (FR-ELEC auto-activate/close) requires APScheduler/Celery — deferred to v2.0
- The mobile app is a placeholder; implementation deferred to v2.0
- Real-time WebSocket push (for instant live results) is deferred to v2.0; polling at 30s used in v1

### 12.2 Assumptions

- Each voter has a unique email address (primary deduplication key)
- All servers are in the same timezone (UTC); timestamps stored in UTC
- Each tenant has at least one admin user at all times
- The `bcrypt` library is installed in the Python environment where Alembic migrations run (required by migration 006)
- The platform operator (SuperAdmin) is a trusted party with full system access

### 12.3 Dependencies

- MySQL 8.0+ must be provisioned and accessible before running migrations
- `alembic upgrade head` must be run to apply all 6 migrations before starting the API
- Environment variables in `.env` must be configured (see `.env.example`)

---

## 13. Glossary

| Term | Definition |
|---|---|
| **Alembic** | Python database migration framework for SQLAlchemy |
| **Atomic transaction** | A DB operation where all steps succeed or all are rolled back |
| **bcrypt** | A password hashing algorithm designed to be computationally expensive |
| **HS256** | HMAC-SHA256 — a symmetric JWT signing algorithm |
| **JWT** | JSON Web Token — a compact, self-contained token for authentication |
| **MVC** | Model-View-Controller — an architectural pattern separating data, logic, and presentation |
| **ORM** | Object-Relational Mapper — maps Python classes to database tables |
| **OTP** | One-Time Password — a short-lived code for identity verification |
| **Pydantic** | Python library for data validation using type annotations |
| **Repository pattern** | An abstraction layer between business logic and data access |
| **Row-level tenancy** | Multi-tenancy strategy using a `tenant_id` column on shared tables |
| **SaaS** | Software as a Service — software delivered over the internet on a subscription basis |
| **SOLID** | Five OOP design principles: Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion |
| **SQLAlchemy** | Python SQL toolkit and ORM |
| **Tenant** | An isolated organization using the platform under its own subscription |
| **Uvicorn** | ASGI server for running FastAPI applications |
