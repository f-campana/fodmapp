import { render, screen, waitFor } from "@testing-library/react";

import { describe, expect, it } from "vitest";

import { Portal } from "./portal";

describe("Portal", () => {
  it("renders children into the provided container", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    render(
      <Portal container={container}>
        <p>Contenu portalisé</p>
      </Portal>,
    );

    await waitFor(() => {
      expect(container).toHaveTextContent("Contenu portalisé");
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
