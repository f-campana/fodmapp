export const nativeSelectRecommendedUsageCode = `import { NativeSelect } from "@fodmap/ui";

export function Example() {
  return (
    <div>
      <label htmlFor="fallback-grain">Fallback grain</label>
      <NativeSelect id="fallback-grain" defaultValue="rice">
        <option value="rice">Rice</option>
        <option value="oats">Oats</option>
        <option value="quinoa">Quinoa</option>
      </NativeSelect>
    </div>
  );
}
`;
