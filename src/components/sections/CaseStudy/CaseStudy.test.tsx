import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { CaseStudy } from './CaseStudy';
import { flagshipCaseStudy } from '@/content/caseStudies';

describe('CaseStudy', () => {
  it('renders the case-study title and summary', () => {
    renderWithProviders(<CaseStudy />);
    expect(
      screen.getByRole('heading', { level: 2, name: flagshipCaseStudy.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(flagshipCaseStudy.summary)).toBeInTheDocument();
  });

  it('renders the flow diagram steps', () => {
    renderWithProviders(<CaseStudy />);
    for (const step of flagshipCaseStudy.flow) {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    }
  });

  it('renders the outcome values', () => {
    renderWithProviders(<CaseStudy />);
    for (const outcome of flagshipCaseStudy.outcomes) {
      expect(screen.getByText(outcome.value)).toBeInTheDocument();
    }
  });
});
