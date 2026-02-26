declare module "jest-axe" {
  export function axe(
    node: Element | DocumentFragment,
    config?: unknown,
  ): Promise<unknown>;
  export const toHaveNoViolations: any;
}
