import 'vitest';

interface CustomMatchers<R = unknown> {
  toHaveNoViolations(): R;
}

declare module 'vitest' {
  /* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any */
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
  /* eslint-enable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any */
}
