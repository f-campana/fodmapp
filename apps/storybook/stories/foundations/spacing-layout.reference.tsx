import {
  layoutReferenceGroups,
  semanticReferenceGroups,
  spacingReferenceGroups,
} from "./spacing-layout.data";
import {
  TokenDataGrid,
  TokenDocsPage,
  TokenPathText,
  TokenSection,
  useTokenDocsResetScrollOnMount,
  useTokenGroupState,
} from "./token-docs.components";

const SPACING_GRID_ID = "spacing-grid";
const LAYOUT_GRID_ID = "layout-grid";
const SEMANTIC_LAYOUT_GRID_ID = "semantic-layout-grid";
type LayoutGridId =
  | typeof SPACING_GRID_ID
  | typeof LAYOUT_GRID_ID
  | typeof SEMANTIC_LAYOUT_GRID_ID;

export function SpacingLayoutReferenceStory() {
  useTokenDocsResetScrollOnMount();

  const { openGroupIdFor, onOpenGroupChangeFor } =
    useTokenGroupState<LayoutGridId>({
      gridId: SPACING_GRID_ID,
      groupId: spacingReferenceGroups[0]?.id ?? "spacing",
    });

  return (
    <TokenDocsPage
      title="Spacing & Layout Token Reference"
      subtitle="Deterministic grouped tables for spacing and structural scales with copy actions."
    >
      <TokenSection
        title="Spacing References"
        description="Complete base spacing path/value references."
      >
        <TokenDataGrid
          gridLabel={SPACING_GRID_ID}
          groups={spacingReferenceGroups}
          accordion
          allowCollapseAll
          openGroupId={openGroupIdFor(SPACING_GRID_ID)}
          onOpenGroupChange={onOpenGroupChangeFor(SPACING_GRID_ID)}
          columns={[
            {
              key: "path",
              label: "Token Path",
              width: "minmax(360px, 1.6fr)",
              getValue: (row) => row.path,
              render: (row) => <TokenPathText value={row.path} />,
              valueMode: "plain",
              copyValue: (row) => row.path,
            },
            {
              key: "value",
              label: "Value",
              width: "minmax(300px, 1fr)",
              align: "right",
              getValue: (row) => row.value,
              valueMode: "plain",
              copyValue: (row) => row.value,
            },
          ]}
        />
      </TokenSection>

      <TokenSection
        title="Layout & Structural References"
        description="Radius, border width, opacity, breakpoint, and z-index path/value references."
      >
        <TokenDataGrid
          gridLabel={LAYOUT_GRID_ID}
          groups={layoutReferenceGroups}
          accordion
          allowCollapseAll
          openGroupId={openGroupIdFor(LAYOUT_GRID_ID)}
          onOpenGroupChange={onOpenGroupChangeFor(LAYOUT_GRID_ID)}
          columns={[
            {
              key: "path",
              label: "Token Path",
              width: "minmax(360px, 1.8fr)",
              getValue: (row) => row.path,
              render: (row) => <TokenPathText value={row.path} />,
              valueMode: "plain",
              copyValue: (row) => row.path,
            },
            {
              key: "value",
              label: "Value",
              width: "minmax(300px, 1fr)",
              align: "right",
              getValue: (row) => row.value,
              valueMode: "plain",
              copyValue: (row) => row.value,
            },
          ]}
        />
      </TokenSection>

      <TokenSection
        title="Semantic Layout References"
        description="Theme-level semantic radius and spacing primitives (light and dark)."
      >
        <TokenDataGrid
          gridLabel={SEMANTIC_LAYOUT_GRID_ID}
          groups={semanticReferenceGroups}
          accordion
          allowCollapseAll={false}
          openGroupId={openGroupIdFor(SEMANTIC_LAYOUT_GRID_ID)}
          onOpenGroupChange={onOpenGroupChangeFor(SEMANTIC_LAYOUT_GRID_ID)}
          columns={[
            {
              key: "path",
              label: "Token Path",
              width: "minmax(360px, 1.8fr)",
              getValue: (row) => row.path,
              render: (row) => <TokenPathText value={row.path} />,
              valueMode: "plain",
              copyValue: (row) => row.path,
            },
            {
              key: "light",
              label: "Light",
              width: "minmax(280px, 1fr)",
              getValue: (row) => row.light,
              valueMode: "plain",
              copyValue: (row) => row.light,
            },
            {
              key: "dark",
              label: "Dark",
              width: "minmax(280px, 1fr)",
              getValue: (row) => row.dark,
              valueMode: "plain",
              copyValue: (row) => row.dark,
            },
          ]}
        />
      </TokenSection>
    </TokenDocsPage>
  );
}
