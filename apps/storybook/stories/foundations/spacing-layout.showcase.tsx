import { type CSSProperties } from "react";

import {
  BREAKPOINT_TICK_MARKS,
  BREAKPOINT_TICKS,
  breakpointRows,
  maxBreakpointValue,
  normalizeRadiusValue,
  radiusRows,
  spacingShowcaseRows,
  stripPathPrefix,
  toPercent,
} from "./spacing-layout.data";
import { TokenDocsPage, TokenSection } from "./token-docs.components";

export function SpacingLayoutShowcaseStory() {
  return (
    <TokenDocsPage
      title="Spacing & Layout Tokens"
      subtitle="Applied spacing and structural tokens in practical patterns with immediate visual deltas."
    >
      <TokenSection
        title="Spacing Scale"
        description="Value-first cards keep token context with larger visual contrast and stronger delta cues."
      >
        <div
          className="fd-tokendocs-showcase fd-tokendocs-spacingShowcaseRoot"
          aria-label="Spacing visual showcase"
        >
          <h3 className="fd-tokendocs-showcaseTitle">Vertical Stack Rhythm</h3>
          <div className="fd-tokendocs-spacingShowcaseModule">
            <p className="fd-tokendocs-showcaseHint">
              Same four surface cards scale consistently; only gap changes are
              the signal.
            </p>
          </div>
          <div className="fd-tokendocs-spacingDemoGrid">
            {spacingShowcaseRows.map((row) => (
              <article
                key={`${row.id}-stack`}
                className="fd-tokendocs-spacingDemoCard"
              >
                <div className="fd-tokendocs-spacingDemoMeta">
                  <span className="fd-tokendocs-spacingLabel">
                    {stripPathPrefix(row.path, "base.space")}
                  </span>
                  <span className="fd-tokendocs-spacingDemoValueText">
                    {row.value}
                  </span>
                </div>
                <div
                  className="fd-tokendocs-stackApplied"
                  style={{ gap: row.value }}
                  aria-hidden="true"
                >
                  <div className="fd-tokendocs-stackAppliedCard">Header</div>
                  <div className="fd-tokendocs-stackAppliedCard">Body</div>
                  <div className="fd-tokendocs-stackAppliedCard">Summary</div>
                  <div className="fd-tokendocs-stackAppliedCard">Action</div>
                </div>
              </article>
            ))}
          </div>

          <h3 className="fd-tokendocs-showcaseTitle">Inline Cluster</h3>
          <div className="fd-tokendocs-spacingShowcaseModule">
            <p className="fd-tokendocs-showcaseHint">
              Chips scale out from compact to relaxed spacing with fixed anchor
              bounds.
            </p>
          </div>
          <div className="fd-tokendocs-spacingDemoGrid">
            {spacingShowcaseRows.map((row) => (
              <article
                key={`${row.id}-cluster`}
                className="fd-tokendocs-spacingDemoCard"
              >
                <div className="fd-tokendocs-spacingDemoMeta">
                  <span className="fd-tokendocs-spacingLabel">
                    {stripPathPrefix(row.path, "base.space")}
                  </span>
                  <span className="fd-tokendocs-spacingDemoValueText">
                    {row.value}
                  </span>
                </div>
                <div
                  className="fd-tokendocs-clusterApplied"
                  style={{ gap: row.value }}
                  aria-hidden="true"
                >
                  <span className="fd-tokendocs-chip">Safe</span>
                  <span className="fd-tokendocs-chip">Review</span>
                  <span className="fd-tokendocs-chip">Plan</span>
                  <span className="fd-tokendocs-chip">Cook</span>
                  <span className="fd-tokendocs-chip">Breathe</span>
                  <span className="fd-tokendocs-chip">Grow</span>
                </div>
              </article>
            ))}
          </div>

          <h3 className="fd-tokendocs-showcaseTitle">Card Lattice Gutter</h3>
          <div className="fd-tokendocs-spacingShowcaseModule">
            <p className="fd-tokendocs-showcaseHint">
              Filled cards and expanding gutters make lattice density
              differences obvious.
            </p>
          </div>
          <div className="fd-tokendocs-spacingDemoGrid">
            {spacingShowcaseRows.map((row) => (
              <article
                key={`${row.id}-lattice`}
                className="fd-tokendocs-spacingDemoCard"
              >
                <div className="fd-tokendocs-spacingDemoMeta">
                  <span className="fd-tokendocs-spacingLabel">
                    {stripPathPrefix(row.path, "base.space")}
                  </span>
                  <span className="fd-tokendocs-spacingDemoValueText">
                    {row.value}
                  </span>
                </div>
                <div
                  className="fd-tokendocs-latticeApplied"
                  style={{ gap: row.value }}
                  aria-hidden="true"
                >
                  <span className="fd-tokendocs-latticeCard">A</span>
                  <span className="fd-tokendocs-latticeCard">B</span>
                  <span className="fd-tokendocs-latticeCard">C</span>
                  <span className="fd-tokendocs-latticeCard">D</span>
                  <span className="fd-tokendocs-latticeCard">E</span>
                  <span className="fd-tokendocs-latticeCard">F</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </TokenSection>

      <TokenSection
        title="Layout and Structural Scales"
        description="Radius and breakpoints remain compact while sharpening interpretation at a glance."
      >
        <div
          className="fd-tokendocs-showcase"
          aria-label="Structural token showcase"
        >
          <h3 className="fd-tokendocs-showcaseTitle">Radius Preview</h3>
          <div className="fd-tokendocs-structShowcase">
            {radiusRows.map((row) => {
              const tokenKey = stripPathPrefix(row.path, "base.radius");
              return (
                <article
                  key={`${row.id}-radius`}
                  className="fd-tokendocs-radiusCard"
                >
                  <div className="fd-tokendocs-spacingDemoMeta">
                    <span className="fd-tokendocs-spacingLabel">
                      {tokenKey}
                    </span>
                    <span className="fd-tokendocs-spacingDemoValueText">
                      {row.value}
                    </span>
                  </div>
                  <div
                    className="fd-tokendocs-radiusSwatch"
                    style={
                      {
                        ["--radius-value" as string]: normalizeRadiusValue(
                          row.value,
                        ),
                      } as CSSProperties
                    }
                    role="img"
                    aria-label={`${row.path}: ${row.value}`}
                  />
                </article>
              );
            })}
          </div>

          <h3 className="fd-tokendocs-showcaseTitle">Breakpoint Ladder</h3>
          <div className="fd-tokendocs-breakpointList">
            {breakpointRows.map((row) => (
              <div
                key={`${row.id}-breakpoint`}
                className="fd-tokendocs-breakpointRow"
              >
                <span className="fd-tokendocs-breakpointHeader">
                  <span className="fd-tokendocs-spacingLabel">
                    {stripPathPrefix(row.path, "base.breakpoint")}
                  </span>
                  <span className="fd-tokendocs-breakpointMinWidth">
                    min: {row.value}
                  </span>
                </span>
                <div
                  className="fd-tokendocs-breakpointTrack"
                  style={
                    {
                      "--fd-breakpoint-ticks": String(BREAKPOINT_TICKS),
                    } as CSSProperties
                  }
                  aria-hidden="true"
                >
                  <span className="fd-tokendocs-breakpointTicks">
                    {Array.from({ length: BREAKPOINT_TICKS }, (_, index) => (
                      <span
                        key={`${row.id}-tick-${index}`}
                        className="fd-tokendocs-breakpointTick"
                      >
                        <span className="fd-tokendocs-breakpointTickLabel">
                          {BREAKPOINT_TICK_MARKS[index]}
                        </span>
                      </span>
                    ))}
                  </span>
                  <span
                    className="fd-tokendocs-breakpointBar"
                    style={{
                      width: `${toPercent(row.value, maxBreakpointValue)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </TokenSection>
    </TokenDocsPage>
  );
}
