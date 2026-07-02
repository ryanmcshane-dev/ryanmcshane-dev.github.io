export interface FlowStep {
  id: string;
  label: string;
  detail: string;
  /** Which side of the boundary this step lives on. */
  actor: 'partner' | 'ours' | 'user';
}

export interface CaseStudy {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  /** Narrative blocks, each with a heading. */
  sections: { heading: string; body: string[] }[];
  /** Ordered steps for the flow diagram. */
  flow: FlowStep[];
  outcomes: { label: string; value: string }[];
  framing: string;
}

export const flagshipCaseStudy: CaseStudy = {
  id: 'eoi-integration',
  eyebrow: 'Flagship case study',
  title: 'A spec-driven EOI integration, delivered in ~4 weeks',
  summary:
    'I led a complex inbound/outbound API integration between our platform and a new external HCM platform — we were the first carrier to go live on it. An AI-accelerated design spec earned architect sign-off with minimal revisions, and developers implemented directly from its task list, cutting a projected 2+ month effort to roughly four weeks.',
  sections: [
    {
      heading: 'Context',
      body: [
        'We needed a full inbound and outbound integration between our platform and a new external HCM platform, and we were the first carrier to go live on it — so there was no established pattern to copy. The flow had to handle Evidence of Insurability (EOI) end to end.',
      ],
    },
    {
      heading: 'AI-accelerated design',
      body: [
        'I used Claude to analyze the partner’s API documentation, including their OpenAPI / Swagger specs, then co-authored the design spec against a reusable template that instructs the AI how to populate each section. The spec covered the complete inbound and outbound flow between the partner platform and ours.',
        'The human judgment — architecting the flow, and reviewing and refining the spec — is what made the AI acceleration work. This was craft, not autopilot.',
      ],
    },
    {
      heading: 'Outcome',
      body: [
        'The AI-accelerated spec earned architect sign-off with minimal revisions, and developers implemented directly from the spec’s AI-executable task list. That cut a projected 2+ month effort down to roughly four weeks.',
      ],
    },
  ],
  flow: [
    {
      id: 'notify',
      actor: 'partner',
      label: 'Enrollment notification',
      detail:
        'The HCM notifies our endpoint when an employee finishes enrollment and at least one product requires EOI.',
    },
    {
      id: 'prepop',
      actor: 'ours',
      label: 'Build pre-pop resource',
      detail:
        'Our services build a prepopulated “pre-pop” resource from the enrolled products, requested coverage amounts, and relevant enrollment details.',
    },
    {
      id: 'sso',
      actor: 'user',
      label: 'Employee follows SSO link',
      detail:
        'The employee follows the SSO link from the HCM; their EOI application opens auto-filled from the pre-pop resource.',
    },
    {
      id: 'decision',
      actor: 'ours',
      label: 'Return EOI decision',
      detail:
        'Once the application is complete, we make an outbound call returning the EOI decision to the HCM, keyed to an id from the original notification payload.',
    },
  ],
  outcomes: [
    { label: 'Projected effort', value: '2+ months' },
    { label: 'Actual delivery', value: '~4 weeks' },
    { label: 'Architect revisions', value: 'Minimal' },
    { label: 'First carrier live', value: 'On the platform' },
  ],
  framing:
    'The win wasn’t “AI wrote the code.” It was that a well-architected, AI-accelerated spec turned an ambiguous, first-of-its-kind integration into a decomposed task list a team could execute directly.',
};

export const caseStudies: CaseStudy[] = [flagshipCaseStudy];
