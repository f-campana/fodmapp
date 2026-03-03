import { type CSSProperties } from "react";

import {
  brandPairs,
  matrixRows,
  semanticPairCards,
  sharedScaleStops,
  sparseScaleStops,
} from "./color.data";
import { classNames,TokenDocsPage, TokenSection } from "./token-docs.components";

export function ColorShowcaseStory() {
  const matrixStyle = {
    "--fd-color-cols": String(sharedScaleStops.length),
    "--fd-color-sparse-cols": String(sparseScaleStops.length),
    "--fd-color-sparse-col-width": "2.55rem",
  } as CSSProperties;

  return (
    <TokenDocsPage
      title="Color Tokens"
      subtitle="A palette-first view: scan hue progression quickly, then use the companion Reference story for full token paths and values."
    >
      <TokenSection
        title="Base Color Scales"
        description="Union scale stops are shown in one matrix. Families without a stop keep that slot intentionally empty."
      >
        <div className="fd-tokendocs-showcase" aria-label="Base color scale matrix">
          <h3 className="fd-tokendocs-showcaseTitle">Scale Matrix</h3>
          <p className="fd-tokendocs-showcaseHint">
            Core families on rows, shared scale stops on columns.
          </p>
          <p className="fd-tokendocs-matrixNote">
            Sparse-only stops (for example `950`) render inline as regular matrix
            values on the owning row.
          </p>
          <div className="fd-tokendocs-colorMatrix" style={matrixStyle}>
            <div className="fd-tokendocs-colorMatrixHead">
              <span aria-hidden="true" />
              {sharedScaleStops.map((step) => (
                <span key={`head-${step}`} className="fd-tokendocs-colorScaleLabel">
                  {step}
                </span>
              ))}
              {sparseScaleStops.map((step) => (
                <span key={`head-${step}`} className="fd-tokendocs-colorScaleLabel">
                  {step}
                </span>
              ))}
            </div>
            {matrixRows.map((row) => (
              <div key={row.family} className="fd-tokendocs-colorMatrixRow">
                <span className="fd-tokendocs-colorFamilyCell">
                  <span className="fd-tokendocs-colorFamilyLabel">{row.family}</span>
                </span>
                {sharedScaleStops.map((step) => {
                  const value = row.values[step];
                  const tokenPath = `base.color.${row.family}.${step}`;
                  const label = value
                    ? `${tokenPath}: ${value}`
                    : `${tokenPath}: no token at this stop`;

                  return (
                    <div
                      key={`${row.family}-${step}`}
                      className={classNames(
                        "fd-tokendocs-colorMatrixCell",
                        value ? "" : "is-empty",
                      )}
                    >
                      <span
                        className="fd-tokendocs-colorSwatchBlock"
                        style={value ? { backgroundColor: value } : undefined}
                        title={label}
                        role="img"
                        aria-label={label}
                      />
                    </div>
                  );
                })}
                {sparseScaleStops.map((step) => {
                  const sparse = row.sparseStops.find((item) => item.step === step);
                  const sparseValue = sparse?.value ?? null;
                  const sparsePath = `base.color.${row.family}.${step}`;

                  return (
                    <div
                      key={`${row.family}-${step}`}
                      className={classNames(
                        "fd-tokendocs-colorMatrixCell",
                        sparseValue ? "" : "is-empty",
                      )}
                      title={
                        sparseValue
                          ? `${sparsePath}: ${sparseValue}`
                          : `${sparsePath}: no token at this stop`
                      }
                    >
                      <span
                        className="fd-tokendocs-colorSwatchBlock"
                        style={
                          sparseValue ? { backgroundColor: sparseValue } : undefined
                        }
                        role="img"
                        aria-label={
                          sparseValue
                            ? `${sparsePath}: ${sparseValue}`
                            : `${sparsePath}: no token`
                        }
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="fd-tokendocs-brandGrid">
            {brandPairs.map((pair) => (
              <article key={pair.id} className="fd-tokendocs-brandCard">
                <p className="fd-tokendocs-brandTitle">brand.{pair.label}</p>
                <div className="fd-tokendocs-brandSwatches">
                  <div className="fd-tokendocs-brandSwatch">
                    <span className="fd-tokendocs-brandLabel">Light</span>
                    <span
                      className="fd-tokendocs-brandSwatchBlock"
                      style={pair.light ? { backgroundColor: pair.light } : undefined}
                      title={pair.light ?? "Missing value"}
                      role="img"
                      aria-label={`base.color.brand.${pair.label}Light: ${pair.light ?? "missing"}`}
                    />
                  </div>
                  <div className="fd-tokendocs-brandSwatch">
                    <span className="fd-tokendocs-brandLabel">Dark</span>
                    <span
                      className="fd-tokendocs-brandSwatchBlock"
                      style={pair.dark ? { backgroundColor: pair.dark } : undefined}
                      title={pair.dark ?? "Missing value"}
                      role="img"
                      aria-label={`base.color.brand.${pair.label}Dark: ${pair.dark ?? "missing"}`}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </TokenSection>

      <TokenSection
        title="Semantic Color Contract"
        description="Role pairs are presented for quick light/dark scanning with minimal text noise."
      >
        <div className="fd-tokendocs-showcase" aria-label="Semantic role pair previews">
          <h3 className="fd-tokendocs-showcaseTitle">Semantic Role Pairs</h3>
          <p className="fd-tokendocs-showcaseHint">
            Each card uses matching `bg` / `fg` pairs to preview contrast across
            themes.
          </p>
          <div className="fd-tokendocs-semanticGrid">
            {semanticPairCards.map((card) => (
              <article key={card.id} className="fd-tokendocs-semanticCard">
                <p className="fd-tokendocs-semanticTitle">{card.label}</p>
                <div className="fd-tokendocs-semanticRow">
                  <span className="fd-tokendocs-semanticMode">Light</span>
                  <span
                    className="fd-tokendocs-semanticSwatch"
                    style={{
                      backgroundColor: card.lightBg,
                      color: card.lightFg,
                    }}
                    title={`${card.path} (light): bg ${card.lightBg}, fg ${card.lightFg}`}
                    role="img"
                    aria-label={`${card.path} light background ${card.lightBg} with foreground ${card.lightFg}`}
                  >
                    Aa
                  </span>
                </div>
                <div className="fd-tokendocs-semanticRow">
                  <span className="fd-tokendocs-semanticMode">Dark</span>
                  <span
                    className="fd-tokendocs-semanticSwatch"
                    style={{
                      backgroundColor: card.darkBg,
                      color: card.darkFg,
                    }}
                    title={`${card.path} (dark): bg ${card.darkBg}, fg ${card.darkFg}`}
                    role="img"
                    aria-label={`${card.path} dark background ${card.darkBg} with foreground ${card.darkFg}`}
                  >
                    Aa
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </TokenSection>
    </TokenDocsPage>
  );
}
