export const selectRecommendedUsageCode = `import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@fodmap/ui";

export function Example() {
  return (
    <Select>
      <SelectTrigger aria-label="Choisir une vue">
        <SelectValue placeholder="Choisir une vue" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Mon compte</SelectLabel>
          <SelectItem value="profil">Profil</SelectItem>
          <SelectItem value="parametres">Paramètres</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
`;
