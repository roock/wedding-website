# Copilot Instructions for wedding-website

SvelteKit app deployed to Cloudflare Pages/Workers (via `@sveltejs/adapter-cloudflare`), backed by
Cloudflare D1 (RSVPs), KV (site settings/content/theme/pages), and R2 (image storage).

## Commands

- `npm run dev` – frontend only (Vite dev server at `http://localhost:5173`). Cloudflare bindings
  (D1/KV/R2) are **not** available this way.
- `wrangler dev` (add `--local` for local D1/KV/R2 persistence, or `--remote` to hit real cloud
  resources) – runs the built Worker with bindings from `wrangler.toml`. Requires `npm run build`
  first since `main` points at `.svelte-kit/cloudflare/_worker.js`.
- `npm run build` – production build.
- `npm run lint` – ESLint (flat config, `eslint-plugin-svelte` + `globals`). No test suite exists
  in this repo; do not add one unless asked.
- Formatting: Prettier via `.prettierrc` (single quotes, no trailing commas, printWidth 100,
  `prettier-plugin-svelte` for `.svelte` files).
- Local D1 setup: `wrangler d1 execute wedding-rsvps-preview --local --file=./schema.sql`.

## Architecture

- **Rendering/auth boundary is `src/hooks.server.js`**: it preloads `wedding_settings` from
  `IMAGES_KV` on every request and enforces a "restrict to home page" mode (redirects non
  home/about routes to `/` when enabled in settings). Actual `/admin` and `/api` access control is
  delegated to **Cloudflare Zero Trust**, not application code — don't try to implement auth checks
  in-app for those paths.
- **Cloudflare bindings are accessed via `platform.env` inside `+server.js`/`+page.server.js`**
  (e.g. `platform.env.RSVPS` for D1, `platform.env.IMAGES_KV` for KV, `platform.env.IMAGES_BUCKET`
  for R2). These only exist when running through `wrangler dev`/deployed, not plain `vite dev`.
- **Staging vs. production is an infrastructure split, not a code branch**: separate Cloudflare
  Pages projects/D1 databases/KV namespaces/R2 buckets per environment (see `[env.preview]` /
  `[env.production]` in `wrangler.toml`), plus `PROD_IMAGES_KV`/`PROD_IMAGES_BUCKET` vars used
  specifically by the admin "copy staging to production" sync feature. Don't assume `ENVIRONMENT`
  branching exists elsewhere in the code.
- **Two D1 migration directories exist and are NOT interchangeable**: `migrations/` (repo root,
  sparse numbering: 001, 0002, 007, 008) is what's actually applied via `wrangler d1 migrations`
  against the real database. `src/lib/db/migrations/` (001-006) is an older/parallel set. When
  adding a schema change, check both directories and follow the numbering already present in
  `migrations/` at the root — that's the source of truth for `wrangler d1`.
- **Content model has two distinct systems** — don't conflate them:
  - **Page Builder** (`src/lib/page-builder/schema.js` + `store.js`): drag/drop pages made of typed
    `sections[]` (TEXT, IMAGE, HERO, GALLERY, COLUMNS, BUTTON, etc.) defined declaratively in
    `SECTION_SCHEMA`. `createSection(type)` builds a section with schema defaults + a unique id.
    The Svelte store handles load/save/add/remove/reorder against `/api/admin/pages/[pageId]`.
  - **Site Content store** (`src/lib/stores/content.js`): simple key → value text/content blocks
    (e.g. `home_heading`) fetched from `/api/content`, cached in a writable store, used for content
    that isn't part of a page-builder page.
  - Both are ultimately persisted as JSON in KV — expect `.get(key, 'json')` / `JSON.stringify()`
    patterns in the corresponding API routes.
- **Images must go through the Gallery**: R2 is the single source of truth for uploaded images;
  admin gallery upload endpoints generate resized variants (thumb/medium) via R2, and other admin
  features (page builder, theme, content) reference already-uploaded gallery images rather than
  uploading directly.
- **Theming** (`src/lib/theme/presets.js`, `src/lib/theme/fonts.js`): presets bundle a color
  palette + heading/body fonts; fonts are categorized (serif/sans-serif/display/other) with
  `getGoogleFontsUrl()` building the Google Fonts `<link>` URL, falling back to system fonts when
  needed. Theme settings are stored in KV and applied via CSS custom properties
  (`src/lib/styles/theme.css`).
- API route conventions: generate a request id via `crypto.randomUUID()` for log tracing, validate
  required fields before touching D1/KV/R2, return `{ error, details }` JSON with appropriate 4xx
  status on invalid input, and treat non-critical failures (e.g. confirmation email send) as
  non-fatal — log and continue rather than failing the whole request.

## Key docs

Feature-specific admin behavior is documented in `docs/`: `admin-settings-guide.md`,
`theme-system-guide.md`, `font-customization-guide.md`, `content-setup-guide.md`,
`gallery-guide.md`, `rsvp-admin-guide.md`. Check the relevant guide before changing an admin
feature's behavior, and update it if the change affects documented user-facing behavior.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format for all commit messages,
e.g. `feat(admin): add gallery bulk delete`, `fix(rsvp): handle empty guest list`,
`chore: update devcontainer post-create command`. Use types such as `feat`, `fix`, `docs`,
`refactor`, `test`, `build`, `ci`, `chore`, and `style`.
