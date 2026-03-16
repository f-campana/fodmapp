export const commandRecommendedUsageCode = `import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@fodmap/ui/command";

export function Example() {
  return (
    <Command label="Palette clinique">
      <CommandInput placeholder="Rechercher une action" />
      <CommandList>
        <CommandEmpty>Aucun resultat</CommandEmpty>
        <CommandGroup heading="Plan du jour">
          <CommandItem value="journal-midi">
            Ouvrir le journal du midi
            <CommandShortcut>⌘J</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
`;
