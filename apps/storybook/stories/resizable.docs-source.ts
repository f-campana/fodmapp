export const resizableRecommendedUsageCode = `import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@fodmap/ui";

export function Example() {
  return (
    <div style={{ height: 320 }}>
      <ResizablePanelGroup defaultLayout={{ notes: 40, editor: 60 }} id="meal-planner-layout">
        <ResizablePanel defaultSize={40} id="notes">
          Notes et contexte de préparation
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={60} id="editor">
          Zone de travail principale
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
`;
