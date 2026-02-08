# ERP System - Complete Technical Documentation

**System Version:** Phase 14 (Production Ready)  
**Documentation Version:** 1.0  
**Last Updated:** 2026-02-07

---

## 📚 Documentation Index

This comprehensive technical documentation suite provides everything a new developer needs to understand, debug, and extend the ERP system without requiring additional questions.

### Core Documentation

1. **[TECHNICAL_OVERVIEW.md](./TECHNICAL_OVERVIEW.md)**
   - System architecture and design patterns
   - Complete tech stack (Next.js 15, React 19, PostgreSQL, Supabase)
   - Security architecture and known vulnerabilities
   - Performance bottlenecks and optimization suggestions
   - Technical debt and areas needing refactor
   - Deployment environment details

2. **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)**
   - Complete schema documentation (50+ tables)
   - Entity relationship diagrams
   - Table-by-table field descriptions
   - Indexes, constraints, and triggers
   - Database functions and stored procedures
   - Known schema issues and migration strategy

3. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**
   - All 40+ REST API endpoints
   - Request/response schemas with examples
   - Zod validation rules
   - Business logic explanations
   - Error codes and handling
   - Known API issues and limitations

4. **[FEATURE_CATALOG.md](./FEATURE_CATALOG.md)**
   - Complete feature breakdown by module
   - User flows (Sales, Purchase, Inventory, Finance, QC)
   - Forms documentation with validation rules
   - Edge cases and known bugs
   - Missing improvements and future enhancements

5. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**
   - Local development setup
   - Database migration instructions
   - Environment configuration
   - Production deployment (Vercel + Supabase)
   - Post-deployment checklist
   - Troubleshooting guide

---

## 🎯 Quick Start

### For New Developers

**Read in this order:**

1. Start with [TECHNICAL_OVERVIEW.md](./TECHNICAL_OVERVIEW.md) - Get the big picture
2. Review [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Understand data model
3. Browse [FEATURE_CATALOG.md](./FEATURE_CATALOG.md) - Learn what the system does
4. Reference [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - When working with APIs
5. Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - To set up your environment

**Estimated Reading Time:** 3-4 hours for complete understanding

### For DevOps/Deployment

**Focus on:**
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete setup instructions
- [TECHNICAL_OVERVIEW.md](./TECHNICAL_OVERVIEW.md) - Section 6 (Deployment Checklist)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Migration Strategy section

### For QA/Testing

**Focus on:**
- [FEATURE_CATALOG.md](./FEATURE_CATALOG.md) - User flows and edge cases
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API testing examples
- [TECHNICAL_OVERVIEW.md](./TECHNICAL_OVERVIEW.md) - Known vulnerabilities section

---

## 🏗️ System Overview

### What This System Does

Full-stack ERP for steel trading and manufacturing companies, handling:

- **Sales**: Enquiries → Quotations → Sales Orders
- **Purchase**: Purchase Orders → GRNs → Quality Control
- **Inventory**: FIFO stock management with heat number traceability
- **Finance**: Invoicing, payment receipts, aging analysis
- **Quality**: Inspections, NCRs, MTC tracking (ISO 9001:2018)
- **Admin**: Audit logs, multi-company support, settings

### Tech Stack Summary

- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Supabase Auth
- **Database**: PostgreSQL (Supabase) with Row-Level Security
- **Hosting**: Vercel (frontend) + Supabase (backend)

### Key Features

✅ **ISO 9001:2018 Compliant** - Complete audit trails  
✅ **Multi-Company** - Manage multiple legal entities  
✅ **FIFO Inventory** - Automatic oldest-first allocation  
✅ **GST Compliant** - Automatic tax calculation  
✅ **Heat Number Tracking** - Full material traceability  
✅ **Real-time Dashboard** - KPIs and analytics  

---

## 🔍 Finding Information

### By Topic

| Topic | Document | Section |
|-------|----------|---------|
| Architecture | TECHNICAL_OVERVIEW.md | Section 2 |
| Database Tables | DATABASE_SCHEMA.md | Sections 2-8 |
| API Endpoints | API_DOCUMENTATION.md | Sections 3-7 |
| User Workflows | FEATURE_CATALOG.md | Section 9 |
| Setup Instructions | DEPLOYMENT_GUIDE.md | Section 2 |
| Security | TECHNICAL_OVERVIEW.md | Section 3 |
| Performance | TECHNICAL_OVERVIEW.md | Section 4 |
| Known Bugs | FEATURE_CATALOG.md | Each feature section |
| Troubleshooting | DEPLOYMENT_GUIDE.md | Section 7 |

### By Module

| Module | Features | Database | APIs |
|--------|----------|----------|------|
| **Sales** | FEATURE_CATALOG.md §2 | DATABASE_SCHEMA.md §3 | API_DOCUMENTATION.md §3 |
| **Purchase** | FEATURE_CATALOG.md §3 | DATABASE_SCHEMA.md §4 | API_DOCUMENTATION.md §4 |
| **Inventory** | FEATURE_CATALOG.md §4 | DATABASE_SCHEMA.md §5 | API_DOCUMENTATION.md §5 |
| **Finance** | FEATURE_CATALOG.md §5 | DATABASE_SCHEMA.md §6 | API_DOCUMENTATION.md §6 |
| **Quality** | FEATURE_CATALOG.md §6 | DATABASE_SCHEMA.md §7 | API_DOCUMENTATION.md - |
| **Admin** | FEATURE_CATALOG.md §7 | DATABASE_SCHEMA.md §8 | API_DOCUMENTATION.md §8 |

---

## ⚠️ Critical Issues to Know

### Security Vulnerabilities

1. **No RBAC** - All authenticated users have full access (CRITICAL)
2. **Exposed Service Role Key** - In `.env.local` (should be server-only)
3. **No Rate Limiting** - API endpoints can be spammed
4. **No CSRF Protection** - Relying on SameSite cookies only

**See:** [TECHNICAL_OVERVIEW.md](./TECHNICAL_OVERVIEW.md) - Section 3 (Security Architecture)

### Performance Bottlenecks

1. **Dashboard KPIs** - 2-3s load time (sequential aggregations)
2. **No Pagination** - List views load all records
3. **Buyer Performance Trigger** - Runs on EVERY sales order update
4. **No Caching** - All queries hit database

**See:** [TECHNICAL_OVERVIEW.md](./TECHNICAL_OVERVIEW.md) - Section 4 (Performance Considerations)

### Known Bugs

1. **Quotation Zero Total** - Can save with total_amount = 0 if inputs not blurred
2. **No Duplicate Heat Number Validation** - Same heat number can exist in multiple GRNs
3. **GST Rates Hardcoded** - Should be configurable

**See:** [FEATURE_CATALOG.md](./FEATURE_CATALOG.md) - Each feature's "Known Bugs" section

---

## 📊 System Statistics

### Codebase Metrics

- **Total Lines of Code**: ~15,000 (estimated)
- **Database Tables**: 50+
- **API Endpoints**: 40+
- **SQL Migrations**: 42 files
- **React Components**: 100+ (estimated)
- **Dependencies**: 80+ npm packages

### Database Metrics

- **Total Tables**: 50+
- **Indexes**: 50+
- **Triggers**: 3 (buyer performance, updated_at)
- **Stored Procedures**: 2 (sequence generation, FY calculation)
- **RLS Policies**: 100+ (all tables)

### Implementation Status

- **Completed Features**: 100% (Phase 14)
- **Partially Implemented**: Multi-currency, Dispatch planning UI
- **Planned Features**: Work Orders, Production Planning, Mobile App

---

## 🛠️ Development Workflow

### Making Changes

1. **Understand the Feature**
   - Read [FEATURE_CATALOG.md](./FEATURE_CATALOG.md) for user flow
   - Check [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for tables involved
   - Review [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for endpoints

2. **Make Code Changes**
   - Follow existing patterns (see TECHNICAL_OVERVIEW.md §2)
   - Update validation schemas in `src/lib/validations/schemas.ts`
   - Add audit logging via `logAuditEvent()`

3. **Test Changes**
   - Manual testing (no automated tests exist)
   - Check audit logs created
   - Verify RLS policies work

4. **Update Documentation**
   - Update relevant .md files in `docs/`
   - Document new bugs/edge cases
   - Update API examples if needed

### Adding New Features

**Checklist:**
- [ ] Design database schema (add migration file)
- [ ] Create API endpoints (with Zod validation)
- [ ] Build UI components (follow existing patterns)
- [ ] Add audit logging
- [ ] Test RLS policies
- [ ] Update documentation (all 5 files)
- [ ] Add to FEATURE_CATALOG.md

---

## 📞 Support Resources

### Internal Documentation
- All documentation in `docs/` folder
- Code comments in critical functions
- Zod schemas in `src/lib/validations/schemas.ts`

### External Resources
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

### Community
- **Next.js Discord**: https://nextjs.org/discord
- **Supabase Discord**: https://discord.supabase.com

---

## 📝 Documentation Maintenance

### When to Update

**Update documentation when:**
- Adding new features
- Fixing bugs
- Changing database schema
- Modifying API contracts
- Discovering new edge cases
- Refactoring code

### How to Update

1. **Identify affected documents** (usually 2-3 of the 5)
2. **Update relevant sections** (maintain existing structure)
3. **Add to "Known Bugs" or "Missing Improvements"** if applicable
4. **Update version and date** at top of file
5. **Cross-reference** other documents if needed

### Documentation Standards

- **Be Critical**: Point out flaws, don't hide them
- **Be Specific**: Include exact error messages, line numbers, file paths
- **Be Practical**: Focus on what developers need to know
- **Be Concise**: Use tables, lists, code blocks (not paragraphs)
- **Be Current**: Update immediately when code changes

---

## 🎓 Learning Path

### Week 1: Understanding the System
- Day 1-2: Read TECHNICAL_OVERVIEW.md + DATABASE_SCHEMA.md
- Day 3-4: Read FEATURE_CATALOG.md (focus on Sales + Purchase)
- Day 5: Set up local environment (DEPLOYMENT_GUIDE.md)

### Week 2: Hands-On Exploration
- Day 1-2: Create test data (customers, products, enquiries)
- Day 3-4: Test complete Sales flow (ENQ → QTN → SO)
- Day 5: Test Purchase flow (PO → GRN → QC)

### Week 3: Deep Dive
- Day 1-2: Study API code (`src/app/api/*`)
- Day 3-4: Study database triggers and functions
- Day 5: Fix a small bug or add a minor feature

### Week 4: Mastery
- Day 1-3: Implement a new feature end-to-end
- Day 4-5: Review code with team, update documentation

---

## 🚀 Future Roadmap

### Planned Enhancements

**High Priority:**
- Implement RBAC (role-based access control)
- Add pagination to all list endpoints
- Implement API rate limiting
- Add Redis caching for dashboard
- Replace buyer performance trigger with cron job

**Medium Priority:**
- Multi-currency full implementation
- Advanced dispatch planning (route optimization)
- E-invoice integration (GST portal)
- Automated email delivery (quotations, invoices)
- Mobile app (React Native)

**Low Priority:**
- Work Orders module
- Production Planning module
- Predictive analytics
- Two-factor authentication
- API versioning

**See:** [TECHNICAL_OVERVIEW.md](./TECHNICAL_OVERVIEW.md) - Section 5 (Technical Debt)

---

## ✅ Documentation Completeness

This documentation suite covers:

- ✅ **Architecture** - Complete system design
- ✅ **Database** - All 50+ tables documented
- ✅ **APIs** - All 40+ endpoints with examples
- ✅ **Features** - Every feature with user flows
- ✅ **Deployment** - Step-by-step setup guide
- ✅ **Security** - Known vulnerabilities listed
- ✅ **Performance** - Bottlenecks identified
- ✅ **Bugs** - All known issues documented
- ✅ **Edge Cases** - Common scenarios covered
- ✅ **Troubleshooting** - Common problems + solutions

**Estimated Coverage:** 95%+ of system functionality

---

## 📄 License

[Add your license information here]

---

## 👥 Contributors

[Add contributor information here]

---

**Last Updated:** 2026-02-07  
**Maintained By:** Development Team  
**Questions?** Refer to the specific documentation files above or contact the team.
