import * as React from "react";

interface UseCopyToClipboardReturn {
  copy: (text: string) => Promise<boolean>;
  copiedText?: string;
  isCopied: boolean;
}

function useCopyToClipboard(): UseCopyToClipboardReturn {
  const [copiedText, setCopiedText] = React.useState<string>();
  const timeoutRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = React.useCallback(async (text: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);

      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setCopiedText(undefined);
      }, 2000);

      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    copy,
    copiedText,
    isCopied: copiedText !== undefined,
  };
}

export { useCopyToClipboard };
export type { UseCopyToClipboardReturn };
