import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BarcodeScanner } from "../BarcodeScanner";
import { createVisionBarcodeHandler } from "../useVisionBarcodeScanner";

describe("createVisionBarcodeHandler", () => {
  it("dedupes rapid duplicate scans", () => {
    let now = 1_000;
    const onDetected = vi.fn();
    const handler = createVisionBarcodeHandler({
      onDetected,
      now: () => now,
      dedupeWindowMs: 2000,
    });

    handler([{ value: "4006381333931", type: "ean-13" }]);
    handler([{ value: "4006381333931", type: "ean-13" }]);
    now = 4_000;
    handler([{ value: "4006381333931", type: "ean-13" }]);

    expect(onDetected).toHaveBeenCalledTimes(2);
  });

  it("ignores unsupported scan format", () => {
    const onDetected = vi.fn();
    const handler = createVisionBarcodeHandler({
      onDetected,
    });

    handler([{ value: "4006381333931", type: "qr" }]);

    expect(onDetected).not.toHaveBeenCalled();
  });
});

describe("BarcodeScanner", () => {
  it("shows manual entry action by default", () => {
    const renderSpy = vi.fn(() => null);

    render(
      <BarcodeScanner
        onDetected={() => undefined}
        render={renderSpy}
      />,
    );

    expect(renderSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        manualEntryVisible: true,
      }),
    );
  });
});
