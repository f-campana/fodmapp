import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BarcodeManualInput } from "../BarcodeManualInput";

describe("BarcodeManualInput", () => {
  it("accepts digits only and submits normalized barcode", () => {
    const onSubmit = vi.fn();
    render(<BarcodeManualInput onSubmit={onSubmit} />);

    const input = screen.getByRole("textbox", { name: "Enter barcode" }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "03A6000291452" } });
    expect(input.value).toBe("036000291452");

    fireEvent.click(screen.getByRole("button", { name: "Lookup" }));
    expect(onSubmit).toHaveBeenCalledWith("0036000291452");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(input).not.toHaveAttribute("aria-invalid", "true");
  });

  it("shows validation error for invalid barcode", () => {
    const onSubmit = vi.fn();
    render(<BarcodeManualInput onSubmit={onSubmit} />);

    const input = screen.getByRole("textbox", { name: "Enter barcode" }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "4006381333932" } });
    fireEvent.click(screen.getByRole("button", { name: "Lookup" }));

    const error = screen.getByRole("alert");
    const errorId = error.getAttribute("id");

    expect(onSubmit).not.toHaveBeenCalled();
    expect(error).toHaveTextContent("check digit");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(errorId).toBeTruthy();
    expect(input).toHaveAttribute("aria-describedby", errorId);
    expect(input).toHaveAttribute("aria-errormessage", errorId);
  });

  it("shows required error for empty submit", () => {
    const onSubmit = vi.fn();
    render(<BarcodeManualInput onSubmit={onSubmit} />);

    const input = screen.getByRole("textbox", { name: "Enter barcode" });
    fireEvent.click(screen.getByRole("button", { name: "Lookup" }));

    const error = screen.getByRole("alert");
    const errorId = error.getAttribute("id");

    expect(onSubmit).not.toHaveBeenCalled();
    expect(error).toHaveTextContent("Barcode is required");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(errorId).toBeTruthy();
    expect(input).toHaveAttribute("aria-describedby", errorId);
    expect(input).toHaveAttribute("aria-errormessage", errorId);
  });

  it("marks controls disabled when disabled is true", () => {
    render(<BarcodeManualInput onSubmit={vi.fn()} disabled />);

    expect(screen.getByRole("textbox", { name: "Enter barcode" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Lookup" })).toBeDisabled();
  });
});
