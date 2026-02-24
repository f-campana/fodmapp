import type { NormalizedBarcode } from "@fodmap/barcode-core";

export interface VisionDetectedCode {
  value?: string | null;
  type?: string | null;
}

export interface VisionScanEvent {
  rawValue: string;
  type: string | null;
}

export interface VisionScannerOptions {
  onDetected: (barcode: NormalizedBarcode, event: VisionScanEvent) => void;
  dedupeWindowMs?: number;
  acceptAllTypes?: boolean;
  now?: () => number;
}

export interface BarcodeRenderProps {
  onCodeScanned: (codes: VisionDetectedCode[]) => void;
  manualEntryVisible: boolean;
  onManualEntryPress?: () => void;
}
