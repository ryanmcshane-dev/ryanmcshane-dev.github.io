import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlowDiagram } from './FlowDiagram';
import { flagshipCaseStudy } from '@/content/caseStudies';

describe('FlowDiagram', () => {
  it('renders every flow step as an ordered list item', () => {
    render(<FlowDiagram steps={flagshipCaseStudy.flow} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(flagshipCaseStudy.flow.length);
  });

  it('renders each step label and detail', () => {
    render(<FlowDiagram steps={flagshipCaseStudy.flow} />);
    for (const step of flagshipCaseStudy.flow) {
      expect(screen.getByText(step.label)).toBeInTheDocument();
      expect(screen.getByText(step.detail)).toBeInTheDocument();
    }
  });

  it('numbers steps starting at 01', () => {
    render(<FlowDiagram steps={flagshipCaseStudy.flow} />);
    expect(screen.getByText('01')).toBeInTheDocument();
  });
});
