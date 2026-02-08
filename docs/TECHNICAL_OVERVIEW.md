# ERP System - Technical Overview

**Document Version:** 1.0  
**Last Updated:** 2026-02-07  
**System Version:** Phase 14 Complete (Production Ready)

---

## 1. Project Overview

### Purpose
Full-stack Enterprise Resource Planning (ERP) system designed for steel trading and manufacturing companies. Handles end-to-end business operations from sales enquiries through procurement, inventory management, quality control, dispatch, invoicing, and financial reconciliation.

### Problem Solved
- **Manual Process Elimination**: Replaces Excel-based tracking with automated workflows
- **ISO 9001:2018 Compliance**: Built-in audit trails, traceability, and quality management
- **Multi-Company Operations**: Supports multiple legal entities with separate GSTINs
- **Real-time Inventory**: FIFO-based stock allocation with heat number tracking
- **Financial Control**: Automated payment allocation, aging analysis, and ledger management

### Target Users
- **Sales Team**: Enquiry management, quotation generation, order tracking
- **Purchase Team**: Vendor management, PO creation, GRN processing
- **Quality Team**: Inspection workflows, NCR management, MTC verification
- **Warehouse Team**: Inventory tracking, dispatch planning, stock reports
- **Finance Team**: Invoice generation, payment receipts, reconciliation
- **Management**: Dashboard KPIs, MIS reports, audit logs

### Tech Stack

#### Frontend
- **Framework**: Next.js 15.5.7 (App Router)
- **Runtime**: React 19.0.0
- **Language**: TypeScript 5
- **UI Library**: Radix UI (headless components)
- **Styling**: Tailwind CSS 4 + custom glassmorphism design
- **State Management**: Zustand 5.0.10 (UI state only, business data via APIs)
- **Form Handling**: React Hook Form 7.60.0 + Zod 4.1.12 validation
- **Charts**: Recharts 3.0.2
- **PDF Generation**: @react-pdf/renderer 4.3.2
- **Animations**: Framer Motion 12.23.24

#### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **Database**: PostgreSQL (Supabase hosted)
- **ORM**: Drizzle ORM 0.44.7 (migrations only, direct SQL for queries)
- **Authentication**: Supabase Auth (@supabase/ssr 0.8.0)
- **File Storage**: Supabase Storage (MTC documents, invoices)
- **Email**: Resend 6.9.1

#### Database & Infrastructure
- **Primary DB**: PostgreSQL 15+ (Supabase)
- **Connection Pooling**: Supabase Pooler (PgBouncer)
- **Row-Level Security**: Enabled on all tables
- **Migrations**: 42 SQL files in `database_migrations/`
- **Hosting**: Vercel (frontend) + Supabase (backend)

#### Development Tools
- **Package Manager**: npm (with bun.lock for faster installs)
- **Linting**: ESLint 9.38.0 + Next.js config
- **Build Tool**: Turbopack (Next.js 15 default)

### Deployment Environment

**Production:**
- **Frontend**: Vercel (auto-deploy from main branch)
- **Database**: Supabase (AWS US-East-2)
- **CDN**: Vercel Edge Network
- **SSL**: Automatic via Vercel

**Development:**
- **Local Server**: `npm run dev` (localhost:3000)
- **Database**: Supabase remote (shared staging instance)
- **Hot Reload**: Turbopack fast refresh

---

## 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │  Sales/CRM   │  │  Inventory   │      │
│  │  (React UI)  │  │  (Forms)     │  │  (Tables)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTPS (Vercel Edge)
                            │
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS 15 APP ROUTER (Vercel)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Server Components (RSC)                             │  │
│  │  - Dashboard aggregations                            │  │
│  │  - Report generation                                 │  │
│  │  - PDF rendering                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Routes (/app/api/*)                             │  │
│  │  - 40+ REST endpoints                                │  │
│  │  - Zod validation                                    │  │
│  │  - Audit logging                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                    PostgreSQL Protocol
                            │
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE (AWS US-East-2)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL 15                                       │  │
│  │  - 50+ tables                                        │  │
│  │  - Row-Level Security (RLS)                          │  │
│  │  - Triggers for auto-calculations                    │  │
│  │  - Stored procedures (sequence generation)           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Supabase Auth                                       │  │
│  │  - JWT-based sessions                                │  │
│  │  - Email/password login                              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Supabase Storage                                    │  │
│  │  - MTC documents (PDF)                               │  │
│  │  - Invoice PDFs                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Structure

```
src/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/
│   │   ├── login/               # Authentication pages
│   │   └── register/
│   ├── dashboard/               # Main dashboard
│   ├── sales/                   # Sales module
│   │   ├── enquiries/
│   │   ├── quotations/
│   │   └── orders/
│   ├── purchase/                # Procurement module
│   │   ├── requests/
│   │   └── orders/
│   ├── inventory/               # Warehouse module
│   │   ├── stock/
│   │   ├── grn/
│   │   ├── dispatch/
│   │   └── qc/
│   ├── finance/                 # Finance module
│   │   ├── invoices/
│   │   ├── payments/
│   │   └── ledger/
│   ├── masters/                 # Master data
│   │   ├── customers/
│   │   ├── vendors/
│   │   ├── products/
│   │   └── employees/
│   ├── reports/                 # MIS Reports
│   ├── admin/                   # Admin panel
│   │   └── audit-logs/
│   ├── settings/                # System settings
│   └── api/                     # API Routes (40+ endpoints)
│       ├── sales-orders/
│       ├── purchase-orders/
│       ├── inventory/
│       └── ...
├── components/                   # Reusable UI components
│   ├── ui/                      # Radix UI wrappers
│   ├── forms/                   # Form components
│   └── charts/                  # Chart components
└── lib/                         # Utilities
    ├── supabase/                # DB clients
    ├── validations/             # Zod schemas
    └── utils.ts                 # Helpers
```

### Backend Structure

**API Layer:**
- **Pattern**: Next.js API Routes (REST)
- **Location**: `src/app/api/**/route.ts`
- **Authentication**: Supabase JWT via cookies
- **Validation**: Zod schemas in `lib/validations/schemas.ts`
- **Error Handling**: Centralized via `apiError()` and `apiSuccess()` helpers

**Database Access:**
- **Direct Queries**: Supabase client (`@supabase/ssr`)
- **No ORM for queries**: Raw SQL via Supabase for performance
- **Migrations**: Drizzle Kit for schema versioning (42 migration files)

### Database Layer

**Connection Strategy:**
- **Pooled Connection**: Via Supabase Pooler (PgBouncer)
- **Connection String**: `DATABASE_URL` env var
- **Max Connections**: 15 (Supabase free tier limit)

**Security:**
- **Row-Level Security (RLS)**: Enabled on all tables
- **Company Isolation**: `company_id` filtering via RLS policies
- **Auth Integration**: `auth.users` table linked to employees

**Performance Optimizations:**
- **Indexes**: 50+ indexes on foreign keys, status fields, dates
- **Materialized Views**: None (real-time data priority)
- **Triggers**: Auto-update `updated_at`, buyer performance metrics

### Third-Party Services

1. **Supabase** (Primary Backend)
   - PostgreSQL database
   - Authentication (JWT)
   - File storage
   - Real-time subscriptions (not currently used)

2. **Resend** (Email)
   - Transactional emails
   - Invoice delivery
   - Notification system

3. **Vercel** (Hosting)
   - Frontend deployment
   - Edge functions
   - Analytics

### Data Flow Explanation

#### Example: Sales Order Creation

```
1. User fills form in /sales/orders/new
   ↓
2. Client-side validation (Zod schema)
   ↓
3. POST /api/sales-orders
   ↓
4. Server validates auth (Supabase JWT)
   ↓
5. Server validates request body (Zod)
   ↓
6. Generate SO number (RPC: get_next_sequence)
   ↓
7. Insert sales_orders row (with RLS check)
   ↓
8. Insert sales_order_items rows (bulk)
   ↓
9. Log audit event (audit_logs table)
   ↓
10. Return SO data to client
   ↓
11. Client redirects to /sales/orders/[id]
```

#### Example: Inventory Allocation (FIFO)

```
1. Dispatch created for Sales Order
   ↓
2. API calls allocateInventory() helper
   ↓
3. Query inventory WHERE product_id AND status='available'
   ↓
4. ORDER BY grn_date ASC (FIFO)
   ↓
5. Loop through inventory batches:
   - Deduct quantity
   - Update inventory.allocated_quantity
   - Link to dispatch_items
   ↓
6. Update SO item status to 'dispatched'
   ↓
7. Log audit trail
```

---

## 3. Security Architecture

### Authentication
- **Method**: Supabase Auth (email/password)
- **Session Storage**: HTTP-only cookies
- **Token Type**: JWT (HS256)
- **Expiry**: 1 hour (auto-refresh via middleware)

### Authorization
- **Row-Level Security**: All tables enforce company_id filtering
- **API Guards**: Every endpoint checks `auth.getUser()`
- **Role-Based Access**: Not implemented (all authenticated users have full access)

### Input Validation
- **Client-Side**: Zod schemas in forms
- **Server-Side**: Same Zod schemas in API routes
- **SQL Injection**: Prevented via Supabase parameterized queries

### Known Vulnerabilities
1. **No RBAC**: All users can access all modules (CRITICAL)
2. **Exposed Service Role Key**: In `.env.local` (should be server-only)
3. **No Rate Limiting**: API endpoints can be spammed
4. **No CSRF Protection**: Relying on SameSite cookies only

---

## 4. Performance Considerations

### Bottlenecks
1. **Dashboard KPI Queries**: Aggregates across 10k+ records (2-3s load time)
2. **Reports Page**: Multiple parallel queries slow initial render
3. **Large Quotations**: 50+ line items cause form lag
4. **No Pagination**: Some list views load all records

### Expensive Queries
```sql
-- Buyer performance trigger (runs on EVERY sales order update)
UPDATE buyers SET 
  total_orders = (SELECT COUNT(*) FROM sales_orders WHERE buyer_id = NEW.buyer_id),
  total_value = (SELECT SUM(total_amount) FROM sales_orders WHERE buyer_id = NEW.buyer_id)
WHERE id = NEW.buyer_id;
```

### Optimization Suggestions
1. **Implement Pagination**: Use `limit` and `offset` on all list APIs
2. **Add Redis Cache**: Cache dashboard KPIs for 5 minutes
3. **Debounce Triggers**: Update buyer metrics via cron job instead of trigger
4. **Lazy Load Reports**: Load charts on-demand, not on page mount
5. **Virtual Scrolling**: For large tables (quotation items, inventory)

---

## 5. Technical Debt

### Hacks & Temporary Fixes
1. **Zustand Store Shim**: `useStore()` returns empty arrays to prevent crashes during API migration
2. **Hardcoded Company ID**: Fallback to `c4a7e946-5e58-45f8-b40b-74116c944111` when employee lookup fails
3. **Client-Side Number Generation**: `generateNumber()` uses random instead of sequence
4. **Disabled RLS Policies**: Some tables have `USING (true)` instead of proper company filtering

### Areas Needing Refactor
1. **API Error Handling**: Inconsistent error responses (some return 500, some 400 for same error)
2. **Validation Duplication**: Zod schemas duplicated between client and server
3. **Component Prop Drilling**: Dashboard passes 10+ props to child components
4. **Monolithic API Routes**: Some routes have 200+ lines (e.g., `/api/quotations/route.ts`)
5. **No API Versioning**: Breaking changes will affect all clients

---

## 6. Deployment Checklist

### Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=https://ytrbodgbtahivlobojrr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # Server-side only
DATABASE_URL=postgresql://postgres...
```

### Build Commands
```bash
npm install          # Install dependencies
npm run build        # Production build
npm run start        # Start production server
```

### Production Considerations
1. **Database Migrations**: Run all 42 SQL files in order
2. **Seed Data**: Run `scripts/seed-sample-data.sql` for demo
3. **File Upload Limits**: Configure Supabase storage bucket policies
4. **CORS**: Whitelist production domain in Supabase dashboard

---

## 7. Assumptions Made

1. **Single Currency**: System assumes INR for most calculations (multi-currency partially implemented)
2. **Indian GST**: Tax calculations hardcoded for CGST/SGST/IGST
3. **Financial Year**: April-March (Indian FY)
4. **Heat Number Uniqueness**: Assumed unique per product, not globally
5. **Single Warehouse**: Multi-warehouse schema exists but UI assumes one default
6. **Email Delivery**: Assumes Resend API is always available (no fallback)

---

## 8. Glossary

- **ENQ**: Enquiry (customer request for quotation)
- **QTN**: Quotation (formal price offer)
- **SO**: Sales Order (confirmed customer order)
- **PO**: Purchase Order (order to vendor)
- **GRN**: Goods Receipt Note (received inventory)
- **QC**: Quality Control (inspection)
- **NCR**: Non-Conformance Report (quality issue)
- **MTC**: Mill Test Certificate (material certification)
- **FIFO**: First-In-First-Out (inventory allocation method)
- **RLS**: Row-Level Security (PostgreSQL feature)
- **ISO 9001:2018**: Quality management standard
