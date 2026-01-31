## Project Summary
SteelERP is a comprehensive Enterprise Resource Planning (ERP) system for steel trading and distribution businesses. It manages sales, purchases, inventory, quality control, and finance operations with full traceability and ISO 9001 compliance.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Tailwind CSS, shadcn/ui, Lucide Icons
- **State Management:** Zustand (UI state only)
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage), Next.js API Routes
- **Validation:** Zod

## Architecture
- **API-First:** All CRUD operations performed via `/api/*` endpoints.
- **Backend as SSOT:** Business logic and data validation enforced at the API/Database level.
- **Document Chain:** Strict dependency between documents (e.g., SO requires approved Quotation, GRN requires PO).
- **Page Pattern:** Create/Edit operations use full pages: `/module/entity/new` or `/module/entity/[id]`.

## User Preferences
- **Components:** Functional components with TypeScript.
- **Styling:** Tailwind CSS with shadcn/ui.
- **Comments:** No comments unless requested.

## Project Guidelines
- **API Integration:** Always use Web_Search for third-party service integration docs.
- **State:** Keep business data out of Zustand; fetch from API as needed.
- **Security:** Use Supabase Auth and RLS. Never log secrets.
- **Validation:** Use Zod schemas in API routes and frontend forms.

## Common Patterns
- **API Responses:** `{ success: true, data: { ... } }` or `{ success: false, error: "message" }`.
- **Form Handling:** Standard React state or forms with Zod validation.
- **Navigation:** `next/navigation` for routing.
