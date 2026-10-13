# Cloudflare Pages Deployment with SvelteKit

## Overview

This project uses **SvelteKit** with the **Cloudflare adapter** to deploy to **Cloudflare Pages**. The adapter compiles the app into a Worker (`_worker.js`) and static assets, which Cloudflare Pages then serves.

## Build Output Structure

When you run `npm run build`, SvelteKit creates:

```
.svelte-kit/
├── cloudflare/           ← Cloudflare Pages deployment output
│   ├── _worker.js        ← Worker (server-side rendering)
│   ├── _worker.js.map    ← Source map (debugging)
│   ├── _routes.json      ← Route configuration for Pages Functions
│   ├── _headers          ← HTTP headers configuration
│   ├── _app/             ← Client-side assets (JS/CSS/images)
│   └── ...static files
│
├── output/               ← Internal SvelteKit structure
│   ├── client/           ← Client-side assets only
│   └── server/           ← Server-side code (bundled into _worker.js)
```

## Cloudflare Pages Configuration

### Git Integration Settings

In **Cloudflare Dashboard** > **Pages** > **Your Project** > **Settings** > **Builds & Deployments**:

```
Framework preset:       SvelteKit
Build command:          npm run build
Build output directory: .svelte-kit/cloudflare
```

This tells Cloudflare Pages to:
1. Run `npm run build` to compile your project
2. Serve everything in `.svelte-kit/cloudflare/` as the deployment

## .assetsignore File

**File**: `.assetsignore` (in project root)

**Purpose**: Tells Cloudflare Pages which files in the build output should NOT be served as static assets.

**Why it matters**:
- Without `.assetsignore`, Cloudflare Pages attempts to serve all files as static
- Files like `_worker.js` (the Worker) and `*.map` (source maps) shouldn't be exposed
- Config files and dependencies should be excluded for security and performance

### What Gets Excluded

The `.assetsignore` file excludes:

| Category | Examples | Reason |
|----------|----------|--------|
| Worker/Functions | `_worker.js`, `_worker.js.map` | Handled by Worker runtime, not served as static |
| Source maps | `*.map` | Debug-only files, unnecessary in production |
| Build config | `wrangler*.toml`, `vite.config.js` | Config files, not user-facing |
| Dependencies | `node_modules/`, `package.json` | Not deployed, unnecessary overhead |
| Secrets/env | `.env`, `.env.*` | Security risk if exposed |
| Version control | `.git/`, `.gitignore` | Not for public distribution |

### What Does NOT Get Excluded

These files ARE served as static assets (this is correct):

- `index.html` — entry point
- `./_app/*.js` — client-side JavaScript
- `./_app/*.css` — stylesheets
- Images, fonts, static files
- `_routes.json` — routing config (needed by Pages Functions)
- `_headers`, `_redirects` — HTTP configuration

## Important Notes

### Local Development with Wrangler

If you run `wrangler dev` locally:
- `.assetsignore` is **NOT used** (Wrangler reads `wrangler.toml` instead)
- The `wrangler.toml` config explicitly specifies assets directory:
  ```toml
  [assets]
  directory = "./.svelte-kit/output/client/"
  binding = "ASSETS"
  ```

### Static Assets vs. Worker Code

- **Static assets** (served by Pages CDN): HTML, CSS, JS, images in `_app/`
- **Worker code** (`_worker.js`): Server-side rendering, API routes, edge logic

The `.assetsignore` file ensures the Worker code stays on the edge and isn't replicated as static files.

### Don't Commit .assetsignore?

The `.assetsignore` file should be:
- ✅ **Committed to git** — it's needed by Cloudflare Pages during CI/CD
- ✅ **Part of your repo** — same as `.gitignore`
- ❌ NOT in `.gitignore` — it must be uploaded for Pages to read it

Current recommendation: **Add `.assetsignore` to git**.

```bash
git add .assetsignore
git commit -m "Add .assetsignore for Cloudflare Pages static asset filtering"
```

## Deployment Flow

1. **Push to GitHub** — commit triggers Cloudflare Pages build
2. **Build step** — `npm run build` creates `.svelte-kit/cloudflare/`
3. **Filter step** — Cloudflare Pages applies `.assetsignore` rules
4. **Deploy step** — Remaining files deployed to CDN + Worker

## Troubleshooting

### Problem: Large bundle size or slow pages
- **Check**: Are `.map` files being served? (They shouldn't be)
- **Fix**: Ensure `.assetsignore` has `*.map` and `_worker.js.map`

### Problem: Worker errors during Pages deployment
- **Check**: Is `_worker.js` listed in your `.assetsignore`?
- **Fix**: No, don't exclude `_worker.js` — Pages Functions needs it

### Problem: Route errors or 404s
- **Check**: Is `_routes.json` being excluded?
- **Fix**: No, keep `_routes.json` — don't exclude it

### Problem: Config files visible publicly
- **Check**: Are `.env`, `wrangler.toml` showing up?
- **Fix**: Add them to `.assetsignore`

## References

- [SvelteKit Adapter Cloudflare](https://kit.svelte.dev/docs/adapter-cloudflare)
- [Cloudflare Pages Build Configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/routing/)
