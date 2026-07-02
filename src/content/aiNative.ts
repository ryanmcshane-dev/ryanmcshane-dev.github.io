export interface Pillar {
  id: string;
  title: string;
  tagline: string;
  body: string[];
  /** Concrete points rendered as a checklist. */
  points: string[];
}

export interface AiNativeContent {
  intro: string;
  statement: string;
  pillars: Pillar[];
  /** Agentic tooling Ryan works hands-on with. */
  toolkit: string[];
}

export const aiNative: AiNativeContent = {
  intro:
    'In the agentic era, the highest-leverage engineering skill is no longer typing code — it’s designing systems precisely enough that both people and agents can build them. I work at that layer, and I build the workflows that make it real.',
  statement:
    'I’m a builder of agentic workflows, not just a consumer of AI tools — I design the specs, skills, and guardrails that let agents do real engineering work safely.',
  pillars: [
    {
      id: 'spec-driven',
      title: 'Spec-driven development',
      tagline: 'The spec is the highest-leverage artifact.',
      body: [
        'I treat the design spec as the primary deliverable: gather requirements, architect the solution, then decompose it into discrete, AI-executable tasks — small enough that an agent can reliably “complete task 1.1” on its own.',
        'I use AI to accelerate the spec artifacts — architecture diagrams, system context, data models — while personally reviewing and refining every plan. The human judgment in architecting the flow is what makes the acceleration safe; the AI handles the mechanical weight.',
      ],
      points: [
        'Requirements → architecture → decomposed, agent-ready task list',
        'Reusable spec templates that instruct the AI how to populate each section',
        'AI-drafted diagrams, system context, and data models — human-reviewed',
        'Compressed design + delivery from weeks to days',
      ],
    },
    {
      id: 'agentic-craft',
      title: 'Agentic coding craft',
      tagline: 'Hands-on with the tools of the trade.',
      body: [
        'I’m a Claude Code power user and an AI-adoption leader on my team. I build with the full agentic toolchain — skills, hooks, CLAUDE.md conventions, subagents, and MCP / tool integrations — and set the patterns others follow.',
        'I was a key contributor to an internal AI agent that unifies 30+ microservices using retrieval-augmented generation and a knowledge graph, with secure tool-calling skills for code review, ticket and defect analysis, and log querying.',
      ],
      points: [
        'Claude Code skills, hooks, and CLAUDE.md conventions',
        'Subagents and MCP / tool integrations for real workflows',
        'Secure, scoped tool-calling for code review, defect analysis, log querying',
        'RAG + knowledge-graph agent unifying 30+ microservices',
      ],
    },
  ],
  toolkit: [
    'Claude Code',
    'Skills',
    'Hooks',
    'CLAUDE.md',
    'Subagents',
    'MCP',
    'RAG',
    'Knowledge graphs',
    'Spec templates',
  ],
};
