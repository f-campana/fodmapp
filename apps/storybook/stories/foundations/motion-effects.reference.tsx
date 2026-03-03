import {
  motionGroups,
  semanticMotionGroups,
  shadowGroups,
} from "./motion-effects.data";
import {
  TokenDataGrid,
  TokenDocsPage,
  TokenPathText,
  TokenSection,
  useTokenDocsResetScrollOnMount,
  useTokenGroupState,
} from "./token-docs.components";

const MOTION_GRID_ID = "motion-grid";
const SHADOW_GRID_ID = "shadow-grid";
const SEMANTIC_MOTION_GRID_ID = "semantic-motion-grid";
type MotionGridId =
  | typeof MOTION_GRID_ID
  | typeof SHADOW_GRID_ID
  | typeof SEMANTIC_MOTION_GRID_ID;

export function MotionReferenceStory() {
  useTokenDocsResetScrollOnMount();

  const { openGroupIdFor, onOpenGroupChangeFor } =
    useTokenGroupState<MotionGridId>({
      gridId: MOTION_GRID_ID,
      groupId: motionGroups[0]?.id ?? "durations",
    });

  return (
    <TokenDocsPage
      title="Motion & Effects Token Reference"
      subtitle="Exact duration, easing, and shadow token references for implementation and QA."
    >
      <TokenSection
        title="Motion References"
        description="Grouped duration and easing path/value references."
      >
        <TokenDataGrid
          gridLabel={MOTION_GRID_ID}
          groups={motionGroups}
          accordion
          allowCollapseAll
          openGroupId={openGroupIdFor(MOTION_GRID_ID)}
          onOpenGroupChange={onOpenGroupChangeFor(MOTION_GRID_ID)}
          columns={[
            {
              key: "path",
              label: "Token Path",
              width: "minmax(340px, 1.7fr)",
              getValue: (row) => row.path,
              render: (row) => <TokenPathText value={row.path} />,
              valueMode: "plain",
              copyValue: (row) => row.path,
            },
            {
              key: "value",
              label: "Value",
              width: "minmax(320px, 1fr)",
              getValue: (row) => row.value,
              valueMode: "plain",
              copyValue: (row) => row.value,
            },
          ]}
        />
      </TokenSection>

      <TokenSection
        title="Shadow References"
        description="Grouped path/value references for shadow scales."
      >
        <TokenDataGrid
          gridLabel={SHADOW_GRID_ID}
          groups={shadowGroups}
          accordion
          allowCollapseAll
          openGroupId={openGroupIdFor(SHADOW_GRID_ID)}
          onOpenGroupChange={onOpenGroupChangeFor(SHADOW_GRID_ID)}
          columns={[
            {
              key: "path",
              label: "Token Path",
              width: "minmax(320px, 1.5fr)",
              getValue: (row) => row.path,
              render: (row) => <TokenPathText value={row.path} />,
              valueMode: "plain",
              copyValue: (row) => row.path,
            },
            {
              key: "value",
              label: "Shadow Value",
              width: "minmax(420px, 1.4fr)",
              getValue: (row) => row.value,
              valueMode: "plain",
              copyValue: (row) => row.value,
            },
          ]}
        />
      </TokenSection>

      <TokenSection
        title="Semantic Motion References"
        description="Theme-level semantic interactive motion primitives (light and dark)."
      >
        <TokenDataGrid
          gridLabel={SEMANTIC_MOTION_GRID_ID}
          groups={semanticMotionGroups}
          accordion
          allowCollapseAll
          openGroupId={openGroupIdFor(SEMANTIC_MOTION_GRID_ID)}
          onOpenGroupChange={onOpenGroupChangeFor(SEMANTIC_MOTION_GRID_ID)}
          columns={[
            {
              key: "path",
              label: "Token Path",
              width: "minmax(340px, 1.7fr)",
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
