import type { ReactNode } from "react";

export type StoryFrameProps = {
  maxWidth: "sm" | "md" | "xl" | "3xl";
  surface?: boolean;
  centeredMinHeight?: 72 | 80;
  children: ReactNode;
};

const MAX_WIDTH_CLASS_BY_SIZE = {
  sm: "max-w-sm",
  md: "max-w-md",
  xl: "max-w-xl",
  "3xl": "max-w-3xl",
} satisfies Record<StoryFrameProps["maxWidth"], string>;

const MIN_HEIGHT_CLASS_BY_SIZE = {
  72: "min-h-72",
  80: "min-h-80",
} satisfies Record<NonNullable<StoryFrameProps["centeredMinHeight"]>, string>;

export function StoryFrame({
  maxWidth,
  surface = false,
  centeredMinHeight,
  children,
}: StoryFrameProps) {
  const content = (
    <div
      className={["mx-auto", "w-full", MAX_WIDTH_CLASS_BY_SIZE[maxWidth]].join(
        " ",
      )}
    >
      {surface ? (
        <div className="rounded-(--radius) border border-border bg-card p-4">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );

  if (!centeredMinHeight) {
    return <div className="w-full px-4 py-8">{content}</div>;
  }

  return (
    <div
      className={[
        "flex",
        "w-full",
        "items-center",
        "justify-center",
        "px-4",
        "py-8",
        MIN_HEIGHT_CLASS_BY_SIZE[centeredMinHeight],
      ].join(" ")}
    >
      {content}
    </div>
  );
}
