# CLAUDE.md — Ryan McShane Portfolio

Operating guide for working in this repository. Read this before making changes.

## What this is

Ryan McShane's personal portfolio site — a job-search asset targeting **senior software /
AI engineer roles at top-tier remote product companies**. Its #1 job is to make a strong,
credible impression on senior/AI-focused hiring managers, with the centerpiece being
Ryan's fluency in **AI-native engineering: spec-driven development and agentic coding**.

The site is built spec-driven and agentically, and documents that process (`/colophon`) as
proof of the method. Dogfood the methodology when working here.

## 🔒 Confidentiality guardrails (non-negotiable)

Naming the employer **Lincoln Financial Group is fine** (public). Do **NOT** publish:

- The name of the employer's business partner / the specific external HCM platform in the
  flagship case study. Refer to it generically ("an external HCM platform", "the partner").
- The internal AI agent or any internal project/product names. Refer generically ("an
  internal AI agent").
- The specific HCM vendor that became a customer. Use exactly **"a major HCM vendor"**.
- Any proprietary employer internals. Keep them generic.
- **Never invent metrics or details.** Only use the figures already present in the content
  files. If asked to add a claim without a source, flag it — do not fabricate.

Before shipping content changes, scan for leaked names and invented numbers.

## Tech stack

- **Vite + React 18 + TypeScript (strict)**. Static output for GitHub Pages, `base: '/'`.
- **Routing:** `react-router-dom` (BrowserRouter). GH Pages deep-link fallback via
  `scripts/postbuild.mjs` (copies `dist/index.html` → `dist/404.html`).
- **Styling:** CSS Modules + design tokens (CSS custom properties in `src/styles/`). No
  Tailwind, no CSS-in-JS. Dark mode via `[data-theme]` on `<html>`.
- **Content model:** typed data in `src/content/*.ts`. MDX (`@mdx-js/rollup`) is wired for
  `/writing` posts (`src/content/writing/*.mdx`) but there are no posts yet.
- **Head/SEO:** `react-helmet-async` (`SeoHead` component).
- **Fonts:** self-hosted via `@fontsource` (Inter + JetBrains Mono). No external font CDNs.
- **Motion:** CSS transitions + `useReveal` (IntersectionObserver). No animation libraries.
  Everything must respect `prefers-reduced-motion`.

## Conventions

- **Keep dependencies lean.** Do not add a heavy library without a clear, discussed reason.
- **Content lives as data, not in JSX.** Copy goes in `src/content/*.ts`; components render it.
- One component per folder: `Foo/Foo.tsx`, `Foo/Foo.module.css`, `Foo/Foo.test.tsx`.
- Use the `@/` alias for `src/` imports.
- Accessibility is a requirement, not a nice-to-have: semantic landmarks, keyboard nav,
  visible focus, AA contrast in both themes, alt text.
- **Every component and content module ships with meaningful unit tests.**

## Directory structure

```
src/
  components/     UI + section components (one folder each, with .module.css + .test.tsx)
  content/        typed site content (profile, about, aiNative, caseStudies, impact, skills)
    writing/      MDX blog posts (empty for now)
  hooks/          useReveal, useTheme, etc.
  pages/          route-level pages (Home, Writing, Colophon, NotFound)
  styles/         tokens.css, global.css
  test/           vitest setup + type augmentation
scripts/          build helpers (postbuild 404 copy)
public/           static assets (favicon, images, resume.pdf, og image, robots, sitemap)
```

## Commands

- `npm run dev` — local dev server.
- `npm test` — Vitest (run once). **100% must pass before a task is "done" or CI deploys.**
- `npm run typecheck` — strict TS, no emit.
- `npm run lint` — ESLint (incl. jsx-a11y).
- `npm run build` — typecheck + Vite build + `404.html` copy.
- `npm run preview` — serve the production build locally.

## How to add content

- **Impact card:** add an entry to `src/content/impact.ts` (respect confidentiality; real
  metrics only).
- **Case study:** add to `src/content/caseStudies.ts`.
- **Skill:** add to the relevant group in `src/content/skills.ts`.
- **Blog post:** drop `src/content/writing/<slug>.mdx` with frontmatter; it auto-appears in
  `/writing`. Link `/writing` back into the nav once at least one post exists.

## How we work here (spec-driven)

The approved spec lives at `~/.claude/plans/` (and is summarized in `/colophon`). Work
task-by-task from the numbered task list. Each task: implement → `npm test` + typecheck +
lint → revise until green → then move on. No task ships red tests.

## Deploy

Push to `main` → GitHub Actions (`.github/workflows/deploy.yml`) runs checks and deploys to
GitHub Pages. Live at https://ryanmcshane.github.io. To add a custom domain later: add
`public/CNAME` with the domain and update the canonical URL in `src/config.ts`.
