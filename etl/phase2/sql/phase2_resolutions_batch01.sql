-- Phase 2 batch01 approved resolutions.
-- Generated from: /Users/fabiencampana/Documents/Fodmap/etl/phase2/decisions/phase2_batch01_decisions.csv
-- Applies only rows explicitly marked decision=resolve.

BEGIN;
UPDATE phase2_priority_foods
SET
  resolved_food_id = 'bb10962e-8571-4195-839a-cbfa40e2fbc3'::uuid,
  resolution_method = 'name_match',
  resolution_notes = 'Batch01 conservative manual approval against top candidate CIQUAL 11023',
  status = CASE WHEN status = 'pending_research' THEN 'resolved' ELSE status END,
  resolved_at = now(),
  resolved_by = 'fabiencampana',
  updated_at = now()
WHERE priority_rank = 2
  AND resolved_food_id IS NULL;

UPDATE phase2_priority_foods
SET
  resolved_food_id = 'ecb2d1ad-bcaf-457b-a4d2-398aa8a2028f'::uuid,
  resolution_method = 'slug_match',
  resolution_notes = 'Batch01 conservative manual approval against top candidate CIQUAL 20034',
  status = CASE WHEN status = 'pending_research' THEN 'resolved' ELSE status END,
  resolved_at = now(),
  resolved_by = 'fabiencampana',
  updated_at = now()
WHERE priority_rank = 4
  AND resolved_food_id IS NULL;

UPDATE phase2_priority_foods
SET
  resolved_food_id = 'b45a2629-dae8-4769-adf9-d44d90b7ab88'::uuid,
  resolution_method = 'slug_match',
  resolution_notes = 'Batch01 conservative manual approval against top candidate CIQUAL 20035',
  status = CASE WHEN status = 'pending_research' THEN 'resolved' ELSE status END,
  resolved_at = now(),
  resolved_by = 'fabiencampana',
  updated_at = now()
WHERE priority_rank = 5
  AND resolved_food_id IS NULL;

UPDATE phase2_priority_foods
SET
  resolved_food_id = '723768b7-0258-4f7e-b292-9f4217fef485'::uuid,
  resolution_method = 'slug_match',
  resolution_notes = 'Batch01 conservative manual approval against top candidate CIQUAL 9390',
  status = CASE WHEN status = 'pending_research' THEN 'resolved' ELSE status END,
  resolved_at = now(),
  resolved_by = 'fabiencampana',
  updated_at = now()
WHERE priority_rank = 14
  AND resolved_food_id IS NULL;

UPDATE phase2_priority_foods
SET
  resolved_food_id = '356c4137-25d0-4cb6-a949-43b224a0e467'::uuid,
  resolution_method = 'slug_match',
  resolution_notes = 'Batch01 conservative manual approval against top candidate CIQUAL 9322',
  status = CASE WHEN status = 'pending_research' THEN 'resolved' ELSE status END,
  resolved_at = now(),
  resolved_by = 'fabiencampana',
  updated_at = now()
WHERE priority_rank = 15
  AND resolved_food_id IS NULL;

UPDATE phase2_priority_foods
SET
  resolved_food_id = '79a57df8-2742-499f-962a-7c3393284103'::uuid,
  resolution_method = 'name_match',
  resolution_notes = 'Batch01 conservative manual approval against top candidate CIQUAL 13149',
  status = CASE WHEN status = 'pending_research' THEN 'resolved' ELSE status END,
  resolved_at = now(),
  resolved_by = 'fabiencampana',
  updated_at = now()
WHERE priority_rank = 34
  AND resolved_food_id IS NULL;

UPDATE phase2_priority_foods
SET
  resolved_food_id = '99eb1372-c7c8-4039-931f-6e8fb4618df4'::uuid,
  resolution_method = 'slug_match',
  resolution_notes = 'Batch01 conservative manual approval against top candidate CIQUAL 20114',
  status = CASE WHEN status = 'pending_research' THEN 'resolved' ELSE status END,
  resolved_at = now(),
  resolved_by = 'fabiencampana',
  updated_at = now()
WHERE priority_rank = 39
  AND resolved_food_id IS NULL;

UPDATE phase2_priority_foods
SET
  resolved_food_id = '9b0f08d0-bcb1-4531-913d-bde294d2195b'::uuid,
  resolution_method = 'slug_match',
  resolution_notes = 'Batch01 conservative manual approval against top candidate CIQUAL 20017',
  status = CASE WHEN status = 'pending_research' THEN 'resolved' ELSE status END,
  resolved_at = now(),
  resolved_by = 'fabiencampana',
  updated_at = now()
WHERE priority_rank = 40
  AND resolved_food_id IS NULL;

UPDATE phase2_priority_foods
SET
  resolved_food_id = '1489c2db-2807-4389-bc8a-e93cbd1504fc'::uuid,
  resolution_method = 'slug_match',
  resolution_notes = 'Batch01 conservative manual approval against top candidate CIQUAL 4102',
  status = CASE WHEN status = 'pending_research' THEN 'resolved' ELSE status END,
  resolved_at = now(),
  resolved_by = 'fabiencampana',
  updated_at = now()
WHERE priority_rank = 41
  AND resolved_food_id IS NULL;

COMMIT;

SELECT
  COUNT(*) FILTER (WHERE resolved_food_id IS NOT NULL) AS resolved_count,
  COUNT(*) FILTER (WHERE resolved_food_id IS NULL) AS unresolved_count
FROM phase2_priority_foods;
