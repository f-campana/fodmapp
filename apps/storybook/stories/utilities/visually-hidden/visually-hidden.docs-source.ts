export const visuallyHiddenRecommendedUsageCode = `import { VisuallyHidden } from "@fodmapp/ui/visually-hidden";

export function Example() {
  return (
    <button type="button">
      <svg aria-hidden="true" viewBox="0 0 16 16" />
      <VisuallyHidden>Open navigation</VisuallyHidden>
    </button>
  );
}
`;
