\set ON_ERROR_STOP on

WITH calc AS (
  SELECT
    COUNT(*) FILTER (
      WHERE threshold_source NOT IN ('food_specific', 'global_default')
         OR threshold_source_slug IS NULL
    )::int AS invalid_threshold_source_rows,
    COUNT(*) FILTER (
      WHERE is_default_threshold = TRUE
        AND (
          default_threshold_citation_ref IS NULL OR default_threshold_citation_ref = ''
          OR default_threshold_derivation_method IS NULL OR default_threshold_derivation_method = ''
        )
    )::int AS missing_default_threshold_citation_rows,
    COALESCE(
      ROUND(
        COUNT(*) FILTER (WHERE is_default_threshold = TRUE)::numeric / NULLIF(COUNT(*), 0),
        2
      ),
      0
    ) AS default_threshold_share
  FROM v_phase3_rollup_subtype_levels_latest
)
SELECT jsonb_build_object(
  '_contract_refs', jsonb_build_array(
    'etl/phase3/sql/phase3_rollups_6subtype_checks.sql'
  ),
  'invalid_threshold_source_rows', invalid_threshold_source_rows,
  'missing_default_threshold_citation_rows', missing_default_threshold_citation_rows,
  'default_threshold_share', default_threshold_share,
  'invalid_rows_total', (invalid_threshold_source_rows + missing_default_threshold_citation_rows)
)::text
FROM calc;
