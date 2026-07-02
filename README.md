# ryanmcshane-dev.github.io

Personal portfolio for **Ryan McShane** — Senior Software Engineer & Tech Lead. Built
spec-driven and agentically; the process is documented on-site at `/colophon`.

Live: https://ryanmcshane-dev.github.io

## Tech stack

- **Vite + React 18 + TypeScript** (strict), static output for GitHub Pages
- **CSS Modules + design tokens** (dark mode via `[data-theme]`)
- **react-router-dom** with a `404.html` SPA fallback for deep links
- **MDX** content pipeline for the (currently empty) `/writing` blog
- **Vitest + React Testing Library + jest-axe** for unit and accessibility tests
- Self-hosted fonts (Inter + JetBrains Mono) via `@fontsource`

## Local development

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
```

### Quality checks

```bash
npm run typecheck   # strict TypeScript, no emit
npm run lint        # ESLint (incl. jsx-a11y)
npm test            # Vitest — must be 100% green
npm run format      # Prettier (write)
```

### Production build

```bash
npm run build       # typecheck + Vite build + copy index.html -> 404.html
npm run preview     # serve the production build locally
```

## Editing content

Content is data, not markup — edit the typed files in `src/content/`:

- `profile` → `src/config.ts` (name, role, tagline, links)
- `about.ts`, `aiNative.ts`, `caseStudies.ts`, `impact.ts`, `skills.ts`, `colophon.ts`
- Blog posts: drop an `.mdx` file in `src/content/writing/` (see `example-post.mdx`).
  It appears automatically once `draft` is `false`. Add a `Writing` link to
  `navItems` in `src/components/Header/Header.tsx` once at least one post exists.

Confidentiality rules for content live in [CLAUDE.md](./CLAUDE.md) — read before editing copy.

## Assets to provide

- **Headshot** → `public/images/ryan.jpg` (About section; a placeholder shows until added)
- **Resume** → `public/resume.pdf` (linked from hero/contact), or remove the link in `src/config.ts`
- **OG image** → regenerate with `npm run generate:og` if the name/title changes

## Deployment

Deploys automatically to GitHub Pages via GitHub Actions
([`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)) on every push to `main`:
typecheck → lint → test → build → deploy. No `gh-pages` branch.

**One-time setup:** in the repo, go to **Settings → Pages → Build and deployment →
Source: GitHub Actions**.

### Custom domain (later)

Add `public/CNAME` containing your domain and update `siteUrl` in `src/config.ts`.

## Project structure

```
src/
  components/   UI + section components (each: .tsx + .module.css + .test.tsx)
  content/      typed site content + MDX writing
  hooks/        useTheme, useReveal
  pages/        Home, Writing, WritingPost, Colophon, NotFound
  styles/       tokens.css, global.css
  test/         Vitest setup + helpers
scripts/        postbuild (404 fallback), generate-og
public/         favicon, robots.txt, sitemap.xml, og-image.png, images/
```
