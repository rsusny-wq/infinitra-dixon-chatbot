import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';

// Simple wrapper for basic testing - no navigation needed for minimal setup
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestWrapper, ...options });

export * from '@testing-library/react-native';
export { customRender as render };
