# We Are Elixir Academy V1.0

This consolidated release adds the Parts 6–9 foundation in one deployment:

- Hostinger-safe media library and uploads
- Assignment creation, learner submissions, file/link/text answers and staff review
- Learner profiles, public portfolio pages, skills and achievement records
- Academy community discussions
- Events and RSVPs
- Notification centre
- Global search across courses, lessons, discussions and events
- Admin reports, learner CSV export and audit log
- Expanded responsive navigation and shared V1 styling
- Existing Course Studio, quizzes, certificates and Certificate Designer retained

## Deployment

Keep the current environment variables. Hostinger's existing build command runs `prisma db push`, which creates the new tables and profile fields.

The first deployment should show:

```
The database is now in sync with the Prisma schema.
```

Then test these pages:

- `/admin/media`
- `/admin/assignments`
- `/assignments`
- `/profile`
- `/community`
- `/events`
- `/notifications`
- `/search`
- `/admin/reports`
- `/admin/audit`

Uploaded files are stored in `public/uploads` on the Hostinger application filesystem. For multi-instance or immutable hosting, replace this storage adapter with object storage.
