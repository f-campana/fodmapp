export const comboboxRecommendedUsageCode = `import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxList, ComboboxTrigger } from "@fodmap/ui/combobox";

export function Example() {
  return (
    <Combobox>
      <ComboboxTrigger aria-label="Choisir un aliment" />
      <ComboboxContent>
        <ComboboxInput placeholder="Rechercher un aliment" />
        <ComboboxList>
          <ComboboxEmpty>Aucun résultat</ComboboxEmpty>
          <ComboboxGroup heading="Fruits">
            <ComboboxItem value="pomme">Pomme</ComboboxItem>
            <ComboboxItem value="banane">Banane</ComboboxItem>
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
`;
