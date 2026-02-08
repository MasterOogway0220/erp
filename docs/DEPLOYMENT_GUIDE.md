# ERP System - Deployment Guide

**Document Version:** 1.0  
**Last Updated:** 2026-02-07  
**Target Environment:** Production (Vercel + Supabase)

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Production Deployment](#production-deployment)
6. [Post-Deployment Checklist](#post-deployment-checklist)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js**: v18.17.0 or higher
- **npm**: v9.0.0 or higher (or bun for faster installs)
- **PostgreSQL Client**: psql (for running migrations)
- **Git**: For version control

### Required Accounts
1. **Supabase Account**: https://supabase.com
   - Create new project
   - Note: Database URL, Anon Key, Service Role Key
2. **Vercel Account**: https://vercel.com
   - Link GitHub repository
3. **Resend Account** (optional): https://resend.com
   - For email functionality
   - Get API key

---

## Local Development Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd erp
```

### 2. Install Dependencies

**Using npm**:
```bash
npm install
```

**Using bun (faster)**:
```bash
bun install
```

**Expected Time**: 2-3 minutes (npm), 30-60 seconds (bun)

### 3. Create Environment File

Create `.env.local` in project root:

```bash
cp .env.example .env.local
```

**Edit `.env.local`** (see [Environment Configuration](#environment-configuration))

### 4. Run Development Server

```bash
npm run dev
```

**Access**: http://localhost:3000

**Expected Output**:
```
▲ Next.js 15.5.7
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.5s
```

---

## Database Setup

### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill details:
   - **Name**: erp-production
   - **Database Password**: (strong password)
   - **Region**: US East (Ohio) - us-east-2
4. Wait for provisioning (2-3 minutes)

### 2. Get Database Credentials

From Supabase Dashboard → Settings → Database:

- **Connection String** (Pooler): `postgresql://postgres.xxxxx:password@aws-1-us-east-2.pooler.supabase.com:5432/postgres`
- **Direct Connection**: `postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres`

From Supabase Dashboard → Settings → API:

- **Project URL**: `https://xxxxx.supabase.co`
- **Anon Key**: `eyJhbGci...` (public key)
- **Service Role Key**: `eyJhbGci...` (secret key - never expose)

### 3. Run Database Migrations

**Important**: Migrations must be run in numeric order (01 → 42)

**Option A: Manual (Recommended)**

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://postgres.xxxxx:password@aws-1-us-east-2.pooler.supabase.com:5432/postgres"

# Run migrations in order
psql $DATABASE_URL -f database_migrations/01_company_master.sql
psql $DATABASE_URL -f database_migrations/02_employee_master.sql
psql $DATABASE_URL -f database_migrations/03_buyer_and_customer.sql
# ... continue through 42
```

**Option B: Automated Script**

```bash
#!/bin/bash
export DATABASE_URL="your_connection_string"

for file in database_migrations/*.sql; do
  echo "Running $file..."
  psql $DATABASE_URL -f "$file"
  if [ $? -ne 0 ]; then
    echo "Error running $file"
    exit 1
  fi
done

echo "All migrations completed successfully"
```

**Expected Time**: 5-10 minutes

**Verification**:

```sql
-- Check table count
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Expected: 50+ tables

-- Check critical tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('companies', 'customers', 'sales_orders', 'inventory', 'invoices');
```

### 4. Seed Sample Data (Optional)

**For Demo/Testing Only**

```bash
psql $DATABASE_URL -f scripts/seed-sample-data.sql
```

**Warning**: Do NOT run in production with real data

---

## Environment Configuration

### .env.local File

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...  # Public key (safe to expose)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...      # Secret key (server-side only)

# Database Connection
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-1-us-east-2.pooler.supabase.com:5432/postgres

# Email (Optional)
RESEND_API_KEY=re_xxxxx

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Environment Variable Descriptions

| Variable | Purpose | Required | Visibility |
|----------|---------|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key | Yes | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin API key | Yes | Server only |
| `DATABASE_URL` | PostgreSQL connection | Yes | Server only |
| `RESEND_API_KEY` | Email service | No | Server only |
| `NEXT_PUBLIC_APP_URL` | App base URL | Yes | Client + Server |

**Security Notes**:
- ✅ `NEXT_PUBLIC_*` variables are safe to expose (embedded in client bundle)
- ❌ `SUPABASE_SERVICE_ROLE_KEY` must NEVER be exposed to client
- ❌ `DATABASE_URL` must NEVER be exposed to client

---

## Production Deployment

### 1. Prepare for Deployment

**Checklist**:
- [ ] All migrations run successfully
- [ ] Environment variables configured
- [ ] Build passes locally: `npm run build`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No ESLint errors: `npm run lint`

**Test Build Locally**:

```bash
npm run build
npm run start
```

**Expected Output**:
```
▲ Next.js 15.5.7
- Local:        http://localhost:3000

✓ Ready in 1.2s
```

### 2. Deploy to Vercel

**Option A: GitHub Integration (Recommended)**

1. Push code to GitHub
2. Go to https://vercel.com/new
3. Import repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next
5. Add Environment Variables (from `.env.local`)
6. Click "Deploy"

**Expected Time**: 3-5 minutes

**Option B: Vercel CLI**

```bash
npm install -g vercel
vercel login
vercel --prod
```

### 3. Configure Environment Variables in Vercel

Vercel Dashboard → Project → Settings → Environment Variables

Add all variables from `.env.local`:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Production |
| `DATABASE_URL` | `postgresql://...` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` | Production |

**Redeploy** after adding variables:

```bash
vercel --prod
```

### 4. Configure Custom Domain (Optional)

Vercel Dashboard → Project → Settings → Domains

1. Add custom domain: `erp.yourcompany.com`
2. Configure DNS:
   - **Type**: CNAME
   - **Name**: erp
   - **Value**: cname.vercel-dns.com
3. Wait for SSL certificate (automatic, 1-2 minutes)

---

## Post-Deployment Checklist

### 1. Verify Deployment

**Test URLs**:
- [ ] Homepage loads: `https://your-domain.vercel.app`
- [ ] Login page: `https://your-domain.vercel.app/login`
- [ ] Dashboard (after login): `https://your-domain.vercel.app/dashboard`

**Test API Endpoints**:

```bash
# Health check (if implemented)
curl https://your-domain.vercel.app/api/health

# Test authentication
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 2. Configure Supabase Settings

**Enable RLS (Row-Level Security)**:

Supabase Dashboard → Authentication → Policies

- Verify all tables have RLS enabled
- Test policies with different user roles

**Configure Storage Buckets**:

Supabase Dashboard → Storage

1. Create bucket: `mtc-documents`
   - **Public**: No
   - **File size limit**: 10 MB
   - **Allowed MIME types**: application/pdf
2. Create bucket: `invoices`
   - **Public**: No
   - **File size limit**: 5 MB
   - **Allowed MIME types**: application/pdf

**Set Bucket Policies**:

```sql
-- MTC Documents: Authenticated users can upload/read
CREATE POLICY "Authenticated users can upload MTC"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mtc-documents');

CREATE POLICY "Authenticated users can read MTC"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'mtc-documents');
```

### 3. Create First Admin User

**Via Supabase Dashboard**:

1. Go to Authentication → Users
2. Click "Add User"
3. Fill details:
   - **Email**: admin@yourcompany.com
   - **Password**: (strong password)
   - **Auto Confirm**: Yes
4. Click "Create User"

**Link to Employee**:

```sql
-- Get user_id from Supabase Auth
SELECT id FROM auth.users WHERE email = 'admin@yourcompany.com';

-- Create company (if not exists)
INSERT INTO companies (name, company_type, code)
VALUES ('Your Company Ltd', 'Pvt Ltd', 'YCL')
RETURNING id;

-- Create employee linked to user
INSERT INTO employees (company_id, user_id, first_name, last_name, email, department, designation)
VALUES (
  '<company_id>',
  '<user_id>',
  'Admin',
  'User',
  'admin@yourcompany.com',
  'Admin',
  'System Administrator'
);
```

### 4. Test Critical Flows

**Manual Testing**:

- [ ] Login with admin user
- [ ] Create customer
- [ ] Create product
- [ ] Create enquiry
- [ ] Create quotation
- [ ] Create sales order
- [ ] View dashboard KPIs
- [ ] View audit logs

**Expected Behavior**:
- All forms save successfully
- Audit logs created for all actions
- Document numbers generated correctly (ENQ/YCL/2026/0001)

### 5. Configure Monitoring (Recommended)

**Vercel Analytics**:

Vercel Dashboard → Project → Analytics

- Enable Web Analytics (free)
- Enable Speed Insights (free)

**Supabase Monitoring**:

Supabase Dashboard → Reports

- Monitor database size
- Monitor API requests
- Set up alerts for high CPU/memory

**Error Tracking** (Optional):

Integrate Sentry:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## Troubleshooting

### Build Errors

**Error**: `Module not found: Can't resolve '@/lib/...'`

**Solution**: Check `tsconfig.json` has correct paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Error**: `Type error: Property 'xxx' does not exist on type 'yyy'`

**Solution**: Run `npm run type-check` locally to identify TypeScript errors

---

### Database Connection Errors

**Error**: `connection to server at "..." failed`

**Solution**:
1. Check `DATABASE_URL` is correct (use Pooler URL, not Direct)
2. Verify Supabase project is not paused (free tier pauses after 1 week inactivity)
3. Check IP allowlist in Supabase (should allow all IPs for Vercel)

**Error**: `password authentication failed`

**Solution**: Reset database password in Supabase Dashboard → Settings → Database

---

### Authentication Errors

**Error**: `Invalid login credentials`

**Solution**:
1. Verify user exists in Supabase Auth
2. Check user is confirmed (auto_confirm should be true)
3. Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct

**Error**: `User not authorized`

**Solution**:
1. Check RLS policies are not too restrictive
2. Verify user is linked to employee record
3. Check `company_id` is set correctly

---

### Performance Issues

**Symptom**: Dashboard loads slowly (> 5s)

**Solution**:
1. Check database indexes exist (run `\di` in psql)
2. Optimize dashboard queries (add caching)
3. Upgrade Supabase plan (free tier has limited resources)

**Symptom**: API timeouts

**Solution**:
1. Check Vercel function timeout (default: 10s, max: 60s on Pro)
2. Optimize slow queries (use `EXPLAIN ANALYZE`)
3. Add database connection pooling

---

### File Upload Errors

**Error**: `Storage bucket not found`

**Solution**:
1. Create bucket in Supabase Storage
2. Verify bucket name matches code (e.g., 'mtc-documents')
3. Check storage policies allow uploads

**Error**: `File size exceeds limit`

**Solution**:
1. Check bucket file size limit (default: 50 MB)
2. Reduce file size or increase limit
3. Implement client-side compression

---

## Maintenance

### Regular Tasks

**Daily**:
- Monitor error logs (Vercel Dashboard → Logs)
- Check Supabase database size (Dashboard → Reports)

**Weekly**:
- Review audit logs for suspicious activity
- Check for failed background jobs (if any)

**Monthly**:
- Review and archive old audit logs (> 6 months)
- Update dependencies: `npm outdated` → `npm update`
- Review Supabase usage (free tier: 500 MB database, 2 GB bandwidth)

### Backup Strategy

**Database Backups**:

Supabase provides automatic daily backups (free tier: 7 days retention)

**Manual Backup**:

```bash
# Export entire database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Export specific tables
pg_dump $DATABASE_URL -t companies -t customers -t sales_orders > critical_tables.sql
```

**Restore from Backup**:

```bash
psql $DATABASE_URL < backup_20260207.sql
```

### Scaling Considerations

**When to Upgrade**:

- **Database Size** > 500 MB → Upgrade Supabase to Pro ($25/month)
- **API Requests** > 500k/month → Upgrade Vercel to Pro ($20/month)
- **Concurrent Users** > 50 → Add Redis caching
- **Data Volume** > 1M records → Implement table partitioning

---

## Security Hardening

### Production Checklist

- [ ] Change all default passwords
- [ ] Enable 2FA for Supabase/Vercel accounts
- [ ] Restrict Supabase API keys (use RLS policies)
- [ ] Enable HTTPS only (automatic on Vercel)
- [ ] Set secure cookie flags (httpOnly, secure, sameSite)
- [ ] Implement rate limiting (API routes)
- [ ] Regular security audits (npm audit)
- [ ] Monitor for SQL injection attempts (audit logs)

### Recommended Security Headers

Add to `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}
```

---

## Support & Resources

### Documentation
- **Next.js**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs

### Community
- **Next.js Discord**: https://nextjs.org/discord
- **Supabase Discord**: https://discord.supabase.com

### Emergency Contacts
- **Database Issues**: Supabase Support (support@supabase.io)
- **Hosting Issues**: Vercel Support (support@vercel.com)

---

**End of Deployment Guide**
