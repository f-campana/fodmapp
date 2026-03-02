import * as React from "react";

import { createPortal } from "react-dom";

export interface PortalProps {
  children: React.ReactNode;
  container?: Element | DocumentFragment | null;
  disabled?: boolean;
}

function Portal({ children, container, disabled = false }: PortalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (disabled) {
    return children;
  }

  if (!mounted) {
    return null;
  }

  const target = container ?? globalThis.document?.body ?? null;
  if (!target) {
    return null;
  }

  return createPortal(children, target);
}

export { Portal };
