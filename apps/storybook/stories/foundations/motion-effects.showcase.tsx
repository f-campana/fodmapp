import { type CSSProperties } from "react";

import {
  durationLaneRows,
  easingLaneRows,
  type MotionLaneRow,
  shadowRows,
} from "./motion-effects.data";
import {
  TokenDocsPage,
  TokenSection,
  TokenValuePill,
} from "./token-docs.components";

function MotionLaneCompare({ row }: { row: MotionLaneRow }) {
  const compareClassName = row.hasBaseline
    ? "fd-tokendocs-motionLaneCompare"
    : "fd-tokendocs-motionLaneCompare is-token-only";
  const tokenBallClassName = row.tokenStaticLeft
    ? "fd-tokendocs-motionLaneBall is-token is-static"
    : "fd-tokendocs-motionLaneBall is-token";
  const baselineStyle = row.hasBaseline
    ? ({
        "--fd-lane-duration": row.baselineDuration ?? row.tokenDuration,
        "--fd-lane-easing": row.baselineEasing ?? "linear",
        "--fd-lane-delay": row.baselineDelay ?? row.tokenDelay,
      } as CSSProperties)
    : undefined;

  return (
    <div
      className={compareClassName}
      aria-hidden="true"
      title={`${row.path}: ${row.value}`}
    >
      {row.hasBaseline ? (
        <span className="fd-tokendocs-motionRailRow is-baseline">
          <span className="fd-tokendocs-motionRailTag" aria-hidden="true">
            B
          </span>
          <span className="fd-tokendocs-motionRail is-baseline">
            <span
              className="fd-tokendocs-motionLaneBall is-baseline"
              style={baselineStyle}
            />
          </span>
        </span>
      ) : null}

      <span className="fd-tokendocs-motionRailRow is-token">
        <span className="fd-tokendocs-motionRailTag" aria-hidden="true">
          T
        </span>
        <span className="fd-tokendocs-motionRail is-token">
          <span
            className={tokenBallClassName}
            style={
              {
                "--fd-lane-duration": row.tokenDuration,
                "--fd-lane-easing": row.tokenEasing,
                "--fd-lane-delay": row.tokenDelay,
                "--fd-lane-static-left": row.tokenStaticLeft,
              } as CSSProperties
            }
          />
        </span>
      </span>
    </div>
  );
}

export function MotionEffectsShowcaseStory() {
  return (
    <TokenDocsPage
      title="Motion & Effects Tokens"
      subtitle="Passive motion lanes visualize duration and easing behavior in continuous loops. Shadow tiers are previewed below."
    >
      <TokenSection
        title="Motion Lanes"
        description="Token timing behavior rendered passively: duration rows compare speed, easing rows compare token output against linear baseline."
      >
        <div
          className="fd-tokendocs-showcase fd-tokendocs-motionLab"
          aria-label="Motion lane previews"
        >
          <div className="fd-tokendocs-motionLegend" aria-hidden="true">
            <span className="fd-tokendocs-motionLegendItem is-baseline">
              Baseline (easing)
            </span>
            <span className="fd-tokendocs-motionLegendItem is-token">
              Token timing (accent)
            </span>
          </div>
          <h3 className="fd-tokendocs-showcaseTitle">Duration Lanes</h3>
          <p className="fd-tokendocs-showcaseHint">
            Token marker only: compares relative speed across duration tokens.
          </p>
          <div className="fd-tokendocs-motionLanes">
            {durationLaneRows.map((row) => (
              <div key={row.id} className="fd-tokendocs-motionLaneRow">
                <span className="fd-tokendocs-motionLaneLabel">
                  {row.label}
                </span>
                <MotionLaneCompare row={row} />
                <span className="fd-tokendocs-motionLaneValue">
                  <TokenValuePill value={row.value} />
                </span>
              </div>
            ))}
          </div>

          <h3 className="fd-tokendocs-showcaseTitle">Easing Lanes</h3>
          <p className="fd-tokendocs-showcaseHint">
            Neutral marker is linear baseline; token marker uses the easing
            token at the same slower pace.
          </p>
          <div className="fd-tokendocs-motionLanes">
            {easingLaneRows.map((row) => (
              <div key={row.id} className="fd-tokendocs-motionLaneRow">
                <span className="fd-tokendocs-motionLaneLabel">
                  {row.label}
                </span>
                <MotionLaneCompare row={row} />
                <span className="fd-tokendocs-motionLaneValue">
                  <TokenValuePill value={row.value} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </TokenSection>

      <TokenSection
        title="Shadows"
        description="Elevation values rendered on larger surfaces for clearer depth comparison."
      >
        <div
          className="fd-tokendocs-showcase"
          aria-label="Shadow depth preview"
        >
          <h3 className="fd-tokendocs-showcaseTitle">Depth Surface Showcase</h3>
          <div className="fd-tokendocs-shadowShowcase">
            {shadowRows.map((row) => (
              <article
                key={`${row.id}-showcase`}
                className="fd-tokendocs-shadowCard"
              >
                <div
                  className="fd-tokendocs-shadowSurface"
                  style={{ boxShadow: row.value }}
                  aria-hidden="true"
                />
                <div className="fd-tokendocs-shadowMeta">
                  <p className="fd-tokendocs-shadowPath">{row.path}</p>
                  <p className="fd-tokendocs-shadowValue" title={row.value}>
                    {row.value}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </TokenSection>
    </TokenDocsPage>
  );
}
