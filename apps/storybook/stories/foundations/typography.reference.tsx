import {
  TokenDataGrid,
  TokenDocsPage,
  TokenPathText,
  TokenSection,
  useTokenDocsResetScrollOnMount,
  useTokenGroupState,
} from "./token-docs.components";
import {
  formatSemanticTypographyValue,
  formatTypographyReferenceValue,
  groups,
  semanticGroups,
} from "./typography.data";

const TYPOGRAPHY_GRID_ID = "typography-grid";
const SEMANTIC_TYPOGRAPHY_GRID_ID = "semantic-typography-grid";
type TypographyGridId =
  | typeof TYPOGRAPHY_GRID_ID
  | typeof SEMANTIC_TYPOGRAPHY_GRID_ID;

export function TypographyReferenceStory() {
  useTokenDocsResetScrollOnMount();
  const { openGroupIdFor, onOpenGroupChangeFor } =
    useTokenGroupState<TypographyGridId>({
      gridId: TYPOGRAPHY_GRID_ID,
      groupId: "families",
    });

  return (
    <TokenDocsPage
      title="Typography Token Reference"
      subtitle="Exact token paths and values for implementation and QA checks."
    >
      <TokenSection
        title="Typography Primitives"
        description="Grouped deterministic tables for all typography token domains."
      >
        <TokenDataGrid
          gridLabel={TYPOGRAPHY_GRID_ID}
          groups={groups}
          accordion
          allowCollapseAll={false}
          openGroupId={openGroupIdFor(TYPOGRAPHY_GRID_ID)}
          onOpenGroupChange={onOpenGroupChangeFor(TYPOGRAPHY_GRID_ID)}
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
              width: "minmax(320px, 1fr)",
              align: "right",
              getValue: (row) => row.value,
              render: (row) => (
                <span className="fd-tokendocs-value-plain fd-tokendocs-value-wrapSoft">
                  {formatTypographyReferenceValue(row)}
                </span>
              ),
              valueMode: "plain",
              copyValue: (row) => row.value,
            },
          ]}
        />
      </TokenSection>

      <TokenSection
        title="Semantic Typography References"
        description="Theme-level semantic typography family tokens (light and dark)."
      >
        <TokenDataGrid
          gridLabel={SEMANTIC_TYPOGRAPHY_GRID_ID}
          groups={semanticGroups}
          accordion
          allowCollapseAll={false}
          openGroupId={openGroupIdFor(SEMANTIC_TYPOGRAPHY_GRID_ID)}
          onOpenGroupChange={onOpenGroupChangeFor(SEMANTIC_TYPOGRAPHY_GRID_ID)}
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
              width: "minmax(300px, 1fr)",
              getValue: (row) => row.light,
              render: (row) => (
                <span className="fd-tokendocs-value-plain fd-tokendocs-value-wrapSoft">
                  {formatSemanticTypographyValue(row.light)}
                </span>
              ),
              valueMode: "plain",
              copyValue: (row) => row.light,
            },
            {
              key: "dark",
              label: "Dark",
              width: "minmax(300px, 1fr)",
              getValue: (row) => row.dark,
              render: (row) => (
                <span className="fd-tokendocs-value-plain fd-tokendocs-value-wrapSoft">
                  {formatSemanticTypographyValue(row.dark)}
                </span>
              ),
              valueMode: "plain",
              copyValue: (row) => row.dark,
            },
          ]}
        />
      </TokenSection>
    </TokenDocsPage>
  );
}
