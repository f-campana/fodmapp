import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@fodmapp/ui/pagination";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function PaginationAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-pagination-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const meta = {
  title: "Primitives/Foundation/Pagination",
  component: Pagination,
  tags: ["batch-l"],
  argTypes: {
    className: {
      description:
        "Additional classes merged with the root navigation element.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-pagination-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

function ResultsPagination({
  currentPage,
  disabledPrevious = false,
  showEllipsis = false,
}: {
  currentPage: number;
  disabledPrevious?: boolean;
  showEllipsis?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          Resultats patients
        </p>
        <p className="text-sm text-muted-foreground">
          Page {currentPage} sur 32 pour la revue des substitutions exportees.
        </p>
      </div>
      <Pagination aria-label="Pagination resultats">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled={disabledPrevious}
              href={
                disabledPrevious
                  ? "/results?page=1"
                  : `/results?page=${currentPage - 1}`
              }
            />
          </PaginationItem>
          {currentPage === 1 ? (
            <>
              <PaginationItem>
                <PaginationLink href="/results?page=1" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="/results?page=2">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="/results?page=3">3</PaginationLink>
              </PaginationItem>
            </>
          ) : (
            <>
              <PaginationItem>
                <PaginationLink href="/results?page=1">1</PaginationLink>
              </PaginationItem>
              {showEllipsis ? (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : null}
              <PaginationItem>
                <PaginationLink href={`/results?page=${currentPage - 1}`}>
                  {currentPage - 1}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href={`/results?page=${currentPage}`} isActive>
                  {currentPage}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href={`/results?page=${currentPage + 1}`}>
                  {currentPage + 1}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          <PaginationItem>
            <PaginationNext href={`/results?page=${currentPage + 1}`} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <PaginationAuditFrame maxWidth="md" surface>
      <ResultsPagination currentPage={4} />
    </PaginationAuditFrame>
  ),
};

export const FirstPage: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <PaginationAuditFrame maxWidth="md" surface>
      <ResultsPagination currentPage={1} disabledPrevious />
    </PaginationAuditFrame>
  ),
};

export const TruncatedRange: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <PaginationAuditFrame maxWidth="md" surface>
      <ResultsPagination currentPage={18} showEllipsis />
    </PaginationAuditFrame>
  ),
};

export const InteractionChecks: Story = {
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: () => (
    <PaginationAuditFrame maxWidth="md" surface>
      <ResultsPagination currentPage={1} disabledPrevious />
    </PaginationAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", {
      name: "Pagination resultats",
    });
    const activePage = canvas.getByRole("link", { name: "1" });
    const previous = canvas.getByRole("link", { name: "Précédent" });

    await expect(nav).toHaveAttribute("data-slot", "pagination");
    await expect(canvas.getByRole("list")).toHaveAttribute(
      "data-slot",
      "pagination-content",
    );
    await expect(activePage).toHaveAttribute("aria-current", "page");
    await expect(previous).toHaveAttribute("aria-disabled", "true");
    await expect(previous).toHaveAttribute("tabindex", "-1");
    await expect(activePage.className).toContain("border-outline-border");
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: () => (
    <PaginationAuditFrame maxWidth="sm" surface>
      <ResultsPagination currentPage={18} showEllipsis />
    </PaginationAuditFrame>
  ),
};
