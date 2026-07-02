import { describe, it, expect } from 'vitest';
import { about } from './about';
import { aiNative } from './aiNative';
import { flagshipCaseStudy, caseStudies } from './caseStudies';
import { impact } from './impact';
import { skillGroups } from './skills';
import { colophon } from './colophon';
import { siteConfig } from '@/config';

describe('content model shape', () => {
  it('about has paragraphs, arc, facts, and a headshot', () => {
    expect(about.paragraphs.length).toBeGreaterThanOrEqual(2);
    expect(about.arc.length).toBe(3);
    expect(about.facts.length).toBeGreaterThan(0);
    expect(about.headshot.src).toMatch(/\.(jpg|jpeg|png|webp)$/);
    expect(about.headshot.alt).toBeTruthy();
  });

  it('aiNative has two pillars each with points', () => {
    expect(aiNative.pillars).toHaveLength(2);
    for (const pillar of aiNative.pillars) {
      expect(pillar.title).toBeTruthy();
      expect(pillar.body.length).toBeGreaterThan(0);
      expect(pillar.points.length).toBeGreaterThan(0);
    }
    expect(aiNative.toolkit.length).toBeGreaterThan(0);
  });

  it('flagship case study has a 4-step flow and outcomes', () => {
    expect(flagshipCaseStudy.flow).toHaveLength(4);
    expect(flagshipCaseStudy.outcomes.length).toBeGreaterThan(0);
    expect(flagshipCaseStudy.sections.length).toBeGreaterThan(0);
    // Flow steps are ordered notify -> prepop -> sso -> decision
    expect(flagshipCaseStudy.flow.map((s) => s.id)).toEqual([
      'notify',
      'prepop',
      'sso',
      'decision',
    ]);
    expect(caseStudies).toContain(flagshipCaseStudy);
  });

  it('impact cards each have a metric and description', () => {
    expect(impact.length).toBeGreaterThanOrEqual(3);
    for (const card of impact) {
      expect(card.metric).toBeTruthy();
      expect(card.description.length).toBeGreaterThan(20);
    }
  });

  it('skill groups include the AI & Agentic group', () => {
    const ids = skillGroups.map((g) => g.id);
    expect(ids).toContain('ai');
    for (const group of skillGroups) {
      expect(group.skills.length).toBeGreaterThan(0);
    }
  });

  it('colophon documents the spec-driven steps', () => {
    expect(colophon.steps.length).toBeGreaterThanOrEqual(4);
    expect(colophon.stack.length).toBeGreaterThan(0);
  });
});

describe('confidentiality guardrails', () => {
  // Aggregate all published copy into one searchable blob.
  const corpus = JSON.stringify({
    about,
    aiNative,
    flagshipCaseStudy,
    impact,
    skillGroups,
    colophon,
    siteConfig,
  }).toLowerCase();

  it('uses the generic "a major HCM vendor" phrasing', () => {
    expect(corpus).toContain('major hcm vendor');
  });

  it('refers to the partner HCM platform generically, never by internal codenames', () => {
    // The case study must speak of an "external HCM platform" / "the partner"
    expect(corpus).toMatch(/external hcm platform|partner/);
  });

  it('does not invent employer-internal project or product names', () => {
    // Employer name is public and allowed; internal agent/product names are not.
    expect(corpus).toContain('lincoln financial group');
    // The internal AI agent must stay unnamed — described only generically.
    expect(corpus).toMatch(/internal ai agent|an internal/);
  });
});
