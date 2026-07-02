import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Container } from './Container';

describe('Container', () => {
  it('renders its children', () => {
    render(<Container>hello</Container>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('renders as the requested element', () => {
    render(<Container as="section">content</Container>);
    expect(screen.getByText('content').tagName).toBe('SECTION');
  });

  it('applies a passed className', () => {
    render(<Container className="custom">x</Container>);
    expect(screen.getByText('x').className).toContain('custom');
  });
});
