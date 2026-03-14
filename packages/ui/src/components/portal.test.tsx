import { render, screen, waitFor, within } from "@testing-library/react";

import { describe, expect, it } from "vitest";

import { Portal } from "./portal";

describe("Portal", () => {
  it("defaults to mounting children in document.body", async () => {
    const { container } = render(
      <Portal>
        <p>Body mounted content</p>
      </Portal>,
    );

    await waitFor(() => {
      expect(document.body).toHaveTextContent("Body mounted content");
    });

    expect(container).not.toHaveTextContent("Body mounted content");
  });

  it("renders children into the provided container", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    render(
      <Portal container={container}>
        <p>Custom mounted content</p>
      </Portal>,
    );

    await waitFor(() => {
      expect(
        within(container).getByText("Custom mounted content"),
      ).toBeInTheDocument();
    });

    container.remove();
  });

  it("renders inline when disabled", () => {
    render(
      <Portal disabled>
        <p>Inline</p>
      </Portal>,
    );

    expect(screen.getByText("Inline")).toBeInTheDocument();
  });
});
