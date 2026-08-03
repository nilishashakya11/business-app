# Glow & Go — Project Summary

## What This Is

A full-stack business management platform for appointment-based businesses (salons, spas, clinics), inspired by Fresha Partner. Built with Next.js 15, Prisma 5 + PostgreSQL, NextAuth v4, Tailwind CSS, and Radix UI.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, server components) |
| Database ORM | Prisma 5.22 with PostgreSQL |
| Auth | NextAuth v4, JWT strategy, CredentialsProvider |
| UI primitives | Radix UI + shadcn-style components |
| Styling | Tailwind CSS — zinc base, emerald accent |
| Forms | React Hook Form + Zod |
| Data fetching | TanStack Query (client), server components (server) |
| Charts | Recharts |
| Fonts | Self-hosted woff2 (Plus Jakarta Sans, Outfit, JetBrains Mono) |
| Export | ExcelJS (xlsx), native CSV |

---

## Modules Built

### 1. Auth & RBAC
- CredentialsProvider login with bcrypt password hashing
- JWT session with role + permissions array
- RBAC via `PERMISSIONS` const and `ROLE_PERMISSIONS` map (`src/lib/rbac.ts`)
- Roles: `ADMIN`, `MANAGER`, `STAFF`
- Middleware protects all `/app` routes

### 2. Dashboard
- Revenue KPIs: today, this week, this month
- Appointment count and upcoming list
- Revenue trend chart (Recharts AreaChart)
- Low-stock alerts

### 3. Customers
- Directory with search
- Customer profile page (visit history, loyalty points, invoices)
- CRUD via dedicated pages: `/customers/new`, `/customers/[id]/edit`
- API: `GET/POST /api/customers`, `GET/PATCH/DELETE /api/customers/[id]`

### 4. Services
- Service list grouped by category
- Category management (`/api/service-categories`)
- CRUD via dedicated pages: `/services/new`, `/services/[id]/edit`
- Fields: name, category, duration, price, tax rate, active toggle

### 5. Staff
- Staff directory with role badges
- User provisioning (creates User + Staff records together)
- CRUD via dedicated pages: `/staff/new`, `/staff/[id]/edit`
- Fields: name, email, password, role, color, commission rate

### 6. Appointment Calendar
- Day-view calendar (8am–9pm, 64px/hour)
- Click hour slot → navigate to `/calendar/new?start=...`
- Click appointment → navigate to `/calendar/[id]/edit`
- Status badges (PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)
- Staff-scoped view for non-admin roles
- API: `GET/POST /api/appointments`, `PATCH /api/appointments/[id]`, `PATCH /api/appointments/[id]/status`

### 7. Billing / POS
- POS cart UI (`/billing/new`): catalog search, line items with qty/price/discount/tax, invoice-level discount, customer selector, live totals
- Invoice list (`/billing`) with status badges
- Invoice detail (`/billing/[id]`): line items, totals breakdown, payment history
- Payment panel: take partial or full payment, multiple methods (Cash, Card, eSewa, Khalti, Fonepay, IME Pay, Bank Transfer, Complimentary)
- Loyalty points awarded on full payment
- Shared billing math in `src/lib/billing.ts` (computeLine, computeInvoice, round2) — used by both API and client so totals always match
- API: `GET/POST /api/invoices`, `POST /api/payments`

### 8. Inventory
- Product list with low-stock highlighting
- Stock adjustment dialog (inline)
- CRUD via dedicated pages: `/inventory/new`, `/inventory/[id]/edit`
- Fields: name, SKU, category, supplier, cost price, sell price, quantity, unit, low-stock level
- API: `GET/POST /api/products`, `GET/PATCH/DELETE /api/products/[id]`, `POST /api/products/[id]/stock`

### 9. Reports
- Date-range revenue chart (AreaChart)
- Top services and top staff tables
- Export to CSV or Excel (ExcelJS)
- API: `GET /api/reports/export?format=csv|xlsx&from=ISO&to=ISO`

### 10. Settings
- Profile: update name, email, password
- Business: name, currency, timezone, logo
- Branch management: create/edit branches, set active branch
- Active branch stored in cookie, resolved server-side via `resolveActiveBranch()`

---

## Key Architecture Patterns

- **Page-based CRUD** — all create/edit flows use dedicated URL routes (`/module/new`, `/module/[id]/edit`), not dialogs. Improves URL shareability and browser back-button behaviour.
- **`handle()` wrapper** — all API routes use a `handle()` HOF that catches errors and returns consistent JSON error responses.
- **`requireAuth` / `requirePermission`** — server-side auth helpers used in both API routes and server page components.
- **`resolveActiveBranch()`** — reads the active branch from cookie, validates the user has access, returns `branchId`.
- **`apiFetch<T>`** — thin client wrapper around `fetch` that throws on non-2xx with the server's error message.
- **`FormPageShell`** — shared shell component for all create/edit pages (back link, title, card wrapper).
- **`generateDocNumber("INV")`** — generates sequential invoice numbers like `INV-000042`.

---

## Database Models (Prisma)

`User`, `Staff`, `Branch`, `Business`, `Customer`, `Service`, `ServiceCategory`, `Appointment`, `AppointmentService`, `Invoice`, `InvoiceItem`, `Payment`, `Product`, `Supplier`, `LoyaltyTransaction`

---

## Commit Logsheet

| Date | Hash | Description |
|---|---|---|
| 2026-06-26 | 0cb8877 | Set up Next.js project scaffold and tooling config |
| 2026-06-28 | 80661bd | Add Prisma data model and demo seed script |
| 2026-07-01 | 5442b8c | Add authentication, RBAC and login flow |
| 2026-07-04 | 1db7aa8 | Build design system primitives and authenticated app shell |
| 2026-07-07 | 7f1ab6b | Build dashboard with revenue analytics and KPIs |
| 2026-07-09 | 3905a31 | Add customers module with directory, profiles and CRUD API |
| 2026-07-11 | 3d68152 | Add services module with category grouping and CRUD |
| 2026-07-13 | 0fb31a3 | Add staff module with user provisioning and profiles |
| 2026-07-13 | bd1743f | Add README file |
| 2026-07-16 | 4e59855 | Add appointment calendar with day view and booking |
| 2026-07-17 | b57262a | Fix calendar crash from invalid Intl.DateTimeFormat options |
| 2026-07-18 | 0ab8c9e | Add billing with POS, invoices and payments |
| 2026-07-19 | e0b9b98 | Add inventory with products, stock tracking and low-stock alerts |
| 2026-07-19 | 2cc3d1b | Make dialog footer sticky on scrollable dialogs |
| 2026-07-20 | 28967d6 | Add reports module with analytics charts and CSV/Excel export |
| 2026-07-21 | 96e9146 | Add settings for profile, business and branch management |
| 2026-07-22 | 10360e5 | Write comprehensive project README and setup docs |
| 2026-07-23 | cf94a59 | Migrate CRUD from dialogs to dedicated pages |
| 2026-07-24 | 36ae7c9 | Move appointment booking from dialog to dedicated pages |
| 2026-07-25 | b6142a4 | Self-host fonts to remove Google Fonts build dependency |

---

## Current State

- All 10 modules complete and committed
- TypeScript: clean (`tsc --noEmit` exit 0)
- Production build: passing (`next build` exit 0)
- Fonts: self-hosted — build works offline/air-gapped

---

## What Could Come Next

These are potential future additions, not yet built:

### Near-term
- **Appointment booking page** — `/calendar/new` and `/calendar/[id]/edit` pages exist as stubs; the full form (service picker, staff picker, time picker, notes) needs building out
- **Customer portal** — read-only view for customers to see their own appointments and invoices
- **SMS / email reminders** — appointment reminder notifications via Twilio or similar
- **Recurring appointments** — weekly/fortnightly repeat booking support

### Medium-term
- **Multi-location reporting** — aggregate reports across all branches for admin
- **Staff scheduling / shifts** — define working hours per staff per day, block off unavailable slots on calendar
- **Online booking widget** — embeddable public-facing booking form
- **Waitlist** — allow customers to join a waitlist when a slot is full

### Longer-term
- **Payment gateway** — integrate eSewa / Khalti / Stripe for online payments (currently only manual payment recording)
- **Inventory purchase orders** — raise POs to suppliers, receive stock, track COGS
- **Payroll / commission reports** — calculate staff earnings based on commission rates
- **Mobile app** — React Native or PWA for staff to manage appointments on the go
