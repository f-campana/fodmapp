export const accordionRecommendedUsageCode = `import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@fodmapp/ui/accordion";

export function Example() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>Quels aliments remplacer ?</AccordionTrigger>
        <AccordionContent>
          Remplacez l'oignon par de la ciboulette pour limiter les FODMAP.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Comment préparer les légumes ?</AccordionTrigger>
        <AccordionContent>
          Faites une cuisson douce et testez des portions progressives.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
`;
