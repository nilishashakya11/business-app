# Glow & Go — Business Management Platform

A Fresha-inspired, full-stack, **multi-tenant** platform for appointment-based
businesses (salons, spas, clinics, barbershops). Each business gets its own branded
workspace — its name, logo and locations — on top of a shared platform. Staff run the
daily operational loop (booking, billing, customers, team, inventory) while clients
book themselves online, leave reviews and manage their own accounts. Multi-branch
support, role-based access control, and an analytics dashboard with exportable reports
round it out.

Built with Next.js 15 (App Router), TypeScript, Prisma, PostgreSQL, Tailwind CSS,
and NextAuth.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database & seed](#database--seed)
- [Running with Docker](#running-with-docker)
- [Demo accounts](#demo-accounts)
- [Roles & permissions](#roles--permissions)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Notes & scope](#notes--scope)

---

## Features

**Appointments**
- Day-view calendar with a per-staff column layout and a live-updating time grid
- Booking dialog with multi-service selection (duration and price auto-computed) and
  quick-add of a new client without leaving the flow
- Status tracking (booked → confirmed → arrived → in progress → completed, plus
  cancelled / no-show / waitlist)

**Online booking & client accounts**
- Public self-booking wizard at `/book` — choose a service, team member and time
- Clients sign up at `/client/signup` and get their own portal to book and track visits
- Walk-in clients can be quick-added mid-booking from the staff calendar

**Reviews & ratings**
- Clients rate completed visits, with separate ratings for the staff member and service
- Ratings roll up per staff member and per service

**Customers**
- Directory with search, profiles, loyalty points, notes
- Appointment and invoice history per customer

**Team / Staff**
- Staff profiles tied to user accounts, provisioned with a role and branch
- Job title, commission rate, calendar color, working hours

**Services**
- Categories, duration, price, per-service tax rate (Nepal VAT 13% default)
- Active/inactive toggle

**Billing & POS**
- Point-of-sale screen: build a cart from services/products, apply discounts,
  compute tax, create an invoice
- Invoice detail with payment recording (cash, card, eSewa, Khalti, Fonepay, IME
  Pay, bank transfer, loyalty, complimentary) and outstanding-balance tracking
- Loyalty points awarded on full payment

**Inventory**
- Products with cost/sell price, stock quantity, low-stock threshold
- Stock movements (purchase, sale, adjustment, return, consumption) with audit trail
- Low-stock alerts on the dashboard and inventory list

**Reports & analytics**
- Dashboard: revenue KPIs, 14-day revenue trend, top services, today's schedule
- Reports: date-range filtering, revenue-by-month, payment-method mix, staff
  performance, top services, cancellation rate
- Export to CSV and Excel (`.xlsx`)

**Multi-tenant & multi-branch**
- Each business is an isolated tenant with its own branding (name, logo, tagline)
  shown across the app shell; new businesses self-register at `/register`
- Shared customer database across a business's branches
- Branch/location switcher in the top bar (shown when a business has more than one
  location); data is scoped to the active branch
- Admins can access all branches; other users see only assigned branches

**Platform**
- Role-based access control with fine-grained per-user permission overrides
- Audit log for sensitive mutations
- Light/dark mode, responsive layout, sidebar navigation, toasts, loading skeletons
- Input validation with Zod on every API route

---

## Tech stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | Next.js 15 (App Router, Server Components)         |
| Language   | TypeScript                                         |
| Styling    | Tailwind CSS, shadcn-style Radix UI primitives     |
| Data       | Prisma ORM + PostgreSQL                            |
| Auth       | NextAuth (credentials, JWT sessions) + RBAC        |
| Data layer | React Query (client), Server Components (server)   |
| Charts     | Recharts                                           |
| Exports    | ExcelJS (xlsx), native CSV                         |
| Validation | Zod + React Hook Form                              |

---

## Architecture

- **Server Components** fetch data directly through Prisma and pass typed props to
  client components. Mutations go through **API routes** under `src/app/api`.
- **Auth**: `src/lib/auth.ts` configures NextAuth with a credentials provider.
  Role and effective permissions are baked into the JWT and exposed on the session.
- **RBAC**: `src/lib/rbac.ts` defines permission keys and per-role defaults.
  `src/lib/api-auth.ts` provides `requireAuth` / `requirePermission` guards and a
  consistent error envelope for routes.
- **Branch scoping**: `src/lib/branch.ts` resolves the active branch from a cookie,
  always constrained to branches the user may access. `src/middleware.ts` protects
  authenticated routes.

---

## Getting started

**Prerequisites**: Node.js 20+, a running PostgreSQL 14+ instance (or Docker).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   then edit .env — at minimum set DATABASE_URL and NEXTAUTH_SECRET

# 3. Create the schema and seed demo data
npm run prisma:migrate      # or: npx prisma db push
npm run db:seed

# 4. Start the dev server
npm run dev
```

Open http://localhost:3000 and sign in with a demo account below.

---

## Environment variables

| Variable              | Required | Description                                              |
| --------------------- | -------- | -------------------------------------------------------- |
| `DATABASE_URL`        | yes      | PostgreSQL connection string used by the app             |
| `DIRECT_URL`          | yes      | Direct connection for Prisma migrate (same as above for local) |
| `NEXTAUTH_SECRET`     | yes      | Secret for signing JWT sessions (`openssl rand -base64 32`) |
| `NEXTAUTH_URL`        | yes      | Base URL of the app (e.g. `http://localhost:3000`)       |
| `NEXT_PUBLIC_APP_URL` | no       | Public base URL for client-side use                      |
| `NODE_ENV`            | no       | `development` / `production`                             |

See `.env.example` for a ready-to-copy template.

---

## Database & seed

The Prisma schema lives in `prisma/schema.prisma` and models users, roles,
permissions, branches, staff, services, customers, appointments, invoices,
payments, refunds, inventory, suppliers, memberships, packages, notifications,
and audit logs.

`npm run db:seed` creates two demo tenants to show the platform is multi-business:
**Serenity Spa & Salon** (two locations — Thamel, Jhamsikhel) with users for every
role, staff and working hours, services, customers, client logins, reviews, and ~60
days of appointments, invoices, payments, commissions and stock; plus **Urban Edge
Barbershop**, a second, fully isolated business with its own owner, staff and services
— enough to populate the dashboard and reports out of the box.

> The seed wipes existing data first. Use it only against a development database.

Common Prisma commands:

```bash
npm run prisma:generate   # regenerate the client
npm run prisma:migrate     # create/apply a migration (dev)
npm run prisma:studio      # browse data in Prisma Studio
npm run db:seed            # reseed demo data
```

---

## Running with Docker

A `docker-compose.yml` is included. By default it starts only PostgreSQL, so you can
run the Next.js app on the host:

```bash
docker compose up -d db      # start Postgres on localhost:5432
npm run prisma:migrate && npm run db:seed
npm run dev
```

To run the full stack (app + database) in containers:

```bash
docker compose --profile app up
```

The app container syncs the schema, seeds, and starts the dev server automatically.

---

## Demo accounts

All demo users share the password **`Password123!`**.

**Serenity Spa & Salon** — the primary demo tenant:

| Role        | Email                    | Access                                             |
| ----------- | ------------------------ | -------------------------------------------------- |
| Admin       | `admin@glowandgo.com`    | Full access, all branches, settings                |
| Manager     | `manager@glowandgo.com`  | Bookings, customers, billing, staff, inventory     |
| Team member | `sita@glowandgo.com`     | Own schedule, appointment status, own metrics      |
| Client      | `manisha@client.com`     | Client portal — book online, view visit history    |

Other Serenity team members: `ramesh@`, `puja@`, `nabin@glowandgo.com`; second client `deepak@client.com`.

**Urban Edge Barbershop** — a second tenant that proves data is isolated per business:

| Role   | Email                  | Access                         |
| ------ | ---------------------- | ------------------------------ |
| Owner  | `owner@urbanedge.com`  | Full access to Urban Edge only |
| Barber | `dinesh@urbanedge.com` | Own schedule at Urban Edge     |

New businesses can self-register at **`/register`**; clients can sign up at
**`/client/signup`** and book through the public portal at **`/book`**.

---

## Roles & permissions

Permissions are defined as keys in `src/lib/rbac.ts` and granted per role. A user can
also receive explicit per-user overrides (grant or deny) layered on top of role
defaults.

- **Admin** — everything: all branches, users, settings, reports, payments config.
- **Manager / Receptionist** — appointments, customers, billing & refunds, staff,
  services, inventory, and branch reports.
- **Team member** — view own schedule, update appointment status, view own
  performance, limited profile management.
- **Client** — self-service only: book through the public portal, view their own
  upcoming and past visits, and leave reviews. No access to the staff app.

Server routes enforce permissions via `requirePermission(...)`; the sidebar hides
sections a user can't access; branch access is checked on every scoped query.

---

## Project structure

```
prisma/
  schema.prisma          # data model
  seed.ts                # demo data
src/
  app/
    (app)/               # authenticated staff app (dashboard, calendar, customers, ...)
    (client)/book/       # public online booking wizard
    api/                 # route handlers (REST-ish, Zod-validated)
    login/               # sign-in
    register/            # business onboarding wizard
    client/signup/       # client account signup
    layout.tsx           # root layout + fonts + providers
  components/
    ui/                  # design-system primitives (button, card, dialog, ...)
    shell/               # sidebar, topbar, app shell, branch context
    dashboard/           # stat cards, revenue chart
    reports/             # report charts
  lib/
    auth.ts              # NextAuth config
    rbac.ts              # permission keys + role defaults
    api-auth.ts          # route guards + error handling + audit
    branch.ts            # active-branch resolution
    billing.ts           # invoice/tax calculation
    prisma.ts            # Prisma client singleton
    validations.ts       # Zod schemas
    queries/             # server-side data aggregation (dashboard, reports)
  middleware.ts          # route protection
```

---

## Scripts

| Script                | Purpose                                  |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Start the dev server                     |
| `npm run build`       | Production build (runs `prisma generate`)|
| `npm start`           | Start the production server              |
| `npm run lint`        | ESLint                                   |
| `npm run typecheck`   | TypeScript, no emit                      |
| `npm run test`        | Vitest                                   |
| `npm run db:seed`     | Seed demo data                           |
| `npm run prisma:*`    | Prisma generate / migrate / studio       |

---

## Notes & scope

This is a development-oriented build meant to run locally against your own
PostgreSQL. A few deliberate scope choices:

- **Payment gateways** (eSewa, Khalti, Fonepay, IME Pay) are modeled as payment
  methods and appear in the schema and reports, but no live gateway integration,
  webhooks, or redirect flow is wired up. Payments are recorded directly.
- **Notifications** (SMS/email) are modeled in the schema but not dispatched to an
  external provider.
- **Storage** uses no external provider; image URLs are plain string fields.

These are intentional boundaries for a local dev environment, not missing pieces of
the core workflow. The booking → billing → reporting loop is fully functional.
