export interface ColophonStep {
  phase: string;
  title: string;
  body: string;
}

export interface ColophonContent {
  intro: string[];
  steps: ColophonStep[];
  stack: { group: string; items: string[] }[];
  closing: string;
}

export const colophon: ColophonContent = {
  intro: [
    'This site is a small proof of the method it describes. It was built spec-driven and agentically: I wrote a design + technical spec first, decomposed it into a numbered task list, and had an AI agent implement it task-by-task while I reviewed and steered every step.',
    'The point isn’t that “AI built a website.” It’s that a clear spec plus a decomposed task list turns an open-ended build into a sequence an agent can execute reliably — the same approach I use on production systems.',
  ],
  steps: [
    {
      phase: '01',
      title: 'Clarify & spec',
      body: 'Answered a short round of clarifying questions (hosting, blog scope, accent color), then produced a design + technical spec: goals, audience, sitemap, content model, tech stack, and design direction — approved before any code.',
    },
    {
      phase: '02',
      title: 'Conventions',
      body: 'Captured project conventions in a CLAUDE.md: confidentiality guardrails, tech stack, directory structure, and how the agent should operate in the repo.',
    },
    {
      phase: '03',
      title: 'Decompose',
      body: 'Broke the build into a numbered task list — scaffold, design system, layout, content model, each section, writing scaffold, SEO, accessibility, CI/CD — sized so each task is independently completable.',
    },
    {
      phase: '04',
      title: 'Implement task-by-task',
      body: 'The agent implemented each task, writing meaningful unit tests alongside the code. Every task ran an iterate-to-green loop: implement → typecheck + lint + test → revise until 100% passing.',
    },
    {
      phase: '05',
      title: 'Review & ship',
      body: 'I reviewed each increment, refined copy and design, and the site deploys to GitHub Pages via GitHub Actions on every push to main.',
    },
  ],
  stack: [
    { group: 'Framework', items: ['Vite', 'React 18', 'TypeScript (strict)'] },
    { group: 'Styling', items: ['CSS Modules', 'Design tokens', 'Dark mode'] },
    { group: 'Content', items: ['Typed data model', 'MDX (writing)'] },
    { group: 'Quality', items: ['Vitest + RTL', 'jest-axe', 'ESLint', 'Prettier'] },
    { group: 'Delivery', items: ['GitHub Actions', 'GitHub Pages'] },
  ],
  closing:
    'No invented metrics, no proprietary details — just the same spec-driven discipline, applied to a portfolio.',
};
