# Official Academy certificate template update

This update makes the supplied We Are Elixir Academy certificate artwork the permanent certificate template on the website and in downloaded PDFs.

Dynamic fields:
- learner name
- course title
- completion date
- certificate number
- verification URL

Fixed field:
- Ryan Evans signature

## Install

1. Copy all files over the current repository.
2. Keep the existing `.git` folder.
3. Delete the local `package-lock.json` and run `npm install` so `pdf-lib` is added using the public npm registry.
4. Commit and push.

Suggested commit message:

`Use official Academy certificate template for web and PDF`
