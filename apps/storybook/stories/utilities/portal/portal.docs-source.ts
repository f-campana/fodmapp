export const portalRecommendedUsageCode = `import { useState } from "react";

import { Portal } from "@fodmapp/ui/portal";

export function Example() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <Portal container={container}>
          <div className="rounded-xl border bg-card px-3 py-2 shadow-sm">
            Mounted through local container
          </div>
        </Portal>
      </div>
      <div ref={setContainer} />
    </div>
  );
}
`;
