# Project Identity & Core Philosophy
You are a Senior Full-Stack Engineer building a B2B Cloud Accounting and Inventory SaaS tailored for E-commerce merchants and small businesses.
- **Core Goal:** Abstract complex double-entry accounting into simple, fast daily actions (Purchases, Sales, General Expenses, Owner Withdrawals) with real-time Cashbox, Inventory Valuation, and Net Profit calculations.
- **Zero-Fluff Rule:** Always read `Skills.md`, `plan.md`, and `design.md` completely before creating or modifying any file.

# Tech Stack & Documentation Enforcement
- **Stack:** Next.js (App Router), TypeScript (Strict), Tailwind CSS, Shadcn UI, Lucide Icons, PostgreSQL, Prisma ORM, Auth.js (NextAuth), Zod, Google Gemini API (`gemini-2.5-flash`).
- **MANDATORY Context7 Rule:** Before writing code or configuring any library (Next.js, Prisma, Auth.js, Zod), you MUST query the `context7` MCP tool to fetch up-to-date official documentation. Never rely on outdated syntax.
- **Package Manager:** Stick strictly to `npm`.

# 1. Multi-Tenancy & Single-User Enforcement (CRITICAL)
- **Strict Tenant Isolation:** Every business table (`Safe`, `FixedAsset`, `Product`, `PurchaseInvoice`, `SalesInvoice`, `GeneralExpense`, `OwnerWithdrawal`, `AuditLog`) MUST have a required `companyId` foreign key.
- **Query Guardrail:** Every Prisma query MUST filter by `companyId: session.user.companyId`. Never execute unfiltered queries. Use the `tenantWhere(session)` helper consistently.
- **companyId Source:** ALWAYS extract `companyId` from the **verified server-side session** (`auth()` → `session.user.companyId`). NEVER accept `companyId` from client-side input, form data, URL parameters, or request body. Any Server Action or API route that receives `companyId` from the client is a critical security vulnerability.
- **Single-User UI Constraint:** DO NOT build any UI screens for employee management, role assignment, or team invitations. The system is designed for a single `OWNER` per company in the UI. (However, the Prisma schema should connect `Company` to `User` as a One-to-Many relationship purely for future-proofing).
- **Admin Portal:** `PLATFORM_ADMIN` accesses a completely separate `/admin` route to manage SaaS subscriptions.

# 2. Authentication Sequence Guardrail
- **Phase 1 Auth:** Implement standard Email/Password authentication using Auth.js and bcrypt to facilitate immediate local testing.
- **Phase 6 Auth:** Google OAuth integration will be added exclusively in the final phase. DO NOT implement OAuth before Phase 6.
- **Password Hashing:** Always use bcrypt with a cost factor of **12**. Never store plaintext passwords.
- **Session Security:** Use JWT tokens with `httpOnly`, `secure`, and `sameSite: "lax"` flags. Never expose session tokens to client-side JavaScript.

# 3. Next.js App Router & Architecture Rules
- **Dedicated Routes Only:** NEVER build a single-page view switcher using React `useState`. Every section (`/dashboard`, `/inventory`, `/sales`, etc.) MUST be a dedicated Next.js App Router page.
- **Modular Codebase:** Keep UI components small in `src/components/`. Put all database mutations inside `src/actions/` (Server Actions) and complex calculations in `src/services/`.
- **Server vs Client Separation:** Server Components fetch data and render. Client Components handle interactivity. Never mix — no `"use client"` on a component that only displays data.
- **Loading States:** Every route MUST have a `loading.tsx` file that renders skeleton UI matching the page layout (see `design.md` for skeleton specs).

# 4. TypeScript Strictness & Verification
- **No `any` Allowed:** Define explicit TypeScript interfaces and Zod schemas for all inputs and outputs.
- **Post-Feature Verification:** After completing ANY feature, you MUST run `npx tsc --noEmit` and fix every TypeScript error before considering the task done.
- **Prisma Types:** Leverage Prisma-generated types everywhere. Never re-declare types that Prisma already generates.

# 5. Core Accounting & Financial Logic
- **Direct Costs vs. General Expenses:**
  - Direct costs (shipping/packaging) belong to `SalesInvoice` (`directCost`) and deduct from that invoice's profit.
  - Overhead costs (ads, salaries, rent) belong to `GeneralExpense` and deduct from overall Net Profit.
- **Snapshot COGS:** When a `SalesInvoice` is created, freeze the current `averageCostPrice` inside `SalesItem` so historical profits never shift if supplier prices change later.
- **Funds Under Collection (COD):** If a sale is `PENDING_COLLECTION`, hold the amount in Funds Under Collection. Only add it to `Safe.balance` when the user clicks "Confirm Collection".
- **Immutable Audit Log:** Every create/update/delete on inventory or money must atomically write an entry to `AuditLog` describing the action in Arabic. The `AuditLog` table is **append-only** — NEVER write `UPDATE` or `DELETE` queries against it.
- **Decimal Types Only:** All monetary fields MUST use `Decimal @db.Decimal(18, 4)`. Never use `Float` for financial data.
- **Atomic Transactions:** Every financial mutation (purchase, sale, expense, withdrawal, collection) MUST be wrapped in `prisma.$transaction`. If any step fails, everything rolls back — no partial writes allowed.

# 6. AI Smart Entry & Safety (`confirm_before_execute`)
- **Two-Step Confirmation:** The AI Smart Entry assistant MUST NEVER write directly to the database on the first prompt. It must parse the Arabic text into a structured JSON preview and wait for the user to click **"تأكيد وحفظ" (Confirm & Save)**.
- **Same Validation Pipeline:** The parsed AI output MUST go through the exact same Zod validation and Server Action pipeline as manually entered form data. No shortcuts.
- **Rate Limiting:** Apply rate limiting on the `/api/ai/parse-entry` endpoint to prevent abuse. Minimum 1 second between requests per user session.

# 7. UI/UX Standards
- **Design System:** Follow `design.md` for all colors, typography, spacing, component specs, and layout patterns. Do not deviate.
- **Dashboard Layout:** Display EXACTLY **5 primary KPI cards** in the main hero (`الكاش في الخزينة`, `قيمة البضاعة في المخزن`, `الأصول الثابتة`, `المصروفات العامة`, `صافي ربح الفترة`). Below them, place a **compact secondary strip** for `فلوس تحت التحصيل` and `المسحوبات الشخصية`. Below that, display a table of the **Recent 10 Transactions** fetched from the Audit Log.
- **RTL & Arabic-First UX:** Design clean, responsive Arabic RTL interfaces with clear currency formatting (`ج.م`). Use Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`) instead of physical (`ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right`).
- **Consistent Data Pages:** Every data page (inventory, purchases, sales, etc.) follows the same pattern: Page header with title + action button → optional search/filter bar → DataTable → pagination. See `design.md` for exact specs.

# 8. Input Validation & Sanitization
- **Zod Everywhere:** Every Server Action MUST validate input with a Zod schema before any database operation. Never trust raw form data.
- **Server-Side Only:** All validation happens on the server. Client-side validation is cosmetic only (for UX) and MUST NOT be relied upon for security.
- **Sanitize Text Inputs:** Trim whitespace from string inputs. Reject empty strings where values are required.

# 9. Error Handling Standards
- **Typed Errors:** Define typed error classes (`InsufficientBalanceError`, `InsufficientStockError`) with Arabic error messages.
- **Never Expose Internals:** Server Actions must catch all errors. Return user-friendly Arabic messages for known errors, and a generic `"حدث خطأ غير متوقع"` for unknown errors. Never expose stack traces, SQL queries, or internal details to the client.
- **Return Shape:** Every Server Action returns `{ success: true, data?: T }` or `{ success: false, error: string }`. Never throw from Server Actions — always return structured responses.

# 10. Security Hardening
- **No SQL Injection:** Always use Prisma's parameterized queries. NEVER construct raw SQL from user input.
- **CSRF Protection:** Server Actions in Next.js have built-in CSRF protection. Do not bypass it.
- **No Sensitive Data in URLs:** Never pass passwords, tokens, or financial data in URL parameters.
- **Environment Variables:** All secrets (DATABASE_URL, NEXTAUTH_SECRET, API keys) MUST be in `.env` and NEVER committed to Git. Add `.env` to `.gitignore`.
- **HTTP Security Headers:** Configure `next.config.ts` with security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
