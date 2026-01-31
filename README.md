# SteelERP - Steel Trading ERP System

A comprehensive Enterprise Resource Planning (ERP) system specifically designed for steel trading and distribution businesses. Built with Next.js 15, TypeScript, Supabase, and shadcn/ui.

## Features

### Core Modules

- **Sales Management**: Enquiries, Quotations, Sales Orders with approval workflows
- **Purchase Management**: Purchase Requests, Purchase Orders with vendor approval
- **Inventory Management**: Stock tracking with heat number traceability, GRN, Dispatch
- **Quality Control**: Inspections, MTC management, NCR tracking
- **Finance**: Invoicing with GST, Payments, Outstanding receivables
- **Masters**: Customers, Vendors, Products management
- **Reports**: Dashboard KPIs, Conversion analysis, Ageing reports, Vendor scorecard

### Key Capabilities

- Complete Order-to-Cash and Procure-to-Pay cycles
- Heat number traceability from receipt to dispatch
- GST-compliant invoicing (CGST, SGST, IGST)
- Multi-currency support (INR, USD)
- Approval workflows for quotations and orders
- Real-time dashboard with pending actions
- Comprehensive audit trail
- Business rule enforcement at API level

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide Icons
- **State Management**: Zustand
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or bun
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd steel-erp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   ├── sales/            # Sales module pages
│   ├── purchase/         # Purchase module pages
│   ├── inventory/        # Inventory module pages
│   ├── qc/               # Quality control pages
│   ├── finance/          # Finance module pages
│   ├── masters/          # Master data pages
│   └── reports/          # Reports page
├── components/
│   ├── ui/               # shadcn/ui components
│   └── dashboard/        # Dashboard components
└── lib/
    ├── supabase/         # Supabase clients
    ├── validations/      # Zod schemas
    └── store.ts          # Zustand store
```

## Documentation

For detailed documentation, see:

- [Complete System Documentation](docs/COMPLETE_SYSTEM_DOCUMENTATION.md) - Full feature documentation
- [Implementation Report](docs/IMPLEMENTATION_REPORT.md) - Development progress
- [PRD](docs/PRD.md) - Product requirements

## Business Rules

The system enforces strict business rules:

1. **Sales Orders** require approved quotations
2. **Purchase Orders** require approved vendors
3. **GRN** requires sent/acknowledged POs
4. **Dispatch** requires QC-accepted inventory
5. **Invoices** require dispatched goods
6. **Payments** cannot exceed outstanding balance

## API Endpoints

| Module | Endpoints |
|--------|-----------|
| Enquiries | GET, POST `/api/enquiries` |
| Quotations | GET, POST `/api/quotations`, PATCH `/api/quotations/[id]` |
| Sales Orders | GET, POST `/api/sales-orders` |
| Purchase Orders | GET, POST `/api/purchase-orders` |
| GRN | GET, POST `/api/grn` |
| Dispatches | GET, POST `/api/dispatches` |
| Invoices | GET, POST `/api/invoices` |
| Payments | GET, POST `/api/payments` |
| Inventory | GET, POST `/api/inventory` |
| Reports | GET `/api/reports?type=X` |
| Notifications | GET, PATCH `/api/notifications` |

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy

## License

Proprietary - All rights reserved

---

**Version**: 1.0.0  
**Last Updated**: January 2026
