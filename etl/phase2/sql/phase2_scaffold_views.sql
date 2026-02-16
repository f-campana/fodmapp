-- Phase 2 scaffold analytics for CIQUAL-gap-driven research planning.
-- Non-mutating: creates analytical views only.

CREATE OR REPLACE VIEW v_phase2_priority_food_candidates AS
WITH priority_scaffold (
  priority_rank,
  gap_bucket,
  target_subtype,
  food_label,
  variant_label,
  ciqual_code_hint,
  food_slug_hint,
  template_food_id,
  serving_g_provisional,
  source_strategy,
  status,
  notes
) AS (
  VALUES
    (1, 'fructan_dominant', 'fructan', 'ail', 'raw cloves', '11000', 'ail_cru', NULL::uuid, 3.00::numeric, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', 'Core French aromatic'),
    (2, 'fructan_dominant', 'fructan', 'ail', 'powder', NULL, 'ail_poudre', NULL::uuid, 1.00::numeric, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', 'Concentrated seasoning form'),
    (3, 'fructan_dominant', 'fructan', 'ail', 'infused oil', NULL, 'huile_infusee_ail', NULL::uuid, 14.00::numeric, 'muir_2007_fructan|monash_app_v4_reference', 'pending_research', 'Technique swap baseline'),
    (4, 'fructan_dominant', 'fructan', 'oignon', 'raw bulb', NULL, 'oignon_cru', NULL::uuid, 40.00::numeric, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', 'High-use aromatic'),
    (5, 'fructan_dominant', 'fructan', 'oignon', 'cooked bulb', NULL, 'oignon_cuit', NULL::uuid, 60.00::numeric, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', 'Thermal behavior variant'),
    (6, 'fructan_dominant', 'fructan', 'oignon', 'powder', NULL, 'oignon_poudre', NULL::uuid, 2.00::numeric, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', 'Seasoning variant'),
    (7, 'fructan_dominant', 'fructan', 'oignon nouveau', 'white bulb', NULL, 'cebette_blanc', NULL::uuid, 15.00::numeric, 'muir_2007_fructan|monash_app_v4_reference', 'pending_research', 'White-vs-green split needed'),
    (8, 'fructan_dominant', 'fructan', 'oignon nouveau', 'green tops', NULL, 'cebette_vert', NULL::uuid, 30.00::numeric, 'muir_2007_fructan|monash_app_v4_reference', 'pending_research', 'Typically better tolerated portion'),
    (9, 'fructan_dominant', 'fructan', 'echalote', 'raw bulb', NULL, 'echalote_crue', NULL::uuid, 20.00::numeric, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', 'French base aromatic'),
    (10, 'fructan_dominant', 'fructan', 'poireau', 'white part', NULL, 'poireau_blanc', NULL::uuid, 40.00::numeric, 'muir_2007_fructan|monash_app_v4_reference', 'pending_research', 'White section priority'),
    (11, 'fructan_dominant', 'fructan', 'farine de ble', 'Type T55', NULL, 'farine_ble_t55', NULL::uuid, 40.00::numeric, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', 'French flour grade'),
    (12, 'fructan_dominant', 'fructan', 'farine de ble', 'Type T65', NULL, 'farine_ble_t65', NULL::uuid, 40.00::numeric, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', 'French flour grade'),
    (13, 'fructan_dominant', 'fructan', 'farine de ble', 'Type T80', NULL, 'farine_ble_t80', NULL::uuid, 40.00::numeric, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', 'French flour grade'),
    (14, 'fructan_dominant', 'fructan', 'seigle', 'grain or flour', NULL, 'seigle', NULL::uuid, 40.00::numeric, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', 'Common bakery grain'),
    (15, 'fructan_dominant', 'fructan', 'orge', 'pearled barley', NULL, 'orge_perle', NULL::uuid, 75.00::numeric, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research', 'Soup and side usage'),
    (16, 'fructan_dominant', 'fructan', 'artichaut', 'globe heart', NULL, 'artichaut', NULL::uuid, 75.00::numeric, 'muir_2007_fructan|monash_app_v4_reference', 'pending_research', 'Known fructan-heavy vegetable'),
    (17, 'fructan_dominant', 'fructan', 'racine de chicoree', 'root', NULL, 'racine_chicoree', NULL::uuid, 30.00::numeric, 'muir_2007_fructan|monash_app_v4_reference', 'pending_research', 'Inulin-rich reference food'),
    (18, 'gos_dominant', 'gos', 'pois chiche', 'canned drained', NULL, 'pois_chiche_conserve', NULL::uuid, 75.00::numeric, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', 'Legume baseline'),
    (19, 'gos_dominant', 'gos', 'lentille', 'green cooked', NULL, 'lentille_verte_cuite', NULL::uuid, 100.00::numeric, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', 'Variant-specific data needed'),
    (20, 'gos_dominant', 'gos', 'lentille', 'red cooked', NULL, 'lentille_rouge_cuite', NULL::uuid, 100.00::numeric, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', 'Variant-specific data needed'),
    (21, 'gos_dominant', 'gos', 'lentille', 'brown cooked', NULL, 'lentille_brune_cuite', NULL::uuid, 100.00::numeric, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', 'Variant-specific data needed'),
    (22, 'gos_dominant', 'gos', 'haricot blanc', 'cooked', NULL, 'haricot_blanc_cuit', NULL::uuid, 90.00::numeric, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', 'Pulse category anchor'),
    (23, 'gos_dominant', 'gos', 'haricot rouge', 'cooked kidney bean', NULL, 'haricot_rouge_cuit', NULL::uuid, 90.00::numeric, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', 'Pulse category anchor'),
    (24, 'gos_dominant', 'gos', 'haricot noir', 'cooked', NULL, 'haricot_noir_cuit', NULL::uuid, 90.00::numeric, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', 'Pulse category anchor'),
    (25, 'gos_dominant', 'gos', 'pois casse', 'cooked', NULL, 'pois_casse_cuit', NULL::uuid, 90.00::numeric, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', 'Traditional split pea use'),
    (26, 'gos_dominant', 'gos', 'edamame', 'cooked', NULL, 'edamame_cuit', NULL::uuid, 75.00::numeric, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', 'Soy-family variant'),
    (27, 'gos_dominant', 'gos', 'soja', 'whole cooked', NULL, 'soja_cuit', NULL::uuid, 75.00::numeric, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', 'Soy-family variant'),
    (28, 'gos_dominant', 'gos', 'noix de cajou', 'raw', NULL, 'cajou_cru', NULL::uuid, 30.00::numeric, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', 'Nut trigger candidate'),
    (29, 'gos_dominant', 'gos', 'pistache', 'raw', NULL, 'pistache_crue', NULL::uuid, 30.00::numeric, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research', 'Nut trigger candidate'),
    (30, 'polyol_split_needed', 'sorbitol', 'pomme', 'raw', NULL, 'pomme_crue', NULL::uuid, 125.00::numeric, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', 'Sorbitol-vs-mannitol split required'),
    (31, 'polyol_split_needed', 'sorbitol', 'poire', 'raw', NULL, 'poire_crue', NULL::uuid, 120.00::numeric, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', 'Sorbitol-vs-mannitol split required'),
    (32, 'polyol_split_needed', 'sorbitol', 'cerise', 'sweet raw', NULL, 'cerise_crue', NULL::uuid, 80.00::numeric, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', 'Sorbitol-vs-mannitol split required'),
    (33, 'polyol_split_needed', 'sorbitol', 'peche', 'raw', NULL, 'peche_crue', NULL::uuid, 120.00::numeric, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', 'Sorbitol-vs-mannitol split required'),
    (34, 'polyol_split_needed', 'sorbitol', 'nectarine', 'raw', NULL, 'nectarine_crue', NULL::uuid, 120.00::numeric, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', 'Sorbitol-vs-mannitol split required'),
    (35, 'polyol_split_needed', 'sorbitol', 'prune', 'raw', NULL, 'prune_crue', NULL::uuid, 120.00::numeric, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', 'Sorbitol-vs-mannitol split required'),
    (36, 'polyol_split_needed', 'sorbitol', 'pruneau', 'dried', NULL, 'pruneau_sec', NULL::uuid, 30.00::numeric, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', 'Dried fruit concentration effect'),
    (37, 'polyol_split_needed', 'mannitol', 'champignon de paris', 'button mushroom', NULL, 'champignon_paris', NULL::uuid, 75.00::numeric, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', 'Mannitol-heavy mushroom family'),
    (38, 'polyol_split_needed', 'mannitol', 'shiitake', 'mushroom', NULL, 'shiitake', NULL::uuid, 60.00::numeric, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', 'Mannitol-heavy mushroom family'),
    (39, 'polyol_split_needed', 'mannitol', 'pleurote', 'oyster mushroom', NULL, 'pleurote', NULL::uuid, 75.00::numeric, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', 'Mannitol-heavy mushroom family'),
    (40, 'polyol_split_needed', 'mannitol', 'chou-fleur', 'florets', NULL, 'chou_fleur', NULL::uuid, 90.00::numeric, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', 'Mannitol-vs-sorbitol split required'),
    (41, 'polyol_split_needed', 'mannitol', 'patate douce', 'cooked', NULL, 'patate_douce_cuite', NULL::uuid, 90.00::numeric, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', 'Mannitol-vs-sorbitol split required'),
    (42, 'polyol_split_needed', 'mannitol', 'celeri', 'stalk', NULL, 'celeri_branche', NULL::uuid, 75.00::numeric, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research', 'Mannitol-vs-sorbitol split required')
),
matched AS (
  SELECT
    p.*,
    ciqual_match.food_id AS ciqual_food_id,
    slug_match.food_id AS slug_food_id,
    name_match.food_id AS name_food_id
  FROM priority_scaffold AS p
  LEFT JOIN LATERAL (
    SELECT fer.food_id
    FROM food_external_refs AS fer
    WHERE fer.ref_system = 'CIQUAL'
      AND p.ciqual_code_hint IS NOT NULL
      AND (
        fer.ref_value = p.ciqual_code_hint
        OR ltrim(fer.ref_value, '0') = ltrim(p.ciqual_code_hint, '0')
      )
    ORDER BY fer.food_id
    LIMIT 1
  ) AS ciqual_match ON TRUE
  LEFT JOIN LATERAL (
    SELECT f.food_id
    FROM foods AS f
    WHERE p.food_slug_hint IS NOT NULL
      AND f.food_slug = p.food_slug_hint
    ORDER BY f.food_id
    LIMIT 1
  ) AS slug_match ON TRUE
  LEFT JOIN LATERAL (
    SELECT f.food_id
    FROM foods AS f
    WHERE lower(f.canonical_name_fr) = lower(p.food_label)
    ORDER BY f.food_id
    LIMIT 1
  ) AS name_match ON TRUE
)
SELECT
  priority_rank,
  gap_bucket,
  target_subtype,
  food_label,
  variant_label,
  ciqual_code_hint,
  food_slug_hint,
  template_food_id,
  serving_g_provisional,
  source_strategy,
  status,
  notes,
  ciqual_food_id,
  slug_food_id,
  name_food_id,
  COALESCE(template_food_id, ciqual_food_id, slug_food_id, name_food_id) AS resolved_food_id,
  CASE
    WHEN template_food_id IS NOT NULL THEN 'template_food_id'
    WHEN ciqual_food_id IS NOT NULL THEN 'ciqual_code_hint'
    WHEN slug_food_id IS NOT NULL THEN 'food_slug_hint'
    WHEN name_food_id IS NOT NULL THEN 'food_label_match'
    ELSE 'unresolved'
  END AS resolution_method
FROM matched
ORDER BY priority_rank;


CREATE OR REPLACE VIEW v_phase2_gap_completion AS
WITH phase2_sources AS (
  SELECT source_id
  FROM sources
  WHERE source_slug IN (
    'muir_2007_fructan',
    'biesiekierski_2011_fructan',
    'dysseler_hoffem_gos',
    'yao_2005_polyols',
    'monash_app_v4_reference'
  )
),
row_status AS (
  SELECT
    c.priority_rank,
    c.gap_bucket,
    c.target_subtype,
    c.food_label,
    c.variant_label,
    c.resolved_food_id,
    COUNT(ffm.measurement_id) AS phase2_measurement_count,
    MAX(ffm.observed_at) AS latest_observed_at
  FROM v_phase2_priority_food_candidates AS c
  LEFT JOIN fodmap_subtypes AS fst
    ON fst.code = c.target_subtype
  LEFT JOIN food_fodmap_measurements AS ffm
    ON ffm.food_id = c.resolved_food_id
    AND ffm.fodmap_subtype_id = fst.fodmap_subtype_id
    AND ffm.source_id IN (SELECT source_id FROM phase2_sources)
  GROUP BY
    c.priority_rank,
    c.gap_bucket,
    c.target_subtype,
    c.food_label,
    c.variant_label,
    c.resolved_food_id
)
SELECT
  gap_bucket,
  target_subtype,
  COUNT(*) AS priority_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL) AS resolved_rows,
  COUNT(*) FILTER (WHERE phase2_measurement_count > 0) AS completed_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NULL) AS unresolved_rows,
  COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL AND phase2_measurement_count = 0) AS pending_measurement_rows,
  ROUND(
    COUNT(*) FILTER (WHERE phase2_measurement_count > 0)::numeric
    / NULLIF(COUNT(*), 0),
    3
  ) AS completion_ratio,
  MAX(latest_observed_at) AS latest_observed_at
FROM row_status
GROUP BY gap_bucket, target_subtype
ORDER BY
  CASE gap_bucket
    WHEN 'fructan_dominant' THEN 1
    WHEN 'gos_dominant' THEN 2
    WHEN 'polyol_split_needed' THEN 3
    ELSE 9
  END,
  target_subtype;
