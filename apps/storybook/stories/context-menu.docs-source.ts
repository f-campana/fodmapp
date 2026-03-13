export const contextMenuRecommendedUsageCode = `import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@fodmap/ui";

export function Example() {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        Clic droit dans la zone de travail
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Mon compte</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem>Profil</ContextMenuItem>
        <ContextMenuItem>Parametres</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
`;
