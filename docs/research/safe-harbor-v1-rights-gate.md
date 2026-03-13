# Safe-Harbor V1 Rights-First Evidence Gate

Date: 2026-03-13  
Scope lock: `cohort_oil_fat`, `cohort_plain_protein`, `cohort_egg` only  
Context: public, open, non-commercial project

## Final verdict

`GO-WITH-CONDITIONS`

## Executive summary

The maintainer policy closes blocker `R6` for V1 by removing the ambiguous public-reuse path:

1. Runtime/public Safe-Harbor data basis is CIQUAL-only.
2. Monash is internal evidence only (no runtime tagging source, no public API rationale text source).
3. NICE text is non-reusable for public copy unless separately licensed.
4. Public docs/API copy must be project-authored cautious wording, with no quotes or close restatement of protected source text.

Legal/reuse conclusion (not scientific inference):

1. **CIQUAL 2025 reuse is allowed** under Etalab Open Licence 2.0, including commercial/non-commercial reuse, with mandatory attribution (source + last update date) and no implied endorsement.
2. **Monash content/data is not approved for runtime/public derivation** in V1 under this policy (and remains rights-sensitive without written permission).
3. Peer-reviewed and guideline sources remain citation-grade evidence, but full-text/table/figure reuse is rights-constrained.

Scientific inference (separate from legal conclusion):

1. Locked V1 cohorts are supported as generally low by composition for plain forms.
2. Evidence does not justify absolute language such as "always safe" or "guaranteed zero FODMAP".
3. Processing caveats are mandatory.

## Gate matrix

| Gate                                                            | Status | Risk | Blocker owner | Required action                                                                                         |
| --------------------------------------------------------------- | ------ | ---- | ------------- | ------------------------------------------------------------------------------------------------------- |
| R1. Monash runtime/public derivation excluded by policy         | pass   | Med  | maintainer    | Enforce CIQUAL-only runtime/public basis; block Monash-derived runtime tags/rationale fields.           |
| R2. Public runtime rights on CIQUAL-derived metadata/tags       | pass   | Low  | data          | Keep Etalab attribution contract in docs/API metadata and release notes.                                |
| R3. Source-family usage map is explicit and enforceable         | pass   | Med  | maintainer    | Adopt allowed/prohibited/internal-only map below as launch contract.                                    |
| R4. Scientific validity for locked V1 cohorts                   | pass   | Med  | data          | Use "compatible by composition" wording; keep processing exclusion rules strict.                        |
| R5. Safety/copy guardrails (processing and infused-oil caveats) | pass   | Med  | product       | Add mandatory caveats in API payload docs and UI copy.                                                  |
| R6. Public rights certainty for docs/API copy sources           | pass   | Low  | maintainer    | Keep Monash internal-only and NICE non-reusable for public copy unless explicit permission is obtained. |

Decision logic:

1. `GO-WITH-CONDITIONS` is valid only while all implementation conditions below are enforced.
2. If any request introduces Monash-derived runtime/public fields or NICE textual reuse in public copy, verdict reverts to `NO-GO` until legal clearance is documented.
3. If CIQUAL attribution/version obligations are not implemented, release is blocked.

## Implementation conditions (mandatory)

1. Runtime/public Safe-Harbor tagging, cohort assignment, and API rationale/caveat fields must be derived from CIQUAL + internal rules only.
2. Monash usage is internal evidence only in V1:
   - no Monash-derived runtime tagging,
   - no Monash-derived API rationale/caveat text,
   - no Monash branding/certification marks.
3. NICE content is non-reusable for public copy in V1 unless explicit permission/license is documented.
4. Public docs/API wording must be project-authored and cautious; do not quote or closely restate protected Monash/NICE text.
5. CIQUAL/Etalab obligations are required in every release exposing CIQUAL-derived metadata:
   - source attribution,
   - update/version date,
   - no endorsement implication,
   - no misleading transformation claims.
6. Safety copy must always include preparation caveats (plain/unprocessed only) and infused-oil storage warning when infused oils are surfaced.

## Rights/reuse map by source family

### 1) Monash official site / FAQ / public guidance

Legal/reuse conclusion for V1 policy:

1. Internal evidence review: `supported`.
2. Store in runtime repo/pipeline/database as source dataset: `unsupported` without written permission.
3. Public docs/API copy use as source text: `not permitted by project policy` for V1.
4. Public API derived tags/rationale based on Monash app/site content: `unsupported` in V1.

Allowed:

1. Internal reading for research context.
2. Internal evidence ledger references.

Prohibited in V1:

1. Extracting Monash dataset/app values into runtime DB/API.
2. Republishing Monash wording/tables/traffic-light outputs or certification representations.
3. Using Monash logos/certification marks.

### 2) CIQUAL / ANSES data and documentation

Legal/reuse conclusion:

1. Reuse is `supported` under Etalab Open Licence 2.0.
2. Repo/pipeline/database storage is `supported`.
3. Public API derived metadata/tags is `supported`.
4. Attribution/versioning is mandatory.

Obligations:

1. Mention source and last update date for reused information.
2. Do not imply endorsement by ANSES/concédant.
3. Do not mislead on content/source/update date.
4. Keep dataset citation and versioning (include DOI/extraction date when available).

### 3) Peer-reviewed journal articles

Legal/reuse conclusion:

1. Internal evidence use and citation: `supported`.
2. Storing citation metadata + internal structured claims: `supported`.
3. Reproducing full text/tables/figures in repo/API: `unsupported` unless license permits.
4. Public summaries in project-authored wording: `partially supported` with citation and no substantial copying.

### 4) Official guideline organizations / government agencies

Legal/reuse conclusion for V1 policy:

1. CDC materials: `supported with conditions` (attribution + no endorsement/logo misuse).
2. NICE textual reuse in public copy: `not permitted by project policy` for V1 unless licensed.

Operational rule:

1. Treat guideline text as internal reference/citation source.
2. Avoid copying guideline prose/tables into API payloads.

## Monash-specific blocker answers

Question: Can public Monash guidance be used for internal evidence review only?  
Answer: `supported`.

Question: Can it be used for public safe-harbor cohort tagging?  
Answer: `unsupported` in V1 (policy + rights risk).

Question: Can it be used in public API fields describing rationale/caveats?  
Answer: `unsupported` in V1 (policy).

Question: Can public docs summarize rationale in our own words?  
Answer: `supported` only when text is project-authored and not derived from protected Monash wording; prefer CIQUAL/peer-reviewed/government-backed framing in public copy.

## CIQUAL-specific blocker answer

Can CIQUAL data be reused publicly in this project?  
Answer: `supported`, including derived metadata and API output, if Etalab 2.0 obligations are enforced (source attribution, update date, no endorsement implication, no misleading presentation).

## Scientific validity (locked V1 only)

Evidence-supported conclusions:

1. FODMAPs are short-chain carbohydrates.
2. Oils/fats are generally low in FODMAPs because they contain little/no carbohydrate.
3. Animal proteins and eggs are generally low in FODMAPs because they contain little/no carbohydrate.
4. Processing and ingredient additions can invalidate this assumption.
5. Cutoff-based classification is serving-size dependent and influenced by food processing.

Inference boundary:

1. For V1 wording, prefer: "compatible by composition (plain, unprocessed forms)".
2. Avoid: "always safe", "guaranteed", "zero risk", "medical approval".

## Safety and copy guardrails

Required guardrails:

1. Always display processing caveat for all three cohorts: plain/unprocessed only; marinades, sauces, breadcrumbs, onion/garlic additions may change compatibility.
2. If surfacing infused-oil guidance, include food-safety caveat: refrigerate homemade garlic/herb oils and discard unused oil after 4 days.
3. Include quantity/tolerance disclaimer: low-FODMAP compatibility does not imply unlimited intake or symptom-free outcomes for all users.
4. Keep medical disclaimer language aligned with guideline framing (dietitian-supported, phased/personalized approach for IBS contexts).
5. Do not quote or closely restate Monash/NICE protected text in public docs/API copy.

## Required PRD redlines (exact replacement wording)

1. Replace any strict claim like:
   - "FODMAP-free by composition" / "always safe" / "zero FODMAP"
     with:
   - "Compatible by composition for plain, unprocessed forms (very low fermentable carbohydrate)."

2. Add source policy clause:
   - "Runtime safe-harbor tagging and API outputs are derived from CIQUAL and internally generated rules only. Monash public resources are internal evidence references and are not a runtime or public-copy source in V1."

3. Add attribution clause (Etalab/CIQUAL):
   - "Every release exposing CIQUAL-derived metadata must include: 'Source: Anses - Table de composition nutritionnelle des aliments Ciqual (version/date, DOI if available)'. API/docs must also record the reused-data update date."

4. Add public-copy constraints clause:
   - "Do not expose Monash-derived rationale text, Monash branding/certification marks, or NICE text in public API/docs unless explicit written permission/license is on file."

5. Add safety copy clause:
   - "All safe-harbor cohort surfaces must show: 'Plain/unprocessed forms only. Preparation and added ingredients can alter FODMAP compatibility.'"

## Required escalation list

1. If product requests Monash-derived runtime/public copy in V1, escalate to legal before implementation.
2. If product requests NICE textual reuse in public docs/API, escalate to legal before implementation.
3. Maintainer must enforce CIQUAL attribution/version fields in API metadata and docs release checklist.

## Source list

1. Monash Terms and Conditions: https://www.monashfodmap.com/terms-and-conditions/
2. Monash Disclaimer and Copyright: https://www.monashfodmap.com/disclaimer-and-copyright/
3. Monash FAQs: https://www.monashfodmap.com/about-fodmap-and-ibs/frequently-asked-questions/
4. Monash high/low foods page: https://www.monashfodmap.com/about-fodmap-and-ibs/high-and-low-fodmap-foods/
5. Monash infused oils explainer: https://www.monashfodmap.com/blog/all-about-onion-garlic-and-infused-oils-on-the-low-fodmap-diet/
6. CIQUAL 2025 dataset page (Dataverse): https://entrepot.recherche.data.gouv.fr/dataset.xhtml?persistentId=doi:10.57745/RDMHWY
7. CIQUAL DOI landing: https://doi.org/10.57745/RDMHWY
8. data.gouv legal licenses list: https://www.data.gouv.fr/pages/legal/licences/
9. Etalab Open Licence 2.0 text page: https://www.data.gouv.fr/pages/legal/licences/etalab-2.0
10. Etalab Open Licence 2.0 PDF (EN): https://www.etalab.gouv.fr/wp-content/uploads/2018/11/open-licence.pdf
11. Varney et al. 2017 (PubMed): https://pubmed.ncbi.nlm.nih.gov/28244665/
12. ACG IBS guideline 2021 (PubMed): https://pubmed.ncbi.nlm.nih.gov/33315591/
13. AGA Clinical Practice Update 2022 (PubMed): https://pubmed.ncbi.nlm.nih.gov/35337654/
14. NICE IBS recommendations: https://www.nice.org.uk/guidance/cg61/chapter/Recommendations
15. NICE terms and conditions: https://www.nice.org.uk/terms-and-conditions
16. CDC use of agency materials: https://www.cdc.gov/other/agencymaterials.html
17. CDC botulism prevention (home-canned foods): https://www.cdc.gov/botulism/prevention/home-canned-foods.html
18. NCHFP garlic-in-oil storage safety: https://nchfp.uga.edu/how/freeze/vegetable/freezing-garlic-in-oil/
