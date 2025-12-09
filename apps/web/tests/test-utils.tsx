import React, { ReactNode } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';

interface AllTheProvidersProps {
  children: ReactNode;
  session?: any;
}

const AllTheProviders = ({ children, session }: AllTheProvidersProps) => {
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { session?: any }
) => {
  const { session, ...rest } = options || {};
  return rtlRender(ui, {
    wrapper: (props) => <AllTheProviders session={session} {...props} />,
    ...rest,
  });
};

// Re-export everything from testing-library/react
export * from '@testing-library/react';

// Export our custom render function
export { customRender as render };
