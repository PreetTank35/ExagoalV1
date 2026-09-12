# ExaGo Demo Credentials

These accounts are for local/demo presentation only. Change or delete them before production use. The passwords are intentionally listed here because this file is a demo seed handoff, not a production secret store.

All accounts use the same Supabase project and are created with `email_confirm: true`.

## Institute

**Portal:** Institute  
**Role:** Institute administrator  
**Email:** `institute.admin@exagoal.demo`  
**Password:** `ExaGo-Institute-2026!`

## Students

### Student 01

**Email:** `student01@exagoal.demo`  
**Password:** `ExaGo-Student01-2026!`

### Student 02

**Email:** `student02@exagoal.demo`  
**Password:** `ExaGo-Student02-2026!`

### Student 03

**Email:** `student03@exagoal.demo`  
**Password:** `ExaGo-Student03-2026!`

### Student 04

**Email:** `student04@exagoal.demo`  
**Password:** `ExaGo-Student04-2026!`

### Student 05

**Email:** `student05@exagoal.demo`  
**Password:** `ExaGo-Student05-2026!`

### Student 06

**Email:** `student06@exagoal.demo`  
**Password:** `ExaGo-Student06-2026!`

### Student 07

**Email:** `student07@exagoal.demo`  
**Password:** `ExaGo-Student07-2026!`

### Student 08

**Email:** `student08@exagoal.demo`  
**Password:** `ExaGo-Student08-2026!`

### Student 09

**Email:** `student09@exagoal.demo`  
**Password:** `ExaGo-Student09-2026!`

### Student 10

**Email:** `student10@exagoal.demo`  
**Password:** `ExaGo-Student10-2026!`

## Create or refresh accounts

Run the seed script from the `frontend` directory. It requires the Supabase **service-role key**; never put that key in `.env.local`, Vercel, the browser, or GitHub.

```powershell
cd frontend
$env:NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
node scripts/seed-demo-users.mjs
```

The script is idempotent: existing demo users are updated, missing users are created, and each account receives `user_metadata.portal` as either `student` or `institute`.

## Login behavior

- Student accounts must use the **Student** portal.
- The institute account must use the **Institute** portal.
- Dashboard routes require an active Supabase session.
- Portal mismatch is rejected at login and redirected by middleware.
- Sign out clears the Supabase session and returns to `/login`.
