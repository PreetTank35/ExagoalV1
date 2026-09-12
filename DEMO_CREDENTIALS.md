# ExaGo Demo Credentials

These accounts are for local/demo presentation only. Change or delete them before production use. The passwords are intentionally listed here because this file is a demo seed handoff, not a production secret store.

All accounts use the same Supabase project and are created with `email_confirm: true`.

## Institute

| Portal | Email | Password | Role |
|---|---|---|---|
| Institute | `institute.admin@exagoal.demo` | `ExaGo-Institute-2026!` | Institute administrator |

## Students

| # | Email | Password |
|---:|---|---|
| 1 | `student01@exagoal.demo` | `ExaGo-Student01-2026!` |
| 2 | `student02@exagoal.demo` | `ExaGo-Student02-2026!` |
| 3 | `student03@exagoal.demo` | `ExaGo-Student03-2026!` |
| 4 | `student04@exagoal.demo` | `ExaGo-Student04-2026!` |
| 5 | `student05@exagoal.demo` | `ExaGo-Student05-2026!` |
| 6 | `student06@exagoal.demo` | `ExaGo-Student06-2026!` |
| 7 | `student07@exagoal.demo` | `ExaGo-Student07-2026!` |
| 8 | `student08@exagoal.demo` | `ExaGo-Student08-2026!` |
| 9 | `student09@exagoal.demo` | `ExaGo-Student09-2026!` |
| 10 | `student10@exagoal.demo` | `ExaGo-Student10-2026!` |

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
