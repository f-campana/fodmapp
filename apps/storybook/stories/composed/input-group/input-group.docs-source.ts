export const inputGroupRecommendedUsageCode = `import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@fodmap/ui";

export function Example() {
  return (
    <InputGroup>
      <InputGroupText>https://</InputGroupText>
      <InputGroupInput placeholder="mon-profil" />
      <InputGroupAddon>.fodmap.app</InputGroupAddon>
    </InputGroup>
  );
}
`;
