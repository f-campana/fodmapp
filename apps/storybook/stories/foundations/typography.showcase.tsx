import {
  TokenDocsPage,
  TokenSection,
  TokenValuePill,
} from "./token-docs.components";
import {
  clampRem,
  cssNumberOrString,
  familyRows,
  lineHeightDefault,
  sizeShowcaseRows,
  weightRows,
} from "./typography.data";

export function TypographyShowcaseStory() {
  return (
    <TokenDocsPage
      title="Typography Tokens"
      subtitle="Specimen-first preview of tokenized families, scale, and weights. Exact path/value references are in the companion Reference story."
    >
      <TokenSection
        title="Typography Showcase"
        description="Token-driven specimens with tighter hierarchy and less repetitive vertical flow."
      >
        <div
          className="fd-tokendocs-showcase fd-tokendocs-typoShowcase"
          aria-label="Typography specimens"
        >
          <h3 className="fd-tokendocs-showcaseTitle">Family Specimens</h3>
          <div className="fd-tokendocs-typoSpecimens">
            {familyRows.map((row) => (
              <article key={row.id} className="fd-tokendocs-typoCard">
                <p
                  className="fd-tokendocs-typoSample"
                  style={{ fontFamily: row.value }}
                >
                  Digestive support starts with readable hierarchy.
                </p>
                <div className="fd-tokendocs-typoMeta">
                  <span className="fd-tokendocs-typoLabel">
                    {row.path.split(".").pop()}
                  </span>
                  <p className="fd-tokendocs-typoValue">{row.value}</p>
                </div>
              </article>
            ))}
          </div>

          <h3 className="fd-tokendocs-showcaseTitle">Type Waterfall</h3>
          <div className="fd-tokendocs-typeScaleList">
            {sizeShowcaseRows.map((row) => (
              <div
                key={`${row.id}-sample`}
                className="fd-tokendocs-typeScaleItem"
              >
                <span className="fd-tokendocs-typeKey">
                  {row.path.split(".").pop()}
                </span>
                <p
                  className="fd-tokendocs-typeSample"
                  style={{
                    fontSize: clampRem(row.value),
                    lineHeight: lineHeightDefault,
                  }}
                >
                  Digestive calm starts with clear type rhythm.
                </p>
                <TokenValuePill value={row.value} />
              </div>
            ))}
          </div>

          <h3 className="fd-tokendocs-showcaseTitle">Weight Spectrum</h3>
          <div
            className="fd-tokendocs-weightBand"
            aria-label="Typography weight comparison"
          >
            {weightRows.map((row) => (
              <article
                key={`${row.id}-weight`}
                className="fd-tokendocs-weightBandCell"
              >
                <p
                  className="fd-tokendocs-weightCellSample"
                  style={{
                    fontWeight: cssNumberOrString(row.value),
                  }}
                >
                  Digestive support rhythm across interface states.
                </p>
                <div className="fd-tokendocs-weightBandMeta">
                  <span className="fd-tokendocs-weightTokenMeta">
                    {row.path.split(".").pop()} / {row.value}
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
