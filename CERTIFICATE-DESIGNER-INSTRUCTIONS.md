# We Are Elixir Academy Certificate Designer

Copy the included `src` and `public` folders over the matching folders in the current Academy repository.

Keep the current `.git`, `package-lock.json`, environment variables, and all other files.

Commit message:

`Add visual certificate designer`

After deployment, sign in as an administrator and open:

`https://academy.weareelixir.co.uk/admin/certificate-designer`

The first visit creates a small `CertificateDesign` table automatically. No Prisma schema change or new npm package is required.

The designer supports:

- certificate background uploads
- Ryan Evans signature uploads
- drag-and-drop field positioning
- font, colour, size, width, and alignment controls
- live preview
- one saved layout for both website certificates and PDF downloads

Uploaded images are stored in MySQL, so they survive Hostinger redeployments.
