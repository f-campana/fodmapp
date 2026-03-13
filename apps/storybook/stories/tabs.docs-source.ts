export const tabsRecommendedUsageCode = `import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@fodmap/ui";

export function Example() {
  return (
    <Tabs defaultValue="ingredients">
      <TabsList>
        <TabsTrigger value="ingredients">Ingrédients</TabsTrigger>
        <TabsTrigger value="preparation">Préparation</TabsTrigger>
      </TabsList>
      <TabsContent value="ingredients">Contenu de référence principal.</TabsContent>
      <TabsContent value="preparation">Guidage secondaire étape par étape.</TabsContent>
    </Tabs>
  );
}
`;
