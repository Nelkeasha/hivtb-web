# HIV/TB Monitor — Web Dashboard

Desktop web interface for the **HIV/TB Patient Monitoring System** developed for Dream Medical Center, Rwanda. This is the staff-facing side of the platform; patients and CHWs use the Flutter mobile app.

**Author:** IGIHOZO Nelly — MSc Thesis Project, 2026

---

## Overview

The web dashboard gives clinical staff, supervisors, and system administrators a real-time view of patient adherence, CHW activity, alerts, and system health. It communicates exclusively with the Spring Boot backend API (`hivtb-monitoring-system`) via a server-side proxy to avoid CORS.

### Role-based access

| Role | Access |
|------|--------|
| System Admin | Full access — user management, audit logs, system settings |
| Clinical Staff / Facility Provider | Patient registration, referrals, clinical alerts, reports |
| Supervisor | CHW oversight, LTFU tracing, facility analytics |

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| HTTP client | Axios — proxied through Next.js rewrites (no CORS) |
| Charts | Recharts |
| Auth | JWT stored in cookies, role-gated routes |
| Icons | Lucide React |
| Font | Poppins (Google Fonts) |

---

## Pages

```
/login                       Public — JWT login
/                            Redirects to role dashboard
/clinical                    Clinical dashboard (stats, adherence trend, alerts)
/clinical/patients           Patient list
/clinical/patients/[id]      Patient detail
/clinical/patients/register  Register new patient
/clinical/alerts             Clinical alerts
/clinical/referrals          Referral management
/clinical/reports            Clinical reports
/supervisor                  Supervisor dashboard (CHW activity, high-risk patients)
/admin                       Admin dashboard
/admin/users                 User management
/admin/users/create          Create staff account
/admin/settings              System settings (JWT config, FHIR URL, risk thresholds)
/admin/audit                 Audit log viewer
/change-password             Change own password (required on first login)
```

---

## Local development

### Prerequisites

- Node.js 20+
- The Spring Boot backend running on `localhost:8080` (or set `NEXT_PUBLIC_API_URL`)

### Setup

```bash
cd hivtb-web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Default admin credentials (seeded by the backend):

```
email:    admin@hivtb.rw
password: Admin@2026
```

### Environment variables

Create `.env.local` for local overrides:

```env
# Backend URL — used server-side only by the Next.js proxy rewrite.
# All browser requests go to /api/* (same origin); the server forwards them here.
# Defaults to the Render deployment if not set.
NEXT_PUBLIC_API_URL=http://localhost:8080
```

The proxy rewrite in `next.config.ts` ensures the browser never makes a cross-origin request — no CORS configuration needed.

---

## Project structure

```
src/
├── app/
│   ├── (auth)/               Route group — unauthenticated layout
│   ├── (dashboard)/          Route group — authenticated layout with sidebar
│   ├── admin/                Admin pages
│   ├── clinical/             Clinical staff pages
│   ├── supervisor/           Supervisor pages
│   ├── change-password/
│   ├── login/
│   ├── globals.css           Design tokens (Tailwind theme, color palette)
│   └── layout.tsx
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   └── ui/
│       ├── Badge.tsx         Risk badges, status chips
│       ├── Button.tsx
│       ├── Card.tsx
│       └── StatCard.tsx      KPI cards used across all dashboards
└── lib/
    ├── api.ts                Axios instance with JWT interceptor and proxy baseURL
    ├── auth.ts               Cookie helpers — getUserName(), getRole(), etc.
    └── utils.ts              timeAgo(), riskDot(), formatDate()
```

---

## Design system

Matches the Flutter mobile app's design language for cross-platform consistency.

| Token | Value |
|-------|-------|
| Primary | `#006D77` (teal) |
| Background | `#EDF6F9` |
| Surface | `#FFFFFF` |
| Divider | `#DCECF0` |
| Risk — Low | `#27AE60` |
| Risk — Medium | `#F39C12` |
| Risk — High | `#E67E22` |
| Risk — Critical | `#C0392B` |
| Font | Poppins (body), JetBrains Mono (data/numbers) |

---

## Build

```bash
npm run build
npm run start
```

TypeScript and ESLint errors will fail the build — run `npm run lint` before committing.

---

## Deployment

The app is designed to deploy on **Vercel** or any Node.js host. Set `NEXT_PUBLIC_API_URL` to the production backend URL (e.g. `https://hivtb-rw-api.onrender.com`).

The Next.js rewrite proxy forwards all `/api/*` traffic to the backend server-side, so no CORS headers or browser-to-backend direct connections are needed in production either.
