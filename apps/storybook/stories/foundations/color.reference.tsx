import { useRef } from "react";

import {
  baseColorGroups,
  makeJumpLinkHandler,
  semanticColorGroups,
} from "./color.data";
import {
  TokenDataGrid,
  TokenDocsPage,
  TokenPathText,
  TokenSection,
  useTokenDocsResetScrollOnMount,
  useTokenGroupState,
} from "./token-docs.components";

const BASE_GRID_ID = "base-color-grid";
const SEMANTIC_GRID_ID = "semantic-color-grid";
type ColorGridId = typeof BASE_GRID_ID | typeof SEMANTIC_GRID_ID;

function createInlineSwatch(value: string) {
  return (
    <>
      <span
        className="fd-tokendocs-inlineColorSwatch"
        style={{ backgroundColor: value }}
        aria-hidden="true"
      />
      <span className="fd-tokendocs-value-plain">{value}</span>
    </>
  );
}

export function ColorReferenceStory() {
  useTokenDocsResetScrollOnMount();
  const jumpRequestIdRef = useRef(0);
  const { openGroupIdFor, onOpenGroupChangeFor } =
    useTokenGroupState<ColorGridId>({
      gridId: BASE_GRID_ID,
      groupId: baseColorGroups[0]?.id ?? "neutral",
    });

  const onBaseGroupChange = onOpenGroupChangeFor(BASE_GRID_ID);
  const onSemanticGroupChange = onOpenGroupChangeFor(SEMANTIC_GRID_ID);

  function beginJumpRequest(): number {
    jumpRequestIdRef.current += 1;
    return jumpRequestIdRef.current;
  }

  function isCurrentJumpRequest(requestId: number): boolean {
    return jumpRequestIdRef.current === requestId;
  }

  return (
    <TokenDocsPage
      title="Color Token Reference"
      subtitle="Exact path/value lookup for base and semantic color tokens."
    >
      <TokenSection
        title="Base Color References"
        description="Grouped deterministic tables for every base color token."
      >
        <nav
          aria-label="Base color group jump links"
          className="fd-tokendocs-jumpList"
        >
          <span className="fd-tokendocs-jumpLabel">Jump to</span>
          {baseColorGroups.map((group) => (
            <button
              key={`base-${group.id}`}
              className="fd-tokendocs-jumpLink"
              onClick={() =>
                makeJumpLinkHandler(
                  group.id,
                  BASE_GRID_ID,
                  (nextGroupId) => onBaseGroupChange(nextGroupId),
                  beginJumpRequest,
                  isCurrentJumpRequest,
                )()
              }
              type="button"
            >
              {group.label}
            </button>
          ))}
        </nav>

        <TokenDataGrid
          gridLabel={BASE_GRID_ID}
          groups={baseColorGroups}
          accordion
          allowCollapseAll
          openGroupId={openGroupIdFor(BASE_GRID_ID)}
          onOpenGroupChange={onBaseGroupChange}
          columns={[
            {
              key: "path",
              label: "Token Path",
              width: "minmax(400px, 1.85fr)",
              getValue: (row) => row.path,
              render: (row) => <TokenPathText value={row.path} />,
              valueMode: "plain",
              copyValue: (row) => row.path,
            },
            {
              key: "value",
              label: "Color Value",
              width: "minmax(360px, 1.1fr)",
              getValue: (row) => row.value,
              render: (row) => (
                <span className="fd-tokendocs-inlineColorValue">
                  {createInlineSwatch(row.value)}
                </span>
              ),
              copyValue: (row) => row.value,
            },
          ]}
        />
      </TokenSection>

      <TokenSection
        title="Semantic Color References"
        description="Light/dark semantic contract values grouped by domain."
      >
        <nav
          aria-label="Semantic color group jump links"
          className="fd-tokendocs-jumpList"
        >
          <span className="fd-tokendocs-jumpLabel">Jump to</span>
          {semanticColorGroups.map((group) => (
            <button
              key={`semantic-${group.id}`}
              className="fd-tokendocs-jumpLink"
              onClick={() =>
                makeJumpLinkHandler(
                  group.id,
                  SEMANTIC_GRID_ID,
                  (nextGroupId) => onSemanticGroupChange(nextGroupId),
                  beginJumpRequest,
                  isCurrentJumpRequest,
                )()
              }
              type="button"
            >
              {group.label}
            </button>
          ))}
        </nav>

        <TokenDataGrid
          gridLabel={SEMANTIC_GRID_ID}
          groups={semanticColorGroups}
          accordion
          allowCollapseAll
          openGroupId={openGroupIdFor(SEMANTIC_GRID_ID)}
          onOpenGroupChange={onSemanticGroupChange}
          columns={[
            {
              key: "path",
              label: "Token Path",
              width: "minmax(400px, 1.75fr)",
              getValue: (row) => row.path,
              render: (row) => <TokenPathText value={row.path} />,
              valueMode: "plain",
              copyValue: (row) => row.path,
            },
            {
              key: "light",
              label: "Light",
              width: "minmax(320px, 1fr)",
              getValue: (row) => row.light,
              render: (row) => (
                <span className="fd-tokendocs-inlineColorValue">
                  {createInlineSwatch(row.light)}
                </span>
              ),
              copyValue: (row) => row.light,
            },
            {
              key: "dark",
              label: "Dark",
              width: "minmax(320px, 1fr)",
              getValue: (row) => row.dark,
              render: (row) => (
                <span className="fd-tokendocs-inlineColorValue">
                  {createInlineSwatch(row.dark)}
                </span>
              ),
              copyValue: (row) => row.dark,
            },
          ]}
        />
      </TokenSection>
    </TokenDocsPage>
  );
}
