# We Are Elixir Academy V2

Milestone 1 provides a clean Next.js foundation with Prisma/MySQL, API-route authentication, admin approval, secure database-backed sessions, a responsive dashboard, admin user management and health checks.

## Local setup
1. Copy `.env.example` to `.env` and enter your values.
2. Run `npm install`.
3. Run `npm run db:push`.
4. Run `npm run db:seed`.
5. Run `npm run dev`.

## Hostinger
Set `DATABASE_URL`, `APP_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in environment variables. Use this build command for the first deployment:

`npm run hostinger-build`

After the database has been created and seeded successfully, the normal build command can be `npm run build`.

Health routes:
- `/api/health` checks the app.
- `/api/db-health` checks the database without exposing credentials.

Never commit `.env` or real passwords.
