declare module "jest-axe" {
  export function axe(
    node: Element | DocumentFragment,
    config?: unknown,
  ): Promise<unknown>;
  export const toHaveNoViolations: {
    [key: string]: (...args: unknown[]) => {
      pass: boolean;
      message: () => string;
      actual: unknown;
      expected?: unknown;
    };
  };
}
