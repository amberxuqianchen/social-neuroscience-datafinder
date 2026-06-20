# Deployment Guide

This site is a static Next.js (App Router) application. It deploys to **Vercel** with zero configuration and can also be exported as a fully static bundle for any static host.

---

## Part 1 — Push to GitHub

```bash
# from the project root
git init
git add .
git commit -m "Initial commit: Social Neuroscience DataFinder directory"

# create an empty repo on github.com first, then:
git branch -M main
git remote add origin https://github.com/amberxuqianchen/social-neuroscience-datafinder.git
git push -u origin main
```

> Update `SITE.repo` and `SITE.url` in `src/lib/constants.ts` to point at your repository and deployed URL — these are used for the GitHub links and SEO/Open-Graph metadata.

## Part 2 — Deploy to Vercel (recommended)

Vercel detects Next.js automatically; no extra config is needed.

**Option A — Dashboard (no CLI):**

1. Go to <https://vercel.com/new>.
2. "Import Git Repository" and select your GitHub repo (authorize Vercel for the org if prompted).
3. Framework Preset: **Next.js** (auto-detected). Build command `next build`, install command `npm install` — both auto-filled.
4. Click **Deploy**. You'll get a `*.vercel.app` URL in ~1 minute.
5. Every push to `main` redeploys production; every pull request gets its own preview URL — perfect for reviewing dataset contributions.

**Option B — CLI:**

```bash
npm i -g vercel
vercel          # first run links/creates the project (follow prompts)
vercel --prod   # deploy to production
```

### Custom domain

In the Vercel project: **Settings → Domains → Add**, then point your domain's DNS at Vercel as instructed. Update `SITE.url` afterward.

## Part 3 — Alternative: fully static export

Because there is no backend, the site can be exported to plain HTML/CSS/JS.

1. Uncomment `output: "export"` in `next.config.mjs`.
2. Build:

   ```bash
   npm run build
   ```

3. The static site is generated in `out/`. Serve or upload that folder anywhere:

   - **GitHub Pages:** push `out/` to a `gh-pages` branch (or use an action). For project pages served from a subpath, also set `basePath`/`assetPrefix` in `next.config.mjs`.
   - **Netlify:** build command `next build`, publish directory `out`.
   - **Any host / S3 / Cloudflare Pages:** upload the contents of `out/`.

> Note: the dynamic `sitemap.ts` and Image Optimization features are simplest on Vercel. The static export still works fully because every route — including each dataset page — is pre-rendered.

## Continuous deployment summary

| Host          | Setup                         | Auto-deploy on push |
| ------------- | ----------------------------- | ------------------- |
| Vercel        | Import repo, click Deploy     | ✅ (prod + PR previews) |
| Netlify       | Build `next build`, publish `out/` | ✅              |
| GitHub Pages  | Action builds & publishes `out/` | ✅ (with workflow) |

## Troubleshooting

- **Build fails on a contributed dataset:** the JSON is malformed or missing a required field. Run `npm run build` locally to see the exact file and field.
- **Theme flashes on load:** ensure the inline theme script in `src/app/layout.tsx` was not removed.
- **404 on dataset pages after static export to a subpath:** set `basePath` in `next.config.mjs`.
