import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '@/hooks/useTheme';

interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial router entries (path). */
  route?: string;
}

function AllProviders({ children, route }: { children: ReactNode; route: string }) {
  return (
    <HelmetProvider>
      <MemoryRouter initialEntries={[route]}>
        <ThemeProvider>{children}</ThemeProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
}

/** Render a component with router, helmet, and theme providers. */
export function renderWithProviders(ui: ReactElement, options: ProviderOptions = {}) {
  const { route = '/', ...rest } = options;
  return render(ui, {
    wrapper: ({ children }) => <AllProviders route={route}>{children}</AllProviders>,
    ...rest,
  });
}

export * from '@testing-library/react';
