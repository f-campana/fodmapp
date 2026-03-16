export const kbdRecommendedUsageCode = `import { Kbd, KbdGroup } from "@fodmapp/ui/kbd";

export function Example() {
  return (
    <KbdGroup>
      <Kbd>Cmd</Kbd>
      <span aria-hidden="true">+</span>
      <Kbd>K</Kbd>
    </KbdGroup>
  );
}
`;
