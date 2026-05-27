# Software Requirements Specification (SRS)

## Digital Voting System — Internal Member Voting Platform (Multi-Tenant SaaS)

| Field | Value |
|---|---|
| **Document Version** | 3.0.0 |
| **Previous Version** | 2.0.0 |
| **Date** | 2026-05-22 |
| **Status** | Approved |
| **Project** | voting_management_system |
| **Repository Branch** | `claude/admin-panel-mvc-setup-YHJmi` |

### Change Log

| Version | Date | Summary of Changes |
|---|---|---|
| 1.0.0 | 2026-05-01 | Initial draft — basic election + voter model |
| 2.0.0 | 2026-05-10 | Added multi-tenant SaaS architecture, SuperAdmin role, Alembic migrations |
| **3.0.0** | **2026-05-22** | **Major revision: system is now closed/internal — no public citizens. Added member designations (hierarchy), mandatory address + district fields, geo-targeted election scoping, member subscription plans (party revenue), and member directory with designation + region filters.** |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [Stakeholders & User Classes](#3-stakeholders--user-classes)
4. [System Architecture](#4-system-architecture)
5. [Functional Requirements](#5-functional-requirements)
   - 5.1 Authentication & Onboarding
   - 5.2 Multi-Tenant Management (SuperAdmin)
   - 5.3 Member Management
   - 5.4 Member Subscriptions
   - 5.5 Election Management & Geo-Targeting
   - 5.6 Candidate Management
   - 5.7 Voting Engine
   - 5.8 Live Results & Analytics
   - 5.9 Audit Logs & Security
   - 5.10 Reports & Data Export
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

This Software Requirements Specification (SRS) document defines the complete functional and non-functional requirements for the **Digital Voting System**, a secure, transparent, and reliable multi-tenant SaaS platform for conducting **internal organizational elections**.

The system is designed exclusively for **closed, private organizations** such as political parties, trade unions, corporate boards, and professional associations. There is no public-facing voter registration. Only pre-registered, admin-approved, active-subscription **members** of the organization may participate in voting.

The platform enables TechElect Solutions to licence the voting infrastructure to multiple independent organizations, each operating in complete data isolation.

### 1.2 Scope

The system provides:

- A **REST API** (FastAPI / Python) serving all business logic
- An **Admin Web Panel** (React) for organization administrators and the platform superadmin
- A **Mobile Application** (React Native — Expo) for members to receive notifications, browse elections, and cast votes
- A **MySQL relational database** with versioned Alembic migrations
- **Multi-tenant row-level isolation** ensuring zero data leakage between organizations
- **Geo-targeted election scoping** — elections are targeted to members of specific districts or designations; only eligible members receive notifications and are allowed to vote
- **Member subscription billing** — subscription revenue is collected from individual members and credited to the subscribing organization's revenue

### 1.3 Key Principles (v3.0.0)

> **This system has NO public-facing registration or open voter access.**

1. All members are registered by — or under approval of — the organization's admin.
2. Membership requires mandatory address/district information (used for geo-targeting).
3. Every member has a designated rank/designation within the hierarchy (e.g., President, Vice President, Secretary).
4. Elections are scoped to specific districts and/or designations; only eligible members are notified and permitted to vote.
5. Members pay subscription fees; this revenue flows to the organization's treasury.

### 1.4 Definitions

| Term | Definition |
|---|---|
| **Tenant** | An organization (e.g. a political party, TMC) that subscribes to the platform |
| **SuperAdmin** | The platform owner (TechElect Solutions). Has global, unrestricted access |
| **Admin** | A tenant-level user who manages members, elections, and candidates |
| **Member** | A registered, verified, admin-approved, and subscription-active organizational member eligible to vote |
| **Designation** | A hierarchical rank within an organization (e.g., President, Vice President, Secretary) |
| **District** | A geographic subdivision (district, region, state zone) to which a member belongs — used for election targeting |
| **Election Scope** | The set of districts and/or designations eligible for a specific election |
| **Subscription** | A recurring membership plan that a member pays for; revenue goes to the organization's wallet |
| **Election** | An internal voting event with a defined scope, candidate set, and lifecycle (draft → active → closed) |
| **Candidate** | A person registered to receive votes within a specific election |
| **OTP** | One-Time Password — 6-digit code for identity verification |
| **JWT** | JSON Web Token — used for stateless authentication |
| **Tenant Isolation** | The guarantee that one tenant's data is never visible to another tenant |

### 1.5 Overview

Sections 2–4 describe the product from a high level and its architecture. Sections 5–9 specify detailed requirements. Sections 10–13 cover cross-cutting concerns.

---

## 2. Overall Description

### 2.1 Product Perspective

The Digital Voting System is a closed-ecosystem SaaS application. It replaces paper-based or in-person member voting processes with a tamper-proof, auditable, geo-targeted digital alternative.

```
┌──────────────────────────────────────────────────────────────┐
│                    TechElect Platform                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                 SuperAdmin Portal                      │  │
│  │   Manages tenant orgs, monitors platform health        │  │
│  └──────────────────────┬─────────────────────────────────┘  │
│                         │ provisions                          │
│        ┌────────────────┼────────────┬──────────────┐         │
│        ▼                ▼            ▼              ▼         │
│  ┌──────────┐   ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  TMC     │   │   BJP    │  │   INC    │  │  Org N   │    │
│  │ (Tenant) │   │ (Tenant) │  │ (Tenant) │  │ (Tenant) │    │
│  └────┬─────┘   └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │               │             │              │           │
│  Admin Panel     Admin Panel   Admin Panel    Admin Panel     │
│  Mobile App      Mobile App    Mobile App     Mobile App      │
│  (members)       (members)     (members)      (members)       │
└──────────────────────────────────────────────────────────────┘
                          │
             ┌────────────▼───────────┐
             │    FastAPI REST API    │
             └────────────┬───────────┘
                          │
             ┌────────────▼───────────┐
             │     MySQL Database     │
             │  (Row-level tenancy)   │
             └────────────────────────┘
```

### 2.2 Product Functions (Summary)

1. **Tenant Provisioning** — SuperAdmin creates organizations; each gets an isolated environment and a revenue wallet
2. **Member Registration (Admin-controlled)** — Members self-register or are bulk-imported; address + designation + district are mandatory
3. **Member Directory** — Searchable/filterable registry of all members by designation and district
4. **Subscription Billing** — Members subscribe to membership plans; revenue credited to the organization's treasury
5. **Geo-Targeted Elections** — Admin creates elections scoped to a specific district and/or designation set; only eligible members are notified
6. **One-Vote-One-Person Engine** — Atomic, tamper-proof vote recording; each eligible member votes exactly once
7. **Real-Time Results** — Live charts and analytics during and after voting
8. **Audit Trail** — Immutable log of every system action
9. **Reports & Exports** — PDF/CSV/Excel exports for official records

### 2.3 Operating Environment

- **Server**: Linux (Ubuntu 20.04+), Python 3.11+, MySQL 8.0+
- **Client (Web Admin)**: Modern browsers — Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Client (Mobile Member App)**: Android 8+, iOS 13+ (Expo / React Native)
- **Deployment**: Docker-compatible; deployable to AWS, GCP, Azure, or on-premise

### 2.4 Use Case Example

> The admin of the **Trinamool Congress (TMC)** party creates an election titled *"District President — Maharashtra Zone"*. The election scope is set to:
> - **Target District**: Maharashtra
> - **Target Designations**: All designations (any designation may vote in this election)
>
> When the election is activated, the system automatically:
> - Filters all TMC members whose `district = "Maharashtra"` and whose subscription is active
> - Sends a push notification to each eligible member's mobile app
> - Restricts the voting endpoint to only those matching members
>
> A TMC member from Delhi cannot see or vote in this election. A Maharashtra TMC member with an expired subscription receives the notification but is blocked from casting a vote.

---

## 3. Stakeholders & User Classes

### 3.1 SuperAdmin (Platform Owner)

**Who:** TechElect Solutions — the platform operator.

**Responsibilities:**
- Create, configure, suspend, and delete tenant organizations
- Monitor platform-wide usage (total tenants, elections, votes, subscription revenue)
- Enforce plan limits (election quotas, member quotas)
- Inspect any tenant's data for support purposes

**Access:** Global — unrestricted across all tenants. Cannot cast votes.

---

### 3.2 Organization Admin (Tenant Administrator)

**Who:** The IT officer, election commissioner, or party secretary of the subscribing organization.

**Responsibilities:**
- Register and manage member profiles (including address + designation assignment)
- Define and manage the designation hierarchy for their organization
- Create elections with district + designation scoping
- Add, edit, and remove candidates from elections
- Review and approve/reject member registrations
- Block or suspend fraudulent member accounts
- View subscription revenue and member payment status
- View election results and download reports
- Monitor the audit log

**Access:** Scoped strictly to their own tenant.

---

### 3.3 Member (Organizational Member / Voter)

**Who:** A registered, active-subscription member of the organization — not a member of the public.

**Profile (mandatory):**
- Full name, email (unique), phone
- **Complete address**: street, city, district, state, country, pincode
- **Designation**: hierarchical rank within the organization (assigned or chosen from approved list)
- Subscription plan and status

**Capabilities:**
- Register (with mandatory address + designation) — pending admin approval
- Pay membership subscription via integrated payment
- Receive push notifications only for elections scoped to their district/designation
- View and participate only in elections for which they are eligible
- Cast exactly one vote per election
- View member directory filtered by designation and district
- View election results

**Access:** Own profile + own-tenant elections that match their district/designation scope.

---

## 4. System Architecture

### 4.1 Architectural Pattern

The system follows **MVC (Model-View-Controller)** with a **Repository-Service-Controller** layered architecture:

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
│    Service       │  Business logic, validation, orchestration, eligibility checks
│  (domain layer)  │
└────────┬─────────┘
         │ calls
         ▼
┌──────────────────┐
│   Repository     │  Data access — tenant-scoped, district-scoped SQLAlchemy queries
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
| **S** — Single Responsibility | Models define schema; repositories query data; services orchestrate logic; controllers handle HTTP |
| **O** — Open/Closed | `BaseRepository[T]` extended by concrete repos without modification |
| **L** — Liskov Substitution | All repositories honour the `BaseRepository` contract |
| **I** — Interface Segregation | Separate Pydantic schemas for create/update/response |
| **D** — Dependency Inversion | Controllers depend on Service abstractions; Services on Repository abstractions |

### 4.3 Directory Structure

```
voting_management_system/
├── backend/                        # Python FastAPI API server
│   ├── app/
│   │   ├── config/                 # Settings (pydantic-settings), DB engine/session
│   │   ├── controllers/            # FastAPI APIRouters (HTTP layer)
│   │   │   ├── auth_controller.py
│   │   │   ├── member_controller.py      # ← new (member directory + designations)
│   │   │   ├── election_controller.py
│   │   │   ├── candidate_controller.py
│   │   │   ├── vote_controller.py
│   │   │   ├── subscription_controller.py # ← new (member subscription plans)
│   │   │   ├── report_controller.py
│   │   │   ├── tenant_controller.py
│   │   │   └── user_controller.py
│   │   ├── middlewares/            # Auth dependencies, audit middleware
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   │   ├── tenant.py
│   │   │   ├── user.py             # + address fields, designation_id, district
│   │   │   ├── designation.py      # ← new (hierarchy reference table)
│   │   │   ├── election.py         # + target_district, target_designations
│   │   │   ├── candidate.py
│   │   │   ├── vote.py
│   │   │   ├── member_subscription.py  # ← new
│   │   │   └── audit_log.py
│   │   ├── repositories/           # Data access layer
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   ├── services/               # Business logic layer
│   │   │   ├── member_service.py   # ← new (directory, eligibility, designation)
│   │   │   ├── subscription_service.py # ← new
│   │   │   └── ...
│   │   └── utils/
│   ├── migrations/                 # Alembic versioned migrations (001–009)
│   └── main.py
│
├── frontend/                       # React Admin Panel (Vite + Tailwind + Redux)
│   └── src/
│       ├── pages/
│       │   ├── MembersPage.jsx         # ← new (member directory with filters)
│       │   ├── DesignationsPage.jsx    # ← new (manage designation hierarchy)
│       │   ├── SubscriptionsPage.jsx   # ← new (revenue dashboard)
│       │   └── ...
│       └── ...
│
└── mobile/                         # React Native member app (Expo)
    └── src/
        ├── screens/
        │   ├── DashboardScreen.tsx     # Active elections (scoped to member)
        │   ├── MyVotesScreen.tsx       # Voting history
        │   ├── MembersScreen.tsx       # Member directory with filters
        │   └── ProfileScreen.tsx       # Member profile + subscription
        ├── components/
        ├── navigation/
        └── theme/
```

---

## 5. Functional Requirements

### 5.1 Authentication & Onboarding

#### FR-AUTH-01: Member Self-Registration

> **Note:** This is NOT a public signup. The registration form is accessed via the organization's private member portal URL or a mobile invite link issued by the admin.

- The system SHALL accept member registration with the following fields:

**Personal Information (all required):**
  - `full_name` (required, 2–150 chars)
  - `email` (required, unique, RFC-5322 valid)
  - `phone` (required for members — needed for OTP and notifications)
  - `password` (required, min 8 chars, must contain ≥1 uppercase, ≥1 number, ≥1 special character)

**Address Information (all required):**
  - `street_address` (required)
  - `city` (required)
  - `district` (required — primary field used for geo-targeting elections)
  - `state` (required)
  - `country` (required, default from tenant config)
  - `pincode` (required)

**Organization Information (required):**
  - `designation_id` (required — FK to the tenant's designation list; must be an approved designation for the tenant)

- Missing address or designation fields SHALL return HTTP 422 with field-specific validation errors
- New accounts SHALL be created with `status = pending` and `is_verified = false`
- A 6-digit OTP SHALL be generated and stored (bcrypt-hashed) with a 10-minute TTL

#### FR-AUTH-02: OTP Verification

- `POST /api/v1/auth/verify-otp` accepting `{ email, otp_code }`
- On success: `is_verified = true`, OTP fields cleared
- On failure: HTTP 400 with message (invalid code / expired)

#### FR-AUTH-03: JWT Login

- `POST /api/v1/auth/login` accepts email + password (OAuth2 form)
- On success: `{ access_token, refresh_token, token_type, user }`
- JWT payload: `{ sub: user_id, role, tenant_id, district, designation_id, type, exp }`
- Access token TTL: 30 minutes. Refresh token TTL: 7 days
- Blocked members → HTTP 401
- Pending (unapproved) members → HTTP 403
- Suspended tenant → HTTP 403
- **Subscription-lapsed members** → login succeeds; voting is blocked at cast-vote step (so members can still renew via the app)

#### FR-AUTH-04: Token Refresh

- `POST /api/v1/auth/refresh-token` — returns new access token
- Invalid/expired tokens → HTTP 401

#### FR-AUTH-05: Current User Profile

- `GET /api/v1/auth/me` — returns full member profile including address, designation, subscription status, and `tenant_id`

---

### 5.2 Multi-Tenant Management (SuperAdmin)

#### FR-TENANT-01: Create Tenant

- `POST /api/v1/tenants/` — SuperAdmin creates an organization tenant
- Required: `name`, `contact_email`, `admin_email`, `admin_password`, `admin_full_name`
- Optional: `slug`, `plan`, `logo_url`, `primary_color`, `default_country`
- Atomically creates tenant + first admin user in one transaction

#### FR-TENANT-02: Plan-Based Limits

| Plan | Max Elections | Max Members | Max Designations | Subscription Revenue Feature |
|---|---|---|---|---|
| starter | 5 | 500 | 10 | Manual tracking only |
| professional | 25 | 5,000 | 50 | Basic revenue dashboard |
| enterprise | 999,999 | 999,999 | 500 | Full revenue analytics + export |

- Exceeding election or member limits → HTTP 402 with upgrade message
- SuperAdmin MAY override limits by editing the tenant record

#### FR-TENANT-03: Tenant Lifecycle

- Status transitions: `trial → active → suspended → cancelled`
- `POST /api/v1/tenants/{id}/suspend` — blocks all member logins; reason required
- `POST /api/v1/tenants/{id}/activate` — restores all access
- `DELETE /api/v1/tenants/{id}` — soft delete (status = `cancelled`); data preserved

#### FR-TENANT-04: Platform Statistics

- `GET /api/v1/tenants/platform-stats` — returns: total_tenants, active_tenants, trial_tenants, suspended_tenants, total_members, total_elections, total_votes, total_subscription_revenue

#### FR-TENANT-05: Cross-Tenant Inspection

- SuperAdmin may view any tenant's elections, members, and subscription revenue
- All cross-tenant actions logged in audit trail

---

### 5.3 Member Management

#### FR-MEMBER-01: Designation Hierarchy

- Each tenant SHALL maintain a list of designations defining the organizational hierarchy
- `POST /api/v1/designations/` — Admin creates a designation (e.g., "District President")
- Required: `title` (e.g., "Vice President"), `level` (integer — lower = higher rank; President = 1, VP = 2, Secretary = 3…)
- Optional: `description`, `color` (for display badges)
- Example designation hierarchy:

| Level | Title |
|---|---|
| 1 | President |
| 2 | Vice President |
| 3 | Secretary General |
| 4 | Secretary |
| 5 | Joint Secretary |
| 6 | Treasurer |
| 7 | Executive Member |
| 8 | Primary Member |

- `GET /api/v1/designations/` — returns full hierarchy sorted by level ascending
- `PUT /api/v1/designations/{id}` — update title/level
- `DELETE /api/v1/designations/{id}` — only if no members are currently assigned

#### FR-MEMBER-02: Member Directory

- `GET /api/v1/members/` — paginated list of all members within the tenant
- **Filter parameters:**
  - `designation_id` — filter to specific designation (e.g., "show all Secretaries")
  - `district` — filter to specific district (e.g., "show all Maharashtra members")
  - `designation_id + district` combined — e.g., "show Vice President of Maharashtra"
  - `status` — active / pending / blocked
  - `subscription_status` — active / expired / trial
  - `search` — full-text search on full_name, email
- Results include: `full_name`, `email`, `phone`, `district`, `designation.title`, `designation.level`, `subscription_status`, `status`

#### FR-MEMBER-03: Member Profile Management

- `GET /api/v1/members/{id}` — full member profile (admin or self)
- `PUT /api/v1/members/{id}` — update profile; address updates require admin approval if district changes (since district determines election eligibility)
- District changes SHALL be logged in audit trail and require admin confirmation
- `POST /api/v1/members/{id}/approve` — admin approves pending registration → `status = active`
- `POST /api/v1/members/{id}/block` — admin blocks member → `status = blocked`
- `POST /api/v1/members/{id}/change-designation` — admin reassigns designation; logged in audit trail

#### FR-MEMBER-04: Member Statistics

- `GET /api/v1/members/stats` — returns:
  - `total_members`, `active_members`, `pending_members`, `blocked_members`
  - `members_by_district`: `[{ district, count }]` — breakdown by district
  - `members_by_designation`: `[{ designation_title, level, count }]`
  - `subscription_active_count`, `subscription_lapsed_count`

---

### 5.4 Member Subscriptions

#### FR-SUBS-01: Subscription Plans

- Each tenant admin SHALL define membership subscription plans for their organization
- `POST /api/v1/subscriptions/plans/` — create a plan
- Required: `name` (e.g., "Annual Membership"), `amount` (decimal), `currency`, `duration_days` (e.g., 365)
- Optional: `description`, `benefits` (JSON array of benefit strings)
- `GET /api/v1/subscriptions/plans/` — list all plans for the tenant

#### FR-SUBS-02: Member Subscription Enrollment

- `POST /api/v1/subscriptions/enroll` — member selects a plan and initiates subscription
- Body: `{ plan_id }`
- Creates a `member_subscription` record with `status = pending_payment`
- Returns a payment reference (integrated with payment gateway in v2.0; manual confirmation in v1.0)

#### FR-SUBS-03: Subscription Activation (v1.0 — Manual)

- `POST /api/v1/subscriptions/{id}/confirm` (admin only) — admin manually confirms a payment and activates the subscription
- Sets `status = active`, `start_date = now()`, `end_date = now() + plan.duration_days`
- Logs to audit trail: `subscription_activated`

#### FR-SUBS-04: Subscription Expiry

- A scheduled background task SHALL check daily for subscriptions where `end_date < now()`
- Expired subscriptions → `status = expired`
- Members with `expired` subscriptions:
  - Can still log in and view elections
  - Are blocked from casting votes (`HTTP 402 — Subscription expired. Please renew to vote.`)
  - Receive a push notification 7 days and 1 day before expiry

#### FR-SUBS-05: Revenue Dashboard (Admin)

- `GET /api/v1/subscriptions/revenue` — returns:
  - `total_revenue` (sum of all confirmed subscription amounts)
  - `monthly_revenue`: `[{ month, amount }]` — last 12 months
  - `active_subscriptions`, `expired_subscriptions`, `pending_subscriptions`
  - `plan_breakdown`: `[{ plan_name, subscriber_count, total_amount }]`

---

### 5.5 Election Management & Geo-Targeting

#### FR-ELEC-01: Create Election with Scope

- `POST /api/v1/elections/` — admin creates an election
- **Required**: `title`, `start_date`, `end_date`
- **Optional targeting fields** (if omitted, election is open to ALL active-subscription members of the tenant):
  - `target_district` (string | null) — restrict to members in this district
  - `target_designation_ids` (list of ints | null) — restrict to members with these designation IDs
- Example: `{ title: "District President — Maharashtra", target_district: "Maharashtra", target_designation_ids: null }` — all Maharashtra members may vote
- Example: `{ title: "Central Working Committee Vote", target_district: null, target_designation_ids: [1, 2, 3] }` — all Presidents/VPs/Secretaries across all districts may vote
- `end_date` must be after `start_date` (server-side validated)
- New elections start in `draft` status
- `created_by`, `tenant_id` set automatically

#### FR-ELEC-02: Election Lifecycle State Machine

```
draft ──activate──► active ──close──► closed
  │                    │
  └──cancel──► cancelled (terminal)
```

- Activation rejected if candidate count < 2 (HTTP 400)
- All state transitions logged in `audit_logs`
- No transitions from terminal states (`closed`, `cancelled`)
- **On activation**, the system SHALL compute and cache the list of eligible member IDs (matching district + designation + active subscription)

#### FR-ELEC-03: Election CRUD

- `GET /api/v1/elections/` — list elections (filterable by status)
- `GET /api/v1/elections/{id}` — get election, including scope definition and eligible member count
- `PUT /api/v1/elections/{id}` — update (draft only, targeting fields editable)
- `DELETE /api/v1/elections/{id}` — soft delete (draft only)
- `POST /api/v1/elections/{id}/activate` — go live + send notifications
- `POST /api/v1/elections/{id}/close` — end voting

#### FR-ELEC-04: Tenant Scoping

- All election queries automatically filtered to requesting user's `tenant_id`
- A tenant admin CANNOT see or modify elections of another tenant

#### FR-ELEC-05: Eligible Member Count

- `GET /api/v1/elections/{id}/eligible-members` — returns count and list of members who match the election scope
- Admin uses this to verify targeting before activating

---

### 5.6 Candidate Management

#### FR-CAND-01: Add Candidate

- `POST /api/v1/candidates/` — admin adds a candidate to an election
- Required: `election_id`, `full_name`
- Optional: `party`, `symbol`, `bio` (max 500 chars), `image_url`
- Candidates can only be added to `draft` elections
- `vote_count` defaults to 0 and is system-managed only

#### FR-CAND-02: Edit / Remove Candidate

- Update and delete only permitted in `draft` status

#### FR-CAND-03: Candidate Display (Member App)

- `GET /api/v1/candidates/election/{election_id}` — returns candidates
- `vote_count` is hidden (returned as 0) during `active` elections (prevents bandwagon effect)
- Only members who are eligible for this election may view its candidates

#### FR-CAND-04: Election Results

- `GET /api/v1/candidates/results/{election_id}` — candidates ranked by vote_count descending

---

### 5.7 Voting Engine

#### FR-VOTE-01: Cast Vote

- `POST /api/v1/votes/cast` — body: `{ election_id, candidate_id }`
- Member eligibility checks (in order):
  1. Member is authenticated → HTTP 401 if not
  2. Election exists + is `active` → HTTP 400 if not
  3. Election belongs to member's tenant → HTTP 403 if mismatch
  4. Member's `district` matches `election.target_district` (if set) → HTTP 403 if mismatch
  5. Member's `designation_id` is in `election.target_designation_ids` (if set) → HTTP 403 if mismatch
  6. Member's subscription is `active` → HTTP 402 if expired/pending
  7. Member `is_verified = true` and `status = active` → HTTP 403 if not
  8. No prior vote in this election → HTTP 409 if duplicate
  9. Candidate belongs to this election and same tenant → HTTP 400 if mismatch
- On success: insert `votes` record + atomically increment `candidates.vote_count` in single transaction
- Vote record includes: `user_id`, `election_id`, `candidate_id`, `voted_at`, `ip_address`, `tenant_id`

#### FR-VOTE-02: One Vote Per Election (Critical)

- `UNIQUE(user_id, election_id)` constraint enforced at **database level** (not application-only)
- Duplicate attempt → HTTP 409 + logged as `DUPLICATE_VOTE_ATTEMPT` in audit trail

#### FR-VOTE-03: Vote Immutability

- Votes SHALL never be updated or deleted via any API endpoint
- DB user for the application has INSERT-only permission on `votes` in production

#### FR-VOTE-04: Vote Status Check

- `GET /api/v1/votes/my-vote/{election_id}` — returns `{ has_voted: bool, voted_at: timestamp | null }`
- The candidate chosen is NEVER exposed via any API response

#### FR-VOTE-05: Geo-Targeting Enforcement

- The service layer SHALL recompute eligibility at vote-cast time (not rely solely on the notification filter)
- A member who received a notification but whose district or designation has since been changed SHALL be re-evaluated at vote time

---

### 5.8 Live Results & Analytics

#### FR-RESULT-01: Election Results

- `GET /api/v1/votes/results/{election_id}` — returns:
  ```json
  {
    "election_id": 1,
    "election_title": "District President — Maharashtra",
    "target_district": "Maharashtra",
    "eligible_member_count": 540,
    "total_votes": 312,
    "participation_rate": 57.8,
    "results": [
      {
        "candidate_id": 3,
        "candidate_name": "Priya Sharma",
        "party": "TMC",
        "vote_count": 189,
        "percentage": 60.6
      }
    ]
  }
  ```
- Percentage = `(candidate_votes / total_votes) × 100`, rounded to 1 decimal
- `participation_rate` = `(total_votes / eligible_member_count) × 100`
- If `total_votes = 0`, all percentages = 0.0 (no division by zero)

#### FR-RESULT-02: Live Stats

- `GET /api/v1/votes/live/{election_id}` — same structure; admin panel auto-refreshes every 30s

#### FR-RESULT-03: Dashboard Overview

- `GET /api/v1/reports/dashboard` — returns: `total_members`, `active_members`, `total_elections`, `total_votes`, `active_elections`, `subscription_revenue_mtd` (tenant-scoped)

---

### 5.9 Audit Logs & Security

#### FR-AUDIT-01: Automatic Event Logging

| Event | action value |
|---|---|
| Member login | `member_login` |
| Member registration | `member_register` |
| OTP verified | `otp_verified` |
| Member approved | `member_approved` |
| Member blocked | `member_blocked` |
| Designation changed | `designation_changed` |
| District changed | `district_changed` |
| Subscription activated | `subscription_activated` |
| Subscription expired | `subscription_expired` |
| Vote cast | `vote_cast` |
| Duplicate vote attempt | `DUPLICATE_VOTE_ATTEMPT` |
| Election created | `election_created` |
| Election activated | `election_activated` |
| Election closed | `election_closed` |
| Candidate added | `candidate_added` |
| Notification sent | `notification_sent` |
| Tenant created | `tenant_created` |
| Tenant suspended | `tenant_suspended` |

#### FR-AUDIT-02: Audit Log Fields

Each entry: `user_id` (nullable), `action`, `entity_type`, `entity_id`, `details` (JSON), `ip_address`, `created_at`, `tenant_id`

#### FR-AUDIT-03: Audit Log Immutability

- INSERT-only permission on `audit_logs` in production
- No API endpoint allows modifying or deleting entries

#### FR-AUDIT-04: Audit Log Query

- `GET /api/v1/reports/audit-logs` (admin only) — paginated, filterable by action, date range, user, entity_type

---

### 5.10 Reports & Data Export

#### FR-REPORT-01: Election Report

- `GET /api/v1/reports/elections/{id}` — detailed report including scope (target district + designations), participation rate by district, candidate results, timestamps

#### FR-REPORT-02: Member Report

- `GET /api/v1/reports/members` — breakdown of members by district and designation with subscription status

#### FR-REPORT-03: Subscription Revenue Report

- `GET /api/v1/reports/subscriptions` — total revenue, monthly trend, plan-level breakdown

#### FR-REPORT-04: PDF Export *(v2.0)*

- `GET /api/v1/reports/elections/{id}/pdf` — formatted PDF with election info, candidate rankings, participation rate, winner banner

#### FR-REPORT-05: CSV / Excel Export *(v2.0)*

- `GET /api/v1/reports/elections/{id}/csv` — results as UTF-8 CSV
- `GET /api/v1/reports/members/csv` — full member roster export
- `GET /api/v1/reports/subscriptions/excel` — revenue report as .xlsx

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Metric | Requirement |
|---|---|
| API response time (p95) | < 300ms for read endpoints |
| Vote cast endpoint latency | < 500ms including DB write |
| Member directory query (filtered) | < 200ms with proper district + designation indexes |
| Concurrent votes supported | ≥ 500 simultaneous vote submissions without error |
| Dashboard load time | < 1 second with real data |

### 6.2 Reliability

- System uptime: ≥ 99.5% monthly
- Vote data durability: 100% — no votes may be lost due to partial failures
- All vote transactions use DB-level atomic operations; partial writes roll back completely
- Migrations are versioned and reversible

### 6.3 Security

- All passwords hashed with bcrypt (cost factor ≥ 12)
- JWT tokens signed with HS256; secret rotatable
- All endpoints use HTTPS in production (TLS 1.2+)
- Rate limiting: auth endpoints ≤ 10 req/min per IP
- SQL injection prevented via SQLAlchemy parameterized queries
- XSS prevented via React's default escaping
- CORS restricted to known origins in production
- District and designation included in JWT; re-verified at vote time
- No secrets committed to git

### 6.4 Scalability

- Row-level multi-tenancy allows unlimited tenant growth without schema changes
- Stateless API enables horizontal scaling behind a load balancer
- Indexes on `tenant_id`, `district`, `designation_id` for all member queries

### 6.5 Maintainability

- All DB schema changes via numbered Alembic migrations (001–009)
- Repository pattern ensures DB engine is swappable without touching business logic
- API versioned under `/api/v1/` prefix
- Swagger UI at `/docs`; ReDoc at `/redoc`

### 6.6 Usability

- Admin panel loads within 2 seconds
- Member directory filter results update in < 500ms
- All form validation errors displayed inline with descriptive messages
- All destructive actions require explicit confirmation dialogs
- Member mobile app supports offline view of cached elections (vote requires connectivity)

---

## 7. Database Design

### 7.1 Entity Relationship Overview

```
tenants
  ├── 1:N → users (tenant_id)         [members + admins]
  ├── 1:N → designations (tenant_id)
  ├── 1:N → elections (tenant_id)
  │           └── 1:N → election_designation_targets (election_id)
  │           └── 1:N → candidates (election_id, tenant_id)
  │           └── 1:N → votes (election_id, tenant_id)
  ├── 1:N → subscription_plans (tenant_id)
  │           └── 1:N → member_subscriptions (plan_id)
  └── 1:N → audit_logs (tenant_id)

users (members)
  ├── N:1 → designations (designation_id)
  ├── 1:N → member_subscriptions (user_id)
  ├── 1:N → votes (user_id)
  └── 1:N → audit_logs (user_id)

votes
  └── UNIQUE(user_id, election_id)
```

### 7.2 Table Definitions

#### `tenants`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| name | VARCHAR(255) | NOT NULL | Display name |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-safe identifier |
| logo_url | VARCHAR(500) | NULL | |
| primary_color | VARCHAR(7) | DEFAULT '#0051D5' | Hex colour |
| status | ENUM | DEFAULT 'trial' | trial/active/suspended/cancelled |
| plan | ENUM | DEFAULT 'starter' | starter/professional/enterprise |
| max_elections | INT | DEFAULT 5 | Plan limit |
| max_members | INT | DEFAULT 500 | Plan limit (replaces max_voters) |
| max_designations | INT | DEFAULT 10 | Plan limit |
| contact_email | VARCHAR(255) | NULL | |
| default_country | VARCHAR(100) | DEFAULT 'India' | Pre-fill in registration |
| created_by | INT | FK → users.id SET NULL | SuperAdmin who created it |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

#### `designations`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| tenant_id | INT | FK → tenants.id CASCADE, INDEX | |
| title | VARCHAR(100) | NOT NULL | e.g., "Vice President" |
| level | INT | NOT NULL | 1 = highest rank |
| description | TEXT | NULL | |
| color | VARCHAR(7) | NULL | Hex colour for badge display |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |
| UNIQUE | | (tenant_id, title) | |
| UNIQUE | | (tenant_id, level) | |

#### `users` (Members + Admins)
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| tenant_id | INT | FK → tenants.id SET NULL, NULL | NULL = superadmin |
| full_name | VARCHAR(150) | NOT NULL | |
| email | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | |
| phone | VARCHAR(20) | NOT NULL | Required for members |
| hashed_password | VARCHAR(255) | NOT NULL | bcrypt |
| role | ENUM | NOT NULL, DEFAULT 'voter' | superadmin/admin/voter |
| status | ENUM | NOT NULL, DEFAULT 'pending' | active/blocked/pending |
| otp_code | VARCHAR(10) | NULL | Bcrypt-hashed OTP |
| otp_expires_at | DATETIME | NULL | |
| is_verified | BOOLEAN | DEFAULT false | |
| **designation_id** | **INT** | **FK → designations.id SET NULL, NULL** | **NULL for admins/superadmin** |
| **street_address** | **VARCHAR(300)** | **NULL** | **Required for voter role** |
| **city** | **VARCHAR(100)** | **NULL** | |
| **district** | **VARCHAR(100)** | **NULL, INDEX** | **Primary geo-targeting field** |
| **state** | **VARCHAR(100)** | **NULL** | |
| **country** | **VARCHAR(100)** | **DEFAULT 'India'** | |
| **pincode** | **VARCHAR(20)** | **NULL** | |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

> Bold columns are new in v3.0.0. The `district` column is indexed because it is the primary field used in election eligibility queries.

#### `subscription_plans`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| tenant_id | INT | FK → tenants.id CASCADE, INDEX | |
| name | VARCHAR(100) | NOT NULL | e.g., "Annual Membership" |
| amount | DECIMAL(10,2) | NOT NULL | |
| currency | VARCHAR(3) | DEFAULT 'INR' | |
| duration_days | INT | NOT NULL | e.g., 365 for annual |
| description | TEXT | NULL | |
| benefits | JSON | NULL | Array of benefit strings |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

#### `member_subscriptions`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| tenant_id | INT | FK → tenants.id CASCADE, INDEX | |
| user_id | INT | FK → users.id | |
| plan_id | INT | FK → subscription_plans.id | |
| status | ENUM | NOT NULL | pending_payment/active/expired/cancelled |
| amount_paid | DECIMAL(10,2) | NULL | Actual amount paid |
| start_date | DATETIME | NULL | Set on activation |
| end_date | DATETIME | NULL, INDEX | Used for expiry check |
| confirmed_by | INT | FK → users.id SET NULL, NULL | Admin who confirmed |
| confirmed_at | DATETIME | NULL | |
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
| **target_district** | **VARCHAR(100)** | **NULL, INDEX** | **NULL = all districts** |
| **eligible_member_count** | **INT** | **NULL** | **Computed on activation** |
| created_by | INT | FK → users.id SET NULL | |
| created_at | DATETIME | NOT NULL | |
| updated_at | DATETIME | NOT NULL | |

#### `election_designation_targets`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | |
| election_id | INT | FK → elections.id CASCADE, INDEX | |
| designation_id | INT | FK → designations.id CASCADE | |

> This junction table implements the `target_designation_ids` list. If no rows exist for an election, ALL designations are eligible.

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
| action | VARCHAR(100) | NOT NULL | e.g., `vote_cast`, `district_changed` |
| entity_type | VARCHAR(50) | NULL | e.g., `election`, `member` |
| entity_id | INT | NULL | PK of related entity |
| details | TEXT | NULL | JSON string |
| ip_address | VARCHAR(45) | NULL | |
| created_at | DATETIME | NOT NULL | |

### 7.3 Migration History

| # | File | Description |
|---|---|---|
| 001 | `001_initial_schema.py` | Creates users, elections, candidates, votes, audit_logs |
| 002 | `002_seed_admin.py` | Seeds default tenant admin |
| 003 | `003_add_tenants_table.py` | Creates tenants table |
| 004 | `004_add_tenant_id_to_tables.py` | Adds tenant_id FK + index to all tables |
| 005 | `005_update_role_enum_add_superadmin.py` | Adds `superadmin` to users.role enum |
| 006 | `006_seed_superadmin_and_default_tenant.py` | Seeds TechElect tenant + superadmin user |
| **007** | **`007_add_member_address_designation.py`** | **Adds address columns + designation_id to users; creates designations table** |
| **008** | **`008_add_election_geo_targeting.py`** | **Adds target_district, eligible_member_count to elections; creates election_designation_targets table** |
| **009** | **`009_add_subscription_tables.py`** | **Creates subscription_plans and member_subscriptions tables** |

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
| POST | `/auth/register` | None | Member self-registration (with address + designation) |
| POST | `/auth/login` | None | Login, get JWT |
| POST | `/auth/verify-otp` | None | Verify OTP |
| POST | `/auth/refresh-token` | None | Refresh access token |
| GET | `/auth/me` | Required | Get current member profile |

#### Tenants (SuperAdmin only)
| Method | Path | Description |
|---|---|---|
| GET | `/tenants/platform-stats` | Platform-wide statistics |
| GET | `/tenants/` | List all tenants |
| POST | `/tenants/` | Create tenant + first admin |
| GET | `/tenants/{id}` | Get tenant with usage + revenue stats |
| PUT | `/tenants/{id}` | Update tenant settings |
| DELETE | `/tenants/{id}` | Soft-delete tenant |
| POST | `/tenants/{id}/suspend` | Suspend tenant |
| POST | `/tenants/{id}/activate` | Activate tenant |
| GET | `/tenants/{id}/elections` | All elections for tenant |
| GET | `/tenants/{id}/members` | All members for tenant |

#### Designations (Admin)
| Method | Path | Description |
|---|---|---|
| GET | `/designations/` | List all designations (sorted by level) |
| POST | `/designations/` | Create designation |
| PUT | `/designations/{id}` | Update designation |
| DELETE | `/designations/{id}` | Delete designation (if no members assigned) |

#### Members (Admin + Self)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/members/` | Admin | List members (filterable: designation, district, status, subscription) |
| GET | `/members/stats` | Admin | Member statistics breakdown |
| GET | `/members/{id}` | Admin/Self | Member profile |
| PUT | `/members/{id}` | Admin/Self | Update profile (district change requires admin) |
| POST | `/members/{id}/approve` | Admin | Approve pending member |
| POST | `/members/{id}/block` | Admin | Block member |
| POST | `/members/{id}/change-designation` | Admin | Reassign designation |

#### Subscriptions
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/subscriptions/plans/` | Member | List available plans |
| POST | `/subscriptions/plans/` | Admin | Create subscription plan |
| POST | `/subscriptions/enroll` | Member | Enroll in a plan |
| POST | `/subscriptions/{id}/confirm` | Admin | Manually confirm payment |
| GET | `/subscriptions/revenue` | Admin | Revenue dashboard |
| GET | `/subscriptions/my-subscription` | Member | Own subscription status |

#### Elections
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/elections/` | Member | List elections (auto-scoped to member's district/designation) |
| POST | `/elections/` | Admin | Create election with targeting |
| GET | `/elections/{id}` | Member | Get election + scope info |
| PUT | `/elections/{id}` | Admin | Update election (draft) |
| DELETE | `/elections/{id}` | Admin | Delete election (draft) |
| POST | `/elections/{id}/activate` | Admin | Activate + send notifications |
| POST | `/elections/{id}/close` | Admin | Close election |
| GET | `/elections/{id}/eligible-members` | Admin | Preview eligible member list |
| GET | `/elections/stats/overview` | Admin | Election statistics |

#### Candidates
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/candidates/election/{id}` | Member | List candidates (vote_count hidden during active) |
| POST | `/candidates/` | Admin | Add candidate |
| GET | `/candidates/{id}` | Member | Get candidate |
| PUT | `/candidates/{id}` | Admin | Update candidate (draft) |
| DELETE | `/candidates/{id}` | Admin | Delete candidate (draft) |
| GET | `/candidates/results/{election_id}` | Member | Election results (ranked) |

#### Votes
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/votes/cast` | Member | Cast a vote (eligibility enforced) |
| GET | `/votes/my-vote/{election_id}` | Member | Check if voted |
| GET | `/votes/results/{election_id}` | Member | Results with % + participation rate |
| GET | `/votes/live/{election_id}` | Admin | Live vote stats |

#### Reports
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/reports/dashboard` | Admin | Overview stats |
| GET | `/reports/elections/{id}` | Admin | Full election report |
| GET | `/reports/members` | Admin | Member breakdown by district + designation |
| GET | `/reports/subscriptions` | Admin | Subscription revenue report |
| GET | `/reports/audit-logs` | Admin | Audit log (paginated + filtered) |

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
| District in JWT | Included for fast eligibility check |

### 9.2 Authorisation Model

```
superadmin   ──can do──►  everything (platform + all tenants)
    │
admin        ──can do──►  tenant CRUD (own tenant only)
                          manage designations, approve members
                          create/activate elections, view revenue
    │
member/voter ──can do──►  register, view own elections, cast votes
                          view member directory (own tenant)
                          view/renew own subscription
```

### 9.3 Election Eligibility (Defence in Depth)

Geo-targeting and designation matching are enforced at **three independent layers**:

1. **JWT layer**: `district` and `designation_id` embedded in token — fast first check
2. **Service layer**: re-reads member record from DB at vote-cast time — authoritative check
3. **Repository layer**: `get_eligible_members(election_id)` query uses indexed `district` + JOIN on `election_designation_targets` — used for notifications and preview

### 9.4 Data Isolation Guarantees

All tenant-scoped queries enforce isolation at three layers:
1. **Repository**: filters by `tenant_id`
2. **Service**: accepts and validates `tenant_id`
3. **Controller**: extracts `tenant_id` from JWT

Tenant A admin accessing Tenant B's resource returns HTTP 404 (resource appears not to exist — no info leakage).

### 9.5 Input Validation

- All request bodies validated by Pydantic schemas before reaching service layer
- `district` field validated against known district names (configurable lookup list per tenant)
- `designation_id` validated against the tenant's own designation table
- No raw SQL string interpolation; all queries via SQLAlchemy ORM

---

## 10. Tenant Isolation Model

### 10.1 Isolation Strategy

**Row-Level Tenancy** — single database, `tenant_id` FK on all business tables.

**Chosen over alternatives because:**
- Simpler operational model
- Easy to migrate to schema-per-tenant later if needed
- Indexes on `tenant_id` maintain query performance

### 10.2 Superadmin Bypass

SuperAdmin users have `tenant_id = NULL`. Services receiving `tenant_id = None` apply no tenant filter — superadmins see all records globally.

### 10.3 Suspension Enforcement

When a tenant is suspended:
1. `tenants.status = 'suspended'` set in DB
2. Every login: `auth_service.login()` checks tenant status → HTTP 403 if suspended
3. Existing tokens work until expiry (30-minute window)

### 10.4 Geo-Targeting Isolation

- An election's `target_district` is scoped to the tenant's members only
- Even if two tenants share the same district name (e.g., both have "Maharashtra" members), tenant isolation prevents cross-tenant access

### 10.5 Isolation Test Checklist

- [ ] Tenant A admin cannot read Tenant B's elections or members
- [ ] Tenant A member cannot vote in Tenant B's elections
- [ ] A member from District X cannot vote in an election scoped to District Y
- [ ] A member with designation level 5 cannot vote in an election restricted to levels 1–3
- [ ] A member with expired subscription cannot cast a vote
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

### 11.3 Mobile (Member App)

| Component | Technology | Version |
|---|---|---|
| Framework | React Native (Expo) | SDK 51 |
| Language | TypeScript | 5.3+ |
| State | Redux Toolkit | 2.x |
| Navigation | React Navigation (Bottom Tabs) | 6.x |
| HTTP | Axios | 1.6.x |
| Icons | @expo/vector-icons (MaterialIcons) | 14.x |
| Safe Area | react-native-safe-area-context | 4.10.x |

---

## 12. Constraints & Assumptions

### 12.1 Constraints

- The system is **not open to the public** — all member access requires an invitation or a private registration link from the organization admin
- MySQL only for v1; PostgreSQL support not in scope
- OTP delivery is console-logged in development; SendGrid/SES required for production
- Payment gateway integration (for automatic subscription confirmation) is deferred to v2.0; v1.0 uses manual admin confirmation
- PDF/Excel export (FR-REPORT-04, FR-REPORT-05) deferred to v2.0
- Auto-scheduling of elections (auto-activate/close) requires APScheduler/Celery — deferred to v2.0
- Subscription expiry check is a daily background task — not real-time
- Real-time WebSocket push for live results deferred to v2.0; polling at 30s used in v1

### 12.2 Assumptions

- Each member has a unique email address (primary deduplication key)
- **Phone number is mandatory** for members (needed for OTP delivery and push notifications)
- **District is mandatory** for all voter-role users; admins and superadmins do not require district
- **Designation is mandatory** for all voter-role users at registration
- All servers store timestamps in UTC
- Each tenant has at least one admin user at all times
- The `district` field is a free-text string (not a foreign key to a lookup table in v1); district name consistency is the admin's responsibility
- The platform operator (SuperAdmin) is a trusted party with full system access

### 12.3 Dependencies

- MySQL 8.0+ must be provisioned and accessible before running migrations
- `alembic upgrade head` must be run to apply all 9 migrations before starting the API
- Environment variables in `.env` must be configured (see `.env.example`)
- `bcrypt` library must be installed in the Python environment where Alembic migrations run

---

## 13. Glossary

| Term | Definition |
|---|---|
| **Alembic** | Python database migration framework for SQLAlchemy |
| **Atomic transaction** | A DB operation where all steps succeed or all are rolled back |
| **bcrypt** | A password hashing algorithm designed to be computationally expensive |
| **Designation** | A hierarchical rank or role within an organization (e.g., President, Secretary) |
| **District** | A geographic subdivision used for election targeting; stored on the member's profile |
| **Election Scope** | The district + designation criteria that determine which members may vote in an election |
| **Geo-Targeting** | The mechanism by which elections are restricted to members in a specific geographic area |
| **HS256** | HMAC-SHA256 — a symmetric JWT signing algorithm |
| **JWT** | JSON Web Token — a compact, self-contained token for authentication |
| **Member** | A registered, verified, admin-approved, active-subscription organizational member |
| **MVC** | Model-View-Controller — an architectural pattern |
| **ORM** | Object-Relational Mapper — maps Python classes to database tables |
| **OTP** | One-Time Password — a short-lived code for identity verification |
| **Participation Rate** | (total_votes / eligible_member_count) × 100 — measures voter turnout within the election scope |
| **Pydantic** | Python data validation library |
| **Repository pattern** | An abstraction layer between business logic and data access |
| **Row-level tenancy** | Multi-tenancy using `tenant_id` column on shared tables |
| **SaaS** | Software as a Service |
| **SOLID** | Five OOP design principles |
| **SQLAlchemy** | Python SQL toolkit and ORM |
| **Subscription** | A recurring membership fee paid by a member; revenue credited to the organization |
| **Tenant** | An isolated organization (e.g., a political party) using the platform |
| **Uvicorn** | ASGI server for running FastAPI applications |
