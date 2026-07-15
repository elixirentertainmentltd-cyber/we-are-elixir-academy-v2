# We Are Elixir Academy V2

## Part 3: Visual Course Studio

Part 3 adds a complete administrator course-building workflow on top of the working learning platform.

### Included

- Admin-only Course Studio at `/admin/builder`
- Create and edit courses
- Draft, published and archived course states
- Deep course duplication, including modules, lessons and content blocks
- Course preview before publication
- Server-enforced publish checklist
- Create, edit, reorder and delete modules
- Create, edit, reorder and delete lessons
- Visual lesson block editor
- Fast API saves without full-page reloads
- Learner rendering for visual lesson blocks
- Completed lessons remain locked
- Responsive desktop and mobile builder layouts

### Lesson blocks

- Heading
- Paragraph
- Image
- YouTube or public video
- PDF
- Download
- Quote
- Tip
- Warning
- Button
- Divider

All learner-facing asset links must use a public `http` or `https` URL. File uploads and the media library arrive in Part 6.

## Hostinger environment

Keep the environment variables that are already working:

- `DATABASE_URL_V2`
- `APP_URL`
- `ADMIN_EMAIL`

`ADMIN_PASSWORD` is only needed when deliberately running `npm run db:seed`. It is not required for an ordinary deployment after the administrator has already been created.

## Deployment

1. Back up the current repository.
2. Extract this package over the local `we-are-elixir-academy-v2` repository.
3. Do not delete the hidden `.git` directory.
4. Commit and push the changes.
5. Hostinger will run the normal build command:

```text
prisma generate && prisma db push && next build
```

`prisma db push` creates the new `LessonBlock` table before the application build. No temporary build-script edit is required for Part 3.

Suggested commit message:

```text
Add visual Course Studio and lesson block editor
```

## Test checklist

After deployment:

1. Sign in as an administrator.
2. Open `/admin/builder`.
3. Create a draft course.
4. Add a module and lesson.
5. Open **Content**, add paragraph and tip blocks, then save.
6. Open **Preview**.
7. Open **Publish** and review the checklist.
8. Publish the course and confirm it appears in `/courses`.
9. Open the lesson as a learner and mark it complete.

## Useful routes

- `/admin/builder`
- `/admin/users`
- `/dashboard`
- `/courses`
- `/api/health`
- `/api/db-health`

## Commands

```bash
npm install
npm run lint
npm run typecheck
npm run build
npm start
```

The project continues to use `DATABASE_URL_V2`, matching the working Hostinger configuration.
