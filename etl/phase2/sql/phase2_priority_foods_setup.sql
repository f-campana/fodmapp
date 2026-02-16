-- Phase 2 persistent priority table setup for existing databases.
-- Idempotent: safe to run repeatedly.

CREATE TABLE IF NOT EXISTS phase2_priority_foods (
  priority_rank INTEGER PRIMARY KEY CHECK (priority_rank > 0),
  gap_bucket TEXT NOT NULL CHECK (
    gap_bucket IN ('fructan_dominant', 'gos_dominant', 'polyol_split_needed')
  ),
  target_subtype TEXT NOT NULL REFERENCES fodmap_subtypes (code),
  food_label TEXT NOT NULL,
  variant_label TEXT NOT NULL,
  ciqual_code_hint TEXT,
  food_slug_hint TEXT,
  resolved_food_id UUID REFERENCES foods (food_id),
  resolution_method TEXT CHECK (
    resolution_method IN ('ciqual_code', 'slug_match', 'name_match', 'manual', 'new_food')
  ),
  resolution_notes TEXT,
  serving_g_provisional NUMERIC(8,2) NOT NULL CHECK (serving_g_provisional > 0),
  source_strategy TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_research' CHECK (
    status IN ('pending_research', 'resolved', 'measured', 'threshold_set')
  ),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_phase2_priority_foods_food_variant UNIQUE (food_label, variant_label)
);

INSERT INTO phase2_priority_foods (
  priority_rank,
  gap_bucket,
  target_subtype,
  food_label,
  variant_label,
  ciqual_code_hint,
  food_slug_hint,
  serving_g_provisional,
  source_strategy,
  status
) VALUES
  (1, 'fructan_dominant', 'fructan', 'ail', 'raw cloves', '11000', 'ail_cru', 3.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research'),
  (2, 'fructan_dominant', 'fructan', 'ail', 'powder', NULL, 'ail_poudre', 1.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research'),
  (3, 'fructan_dominant', 'fructan', 'ail', 'infused oil', NULL, 'huile_infusee_ail', 14.00, 'muir_2007_fructan|monash_app_v4_reference', 'pending_research'),
  (4, 'fructan_dominant', 'fructan', 'oignon', 'raw bulb', NULL, 'oignon_cru', 40.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research'),
  (5, 'fructan_dominant', 'fructan', 'oignon', 'cooked bulb', NULL, 'oignon_cuit', 60.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research'),
  (6, 'fructan_dominant', 'fructan', 'oignon', 'powder', NULL, 'oignon_poudre', 2.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research'),
  (7, 'fructan_dominant', 'fructan', 'oignon nouveau', 'white bulb', NULL, 'cebette_blanc', 15.00, 'muir_2007_fructan|monash_app_v4_reference', 'pending_research'),
  (8, 'fructan_dominant', 'fructan', 'oignon nouveau', 'green tops', NULL, 'cebette_vert', 30.00, 'muir_2007_fructan|monash_app_v4_reference', 'pending_research'),
  (9, 'fructan_dominant', 'fructan', 'echalote', 'raw bulb', NULL, 'echalote_crue', 20.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research'),
  (10, 'fructan_dominant', 'fructan', 'poireau', 'white part', NULL, 'poireau_blanc', 40.00, 'muir_2007_fructan|monash_app_v4_reference', 'pending_research'),
  (11, 'fructan_dominant', 'fructan', 'farine de ble', 'Type T55', NULL, 'farine_ble_t55', 40.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research'),
  (12, 'fructan_dominant', 'fructan', 'farine de ble', 'Type T65', NULL, 'farine_ble_t65', 40.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research'),
  (13, 'fructan_dominant', 'fructan', 'farine de ble', 'Type T80', NULL, 'farine_ble_t80', 40.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research'),
  (14, 'fructan_dominant', 'fructan', 'seigle', 'grain or flour', NULL, 'seigle', 40.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research'),
  (15, 'fructan_dominant', 'fructan', 'orge', 'pearled barley', NULL, 'orge_perle', 75.00, 'muir_2007_fructan|biesiekierski_2011_fructan|monash_app_v4_reference', 'pending_research'),
  (16, 'fructan_dominant', 'fructan', 'artichaut', 'globe heart', NULL, 'artichaut', 75.00, 'muir_2007_fructan|monash_app_v4_reference', 'pending_research'),
  (17, 'fructan_dominant', 'fructan', 'racine de chicoree', 'root', NULL, 'racine_chicoree', 30.00, 'muir_2007_fructan|monash_app_v4_reference', 'pending_research'),
  (18, 'gos_dominant', 'gos', 'pois chiche', 'canned drained', NULL, 'pois_chiche_conserve', 75.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research'),
  (19, 'gos_dominant', 'gos', 'lentille', 'green cooked', NULL, 'lentille_verte_cuite', 100.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research'),
  (20, 'gos_dominant', 'gos', 'lentille', 'red cooked', NULL, 'lentille_rouge_cuite', 100.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research'),
  (21, 'gos_dominant', 'gos', 'lentille', 'brown cooked', NULL, 'lentille_brune_cuite', 100.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research'),
  (22, 'gos_dominant', 'gos', 'haricot blanc', 'cooked', NULL, 'haricot_blanc_cuit', 90.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research'),
  (23, 'gos_dominant', 'gos', 'haricot rouge', 'cooked kidney bean', NULL, 'haricot_rouge_cuit', 90.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research'),
  (24, 'gos_dominant', 'gos', 'haricot noir', 'cooked', NULL, 'haricot_noir_cuit', 90.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research'),
  (25, 'gos_dominant', 'gos', 'pois casse', 'cooked', NULL, 'pois_casse_cuit', 90.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research'),
  (26, 'gos_dominant', 'gos', 'edamame', 'cooked', NULL, 'edamame_cuit', 75.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research'),
  (27, 'gos_dominant', 'gos', 'soja', 'whole cooked', NULL, 'soja_cuit', 75.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research'),
  (28, 'gos_dominant', 'gos', 'noix de cajou', 'raw', NULL, 'cajou_cru', 30.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research'),
  (29, 'gos_dominant', 'gos', 'pistache', 'raw', NULL, 'pistache_crue', 30.00, 'dysseler_hoffem_gos|monash_app_v4_reference', 'pending_research'),
  (30, 'polyol_split_needed', 'sorbitol', 'pomme', 'raw', NULL, 'pomme_crue', 125.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research'),
  (31, 'polyol_split_needed', 'sorbitol', 'poire', 'raw', NULL, 'poire_crue', 120.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research'),
  (32, 'polyol_split_needed', 'sorbitol', 'cerise', 'sweet raw', NULL, 'cerise_crue', 80.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research'),
  (33, 'polyol_split_needed', 'sorbitol', 'peche', 'raw', NULL, 'peche_crue', 120.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research'),
  (34, 'polyol_split_needed', 'sorbitol', 'nectarine', 'raw', NULL, 'nectarine_crue', 120.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research'),
  (35, 'polyol_split_needed', 'sorbitol', 'prune', 'raw', NULL, 'prune_crue', 120.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research'),
  (36, 'polyol_split_needed', 'sorbitol', 'pruneau', 'dried', NULL, 'pruneau_sec', 30.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research'),
  (37, 'polyol_split_needed', 'mannitol', 'champignon de paris', 'button mushroom', NULL, 'champignon_paris', 75.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research'),
  (38, 'polyol_split_needed', 'mannitol', 'shiitake', 'mushroom', NULL, 'shiitake', 60.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research'),
  (39, 'polyol_split_needed', 'mannitol', 'pleurote', 'oyster mushroom', NULL, 'pleurote', 75.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research'),
  (40, 'polyol_split_needed', 'mannitol', 'chou-fleur', 'florets', NULL, 'chou_fleur', 90.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research'),
  (41, 'polyol_split_needed', 'mannitol', 'patate douce', 'cooked', NULL, 'patate_douce_cuite', 90.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research'),
  (42, 'polyol_split_needed', 'mannitol', 'celeri', 'stalk', NULL, 'celeri_branche', 75.00, 'yao_2005_polyols|monash_app_v4_reference', 'pending_research')
ON CONFLICT (priority_rank) DO UPDATE
SET
  gap_bucket = EXCLUDED.gap_bucket,
  target_subtype = EXCLUDED.target_subtype,
  food_label = EXCLUDED.food_label,
  variant_label = EXCLUDED.variant_label,
  ciqual_code_hint = EXCLUDED.ciqual_code_hint,
  food_slug_hint = EXCLUDED.food_slug_hint,
  serving_g_provisional = EXCLUDED.serving_g_provisional,
  source_strategy = EXCLUDED.source_strategy,
  updated_at = now();

SELECT
  COUNT(*) AS phase2_priority_foods_count,
  COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL) AS resolved_count,
  COUNT(*) FILTER (WHERE resolved_food_id IS NULL) AS unresolved_count
FROM phase2_priority_foods;
