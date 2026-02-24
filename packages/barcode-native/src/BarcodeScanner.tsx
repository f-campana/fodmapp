import type { ReactNode } from "react";

import type { BarcodeRenderProps, VisionScannerOptions } from "./types";
import { useVisionBarcodeScanner } from "./useVisionBarcodeScanner";

export interface BarcodeScannerProps extends VisionScannerOptions {
  manualEntryVisible?: boolean;
  onManualEntryPress?: () => void;
  render: (props: BarcodeRenderProps) => ReactNode;
}

export function BarcodeScanner(props: BarcodeScannerProps) {
  const onCodeScanned = useVisionBarcodeScanner({
    onDetected: props.onDetected,
    dedupeWindowMs: props.dedupeWindowMs,
    acceptAllTypes: props.acceptAllTypes,
    now: props.now,
  });

  return (
    <>
      {props.render({
        onCodeScanned,
        manualEntryVisible: props.manualEntryVisible ?? true,
        onManualEntryPress: props.onManualEntryPress,
      })}
    </>
  );
}
