# We Are Elixir Academy V2

Milestone 2 adds the core learning platform: course library, categories, course pages, modules, lessons, learner progress, search and a redesigned dashboard.

## Hostinger environment

The working Hostinger database integration currently uses:

- `DATABASE_URL_V2`
- `APP_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` only when deliberately running the seed command

## Deploying this milestone

This milestone changes the Prisma schema and adds starter learning content. For the first deployment of this ZIP, temporarily set the `build` script in `package.json` to `npm run hostinger-build`, or run `npm run hostinger-build` through Hostinger. After the database sync and seed succeed, change the normal build back to `prisma generate && next build`.

## Useful routes

- `/dashboard`
- `/courses`
- `/admin/users`
- `/api/health`
- `/api/db-health`
