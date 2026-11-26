# Project Roadmap & Architecture Plan (`plan.md`)

## 1. System Overview
A multi-tenant B2B Cloud Accounting & Inventory SaaS built for E-commerce brands and small businesses.
- **User Roles:**
  1. `OWNER`: Sole business owner managing their company's safe, inventory, sales, expenses, and AI assistant.
  2. `PLATFORM_ADMIN`: SaaS founder managing tenant subscriptions and manual payment activations.

## 2. High-Level Architecture

```
Client (Browser)
    │
    ▼
Next.js Middleware (Auth + Tenant Injection + Plan Check)
    │
    ▼
React Server Components ──► Prisma (tenant-scoped queries) ──► PostgreSQL
    │
    ▼
Server Actions (src/actions/) ──► Service Layer (src/services/) ──► prisma.$transaction
    │
    ▼
API Routes (/api/ai/*) ──► AI Service ──► Google Gemini API
```

### Request Lifecycle
1. Browser sends HTTP request.
2. Middleware validates session token, injects `companyId` into session, checks `planStatus`.
3. If `EXPIRED` → redirect to `/expired`.
4. If not onboarded → redirect to `/onboarding`.
5. Server Component queries database (filtered by `companyId`), renders HTML.
6. On form submit → Server Action validates via Zod → delegates to Service → atomic `prisma.$transaction` → `AuditLog.create` → `revalidatePath`.

## 3. Database Schema Design (PostgreSQL + Prisma)
All operational models MUST include `companyId`.

### 3.1 Models

1. **`Company` (Tenant):** `id`, `name`, `currency` (default `"EGP"`), `planStatus` (`TRIAL` | `ACTIVE` | `EXPIRED`), `trialEndsAt`, `createdAt`.
2. **`User`:** `id`, `name`, `email` (unique), `passwordHash`, `role` (`OWNER` | `PLATFORM_ADMIN`), `companyId`. (Relation to Company is One-to-Many for future-proofing, but UI supports one user).
3. **`Safe` (الخزينة):** `id`, `companyId`, `name`, `balance` (Decimal), `isDefault` (Boolean).
4. **`FixedAsset` (الأصول الثابتة):** `id`, `companyId`, `name`, `purchaseValue` (Decimal), `purchaseDate`.
5. **`Product` (المخزن):** `id`, `companyId`, `name`, `stockQuantity` (Int), `averageCostPrice` (Decimal), `sellingPrice` (Decimal).
6. **`PurchaseInvoice` & `PurchaseItem`:** Increases stock, recalculates weighted `averageCostPrice`, deducts from `Safe.balance`, logs to `AuditLog`.
7. **`SalesInvoice` & `SalesItem`:** Deducts stock, freezes `unitCostSnapshot`. If `PAID`, adds to `Safe`. If `PENDING_COLLECTION`, holds in Funds Under Collection.
8. **`GeneralExpense` (المصروفات العامة):** Deducts from `Safe`, reduces Net Profit, logs to `AuditLog`.
9. **`OwnerWithdrawal` (المسحوبات الشخصية):** Deducts from `Safe`, DOES NOT reduce Net Profit, logs to `AuditLog`.
10. **`AuditLog` (سجل الحركات):** `id`, `companyId`, `actionType`, `summary` (Arabic readable text), `amount` (Decimal), `createdAt`.

### 3.2 Enum Definitions

```prisma
enum PlanStatus {
  TRIAL
  ACTIVE
  EXPIRED
}

enum Role {
  OWNER
  PLATFORM_ADMIN
}

enum PaymentStatus {
  PAID
  PENDING_COLLECTION
}

enum ActionType {
  PURCHASE_CREATED
  SALE_CREATED
  SALE_COLLECTED
  EXPENSE_CREATED
  WITHDRAWAL_CREATED
  PRODUCT_ADDED
  PRODUCT_UPDATED
  SAFE_ADJUSTED
  ASSET_ADDED
}
```

### 3.3 Decimal Precision
All monetary fields MUST use `Decimal @db.Decimal(18, 4)`. Never use `Float` — floating-point arithmetic causes compounding rounding errors in accounting systems.

### 3.4 Index Strategy
```prisma
// Every tenant query is filtered by companyId — index it on every business table
@@index([companyId])

// AuditLog chronological queries per tenant
@@index([companyId, createdAt(sort: Desc)])

// User login lookup
@@unique([email])

// Product lookup within a company
@@index([companyId, name])
```

### 3.5 Weighted Average Cost Price Formula
When a new purchase arrives, recalculate atomically inside `prisma.$transaction`:
```
New Avg Cost = ((Old Qty × Old Avg Cost) + (New Qty × New Unit Cost)) / (Old Qty + New Qty)
```

### 3.6 COGS Snapshot Strategy
When a `SalesItem` is created, `unitCostSnapshot` captures the **current** `averageCostPrice` at sale time. Historical profit calculations remain accurate even if supplier prices change later.

## 4. Multi-Tenancy Architecture

### Strategy: Shared Database, Row-Level Isolation
Single shared PostgreSQL database with `companyId` as the tenant discriminator on every business table.

### Tenant Isolation Enforcement (3 Layers)
1. **Middleware Layer:** Every authenticated request injects `companyId` into the session object. No downstream code can override it.
2. **Service Layer:** Every Prisma query receives `companyId` from the session. Utility helper: `tenantWhere(session)` → `{ companyId: session.user.companyId }`.
3. **Database Layer (Future):** PostgreSQL Row-Level Security policies as defense-in-depth (not required for MVP).

### Session Shape
```typescript
interface SessionUser {
  id:        string;
  name:      string;
  email:     string;
  role:      "OWNER" | "PLATFORM_ADMIN";
  companyId: string;  // injected by middleware, NEVER null for OWNER
}
```

## 5. Authentication & Authorization

### Two-Phase Strategy
- **Phase 1:** Email/Password authentication using Auth.js and bcrypt (cost factor 12).
- **Phase 6:** Google OAuth added as a secondary provider.

### Middleware Guard Chain (execution order)
1. Is the route public? (`/login`, `/register`, `/`) → pass through.
2. Is the user authenticated? → if not, redirect to `/login`.
3. Is the user an `OWNER`? → inject `companyId` into session.
4. Is the user a `PLATFORM_ADMIN` hitting `/admin`? → allow.
5. Is `planStatus === "EXPIRED"`? → redirect to `/expired`.
6. Has the user completed onboarding? → if not, redirect to `/onboarding`.

### Route Protection Matrix

| Route | Public | OWNER | PLATFORM_ADMIN | Requires Active Plan |
|---|:---:|:---:|:---:|:---:|
| `/` | ✅ | — | — | — |
| `/login`, `/register` | ✅ | — | — | — |
| `/onboarding` | — | ✅ | — | — |
| `/dashboard` | — | ✅ | — | ✅ |
| `/inventory` | — | ✅ | — | ✅ |
| `/purchases` | — | ✅ | — | ✅ |
| `/sales` | — | ✅ | — | ✅ |
| `/expenses` | — | ✅ | — | ✅ |
| `/withdrawals` | — | ✅ | — | ✅ |
| `/audit-logs` | — | ✅ | — | ✅ |
| `/settings` | — | ✅ | — | ✅ |
| `/admin` | — | — | ✅ | — |

## 6. Application Routes (App Router Structure)
- `/` — Landing page.
- `/login` & `/register` — Owner authentication.
- `/onboarding` — 3-step setup: 1. Company Name & Safe Balance -> 2. Fixed Assets -> 3. Initial Products.
- `/dashboard` — Main Overview:
  - **5 Primary Cards:** Cashbox, Inventory Value, Fixed Assets, General Expenses, Net Profit.
  - **Secondary Strip:** Funds Under Collection & Owner Withdrawals.
  - **AI Smart Entry Bar:** With `confirm_before_execute` preview.
  - **Recent 10 Transactions:** Fetched from `AuditLog`.
- `/inventory` — Products table, add/edit, low-stock badges.
- `/purchases` — Purchase invoices list & New Purchase form.
- `/sales` — Sales invoices list (PAID vs PENDING_COLLECTION), 1-click "Settle COD", and New Sale form.
- `/expenses` — General expenses log & quick add.
- `/withdrawals` — Owner withdrawals log & form.
- `/audit-logs` — Full read-only chronological archive of all financial/stock mutations.
- `/settings` — Manage Company, Safes, and Data Export.
- `/admin` — Isolated portal to view companies and activate subscriptions.

## 7. Directory Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx              ← RTL shell: Sidebar + Header
│   │   ├── dashboard/page.tsx
│   │   ├── inventory/page.tsx
│   │   ├── purchases/
│   │   │   ├── page.tsx            ← List view
│   │   │   └── new/page.tsx        ← Create form
│   │   ├── sales/
│   │   │   ├── page.tsx
│   │   │   └── new/page.tsx
│   │   ├── expenses/page.tsx
│   │   ├── withdrawals/page.tsx
│   │   ├── audit-logs/page.tsx
│   │   └── settings/page.tsx
│   ├── admin/page.tsx              ← Isolated PLATFORM_ADMIN portal
│   ├── onboarding/page.tsx
│   ├── api/ai/parse-entry/route.ts
│   ├── layout.tsx                  ← Root layout (fonts, dir="rtl")
│   └── page.tsx                    ← Landing page
├── components/
│   ├── ui/                         ← Shadcn primitives
│   ├── layout/                     ← Sidebar, Header, MobileNav
│   ├── dashboard/                  ← KpiCard, SecondaryStrip, RecentTransactions, SmartEntryBar
│   ├── forms/                      ← PurchaseForm, SaleForm, ExpenseForm, WithdrawalForm
│   └── shared/                     ← DataTable, CurrencyDisplay, EmptyState, ConfirmDialog
├── actions/                        ← Server Actions (auth, onboarding, inventory, etc.)
├── services/
│   ├── accounting.service.ts       ← Core financial transaction logic
│   ├── inventory.service.ts        ← Stock & cost price calculations
│   ├── audit.service.ts            ← Immutable audit log writer
│   └── ai.service.ts               ← Gemini API integration
├── lib/
│   ├── prisma.ts                   ← Singleton Prisma client
│   ├── auth.ts                     ← Auth.js configuration
│   ├── validations/                ← Zod schemas (purchase, sale, expense, product)
│   └── utils.ts                    ← formatCurrency, tenantWhere, etc.
├── types/index.ts                  ← Shared TypeScript interfaces
└── middleware.ts                   ← Auth + tenant + plan check
```

## 8. Core Accounting Engine

### Transaction Atomicity
Every financial operation MUST be wrapped in `prisma.$transaction` to ensure all-or-nothing consistency:
1. Create the invoice/record.
2. Update affected balances (Safe, Product stock/cost).
3. Write immutable `AuditLog` entry.

If any step fails, everything rolls back.

### Financial Operations Matrix

| Operation | Safe Impact | Stock Impact | Net Profit Impact | Audit Log |
|---|---|---|---|---|
| **Purchase** | ⬇️ Deducts | ⬆️ Increases qty + recalc avg cost | — (cost deferred to COGS) | ✅ Arabic |
| **Sale (PAID)** | ⬆️ Adds revenue | ⬇️ Decreases qty | ⬆️ Revenue - COGS - Direct Cost | ✅ Arabic |
| **Sale (PENDING)** | — | ⬇️ Decreases qty | ⬆️ Revenue - COGS - Direct Cost | ✅ Arabic |
| **Settle COD** | ⬆️ Adds collected | — | — (already counted) | ✅ Arabic |
| **General Expense** | ⬇️ Deducts | — | ⬇️ Reduces | ✅ Arabic |
| **Owner Withdrawal** | ⬇️ Deducts | — | — (personal, not expense) | ✅ Arabic |

### Net Profit Formula
```
Net Profit = Σ Sales Revenue − Σ COGS − Σ Direct Costs − Σ General Expenses
```
- Sales Revenue = Σ(SalesItem.unitPrice × SalesItem.quantity)
- COGS = Σ(SalesItem.unitCostSnapshot × SalesItem.quantity)
- Direct Costs = Σ(SalesInvoice.directCost)
- General Expenses = Σ(GeneralExpense.amount)

**Owner Withdrawals are EXCLUDED from Net Profit** — they are equity draws, not business expenses.

### Dashboard KPI Queries
```sql
-- Cashbox: sum of all safe balances
SELECT SUM(balance) FROM "Safe" WHERE "companyId" = $1;

-- Inventory valuation
SELECT SUM("stockQuantity" * "averageCostPrice") FROM "Product" WHERE "companyId" = $1;

-- Recent 10 transactions
SELECT * FROM "AuditLog" WHERE "companyId" = $1 ORDER BY "createdAt" DESC LIMIT 10;
```

## 9. Server Actions Pattern

Every mutation follows this pipeline:
```
1. Authenticate → auth() → session.user.companyId
2. Validate    → Zod schema.parse(input)
3. Delegate    → service.method({ ...validated, companyId })
4. Revalidate  → revalidatePath("/affected-routes")
5. Return      → { success: true } or { success: false, error: "Arabic message" }
```

## 10. Error Handling

### Typed Business Errors
```typescript
class InsufficientBalanceError extends Error { name = "InsufficientBalanceError"; }
class InsufficientStockError extends Error { name = "InsufficientStockError"; }
```

### Server Action Error Pattern
- Catch known business errors → return user-friendly Arabic message.
- Catch unknown errors → log to console, return generic `"حدث خطأ غير متوقع. حاول مرة أخرى."`.
- Never expose stack traces or internal details to the client.

## 11. Subscription & Billing Model

### Plan Lifecycle
```
TRIAL (14 days) ──► EXPIRED (middleware blocks all routes)
                      │
TRIAL ──► ACTIVE (admin activates) ──► EXPIRED (subscription lapses)
EXPIRED ──► ACTIVE (admin re-activates)
```

### Manual Activation Flow
1. User registers → gets `TRIAL` (14 days).
2. User pays via bank transfer / Vodafone Cash / InstaPay.
3. `PLATFORM_ADMIN` opens `/admin` → finds company → clicks "Activate".
4. `planStatus` → `ACTIVE`.

### Expired State Behavior
- Middleware redirects all protected routes to `/expired`.
- No data is deleted — preserved for reactivation.
- API calls return `403` with clear Arabic message.

## 12. Security Architecture

### Defense Layers
1. **Transport:** HTTPS everywhere, HSTS headers.
2. **Authentication:** Auth.js sessions, bcrypt (cost 12), CSRF via Server Actions.
3. **Authorization:** Middleware role check (OWNER vs PLATFORM_ADMIN), `companyId` from verified session only.
4. **Input Validation:** Zod on every Server Action, Prisma parameterized queries (no SQL injection).
5. **Tenant Isolation:** `companyId` filter on every query, enforced in service layer.
6. **Financial Integrity:** Atomic transactions, immutable audit log (append-only), Decimal types.
7. **AI Safety:** `confirm_before_execute` — AI never writes to DB directly. Rate limiting on AI endpoint.

## 13. Phased Execution Roadmap

### Phase 0: Project Initialization, Git & CI/CD
- Initialize Next.js (App Router, TypeScript, Tailwind CSS) in `C:\SaaS`.
- Install Shadcn UI, Prisma, Zod, NextAuth, and `@google/genai`.
- Initialize Git (`main` and `dev` branches) and create `.github/workflows/ci.yml` for `npx tsc --noEmit` validation.

### Phase 1: Database & Email Authentication Foundation
- Write `prisma/schema.prisma` matching Section 3 and push to PostgreSQL.
- Implement Email/Password Owner auth (`/login`, `/register`) using Auth.js.
- Protect routes with middleware ensuring `companyId` session injection.

### Phase 2: Onboarding & Design System Setup
- Build Arabic RTL layout shell (Sidebar + Header).
- Build the `/onboarding` wizard to initialize Company, Safe, and first Products.

### Phase 3: Core Financial & Inventory Modules
- Implement `src/services/accounting.service.ts` with atomic `prisma.$transaction` helpers.
- Build pages/forms for `/inventory`, `/purchases`, `/sales`, `/expenses`, `/withdrawals`, and `/audit-logs`.

### Phase 4: Main Dashboard (5 KPI Cards + Secondary Strip)
- Build `/dashboard` aggregating Safe balances, Inventory valuation, Fixed Assets, General Expenses, Net Profit, and Funds Under Collection.
- Embed the "Recent 10 Transactions" table fetching from `AuditLog`.

### Phase 5: AI Smart Entry Assistant (Gemini 2.5 Flash)
- Build `/api/ai/parse-entry` using Structured JSON Schema output.
- Build the Preview & Confirm UI card on `/dashboard` (No database writes without explicit user confirmation).

### Phase 6: Google OAuth, Subscriptions & Export
- Add Google OAuth provider to Auth.js `/login`.
- Add `planStatus` middleware lock (`TRIAL` -> `EXPIRED`).
- Build `/admin` dashboard to activate subscriptions.
- Add 1-click Excel export in `/settings`.

## 14. Performance Considerations

- **Server Components:** Pages render on the server — no client-side data fetching waterfalls.
- **Streaming:** `loading.tsx` for instant shell → progressive data hydration.
- **Connection Pooling:** Prisma with PgBouncer or Prisma Accelerate for serverless environments.
- **Minimal Client JS:** Only interactive components (forms, AI bar) are Client Components.
- **revalidatePath:** Surgical cache invalidation after mutations — no full page reloads.
- **DB Aggregations:** All financial calculations (`SUM`, `GROUP BY`) done in PostgreSQL, not in JS.

## 15. Deployment Architecture

### Environment Variables
```bash
DATABASE_URL="postgresql://user:pass@host:5432/saas?schema=public"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="random-32-char-secret"
GOOGLE_CLIENT_ID="..."           # Phase 6
GOOGLE_CLIENT_SECRET="..."       # Phase 6
GOOGLE_GEMINI_API_KEY="..."      # Phase 5
TRIAL_DURATION_DAYS="14"
DEFAULT_CURRENCY="EGP"
```

### CI/CD Pipeline
```
Git Push (dev) → GitHub Actions → npx tsc --noEmit → ESLint → next build → Deploy Staging → Merge to main → Production
```


## 14. Performance Considerations

- **Server Components:** Pages render on the server — no client-side data fetching waterfalls.
- **Streaming:** `loading.tsx` for instant shell → progressive data hydration.
- **Connection Pooling:** Prisma with PgBouncer or Prisma Accelerate for serverless environments.
- **Minimal Client JS:** Only interactive components (forms, AI bar) are Client Components.
- **revalidatePath:** Surgical cache invalidation after mutations — no full page reloads.
- **DB Aggregations:** All financial calculations (`SUM`, `GROUP BY`) done in PostgreSQL, not in JS.

## 15. Deployment Architecture

### Environment Variables
```bash
DATABASE_URL="postgresql://user:pass@host:5432/saas?schema=public"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="random-32-char-secret"
GOOGLE_CLIENT_ID="..."           # Phase 6
GOOGLE_CLIENT_SECRET="..."       # Phase 6
GOOGLE_GEMINI_API_KEY="..."      # Phase 5
TRIAL_DURATION_DAYS="14"
DEFAULT_CURRENCY="EGP"
```

### CI/CD Pipeline
```
Git Push (dev) → GitHub Actions → npx tsc --noEmit → ESLint → next build → Deploy Staging → Merge to main → Production
```