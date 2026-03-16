export const dropdownMenuRecommendedUsageCode = `import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "@fodmap/ui/dropdown-menu";

export function Example() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Actions du compte</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Profil
          <DropdownMenuShortcut>P</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>Parametres</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
`;
