\restrict dbmate

-- Dumped from database version 16.12
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: comparator_code; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.comparator_code AS ENUM (
    'eq',
    'lt',
    'lte',
    'gt',
    'gte',
    'trace',
    'nd',
    'missing'
);


--
-- Name: evidence_tier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.evidence_tier AS ENUM (
    'primary_lab',
    'secondary_db',
    'inferred'
);


--
-- Name: fodmap_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.fodmap_level AS ENUM (
    'none',
    'low',
    'moderate',
    'high',
    'unknown'
);


--
-- Name: fr_availability; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.fr_availability AS ENUM (
    'common',
    'specialty',
    'seasonal',
    'rare'
);


--
-- Name: fr_retailer; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.fr_retailer AS ENUM (
    'supermarche',
    'marche',
    'bio',
    'epicerie_fine',
    'asiatique',
    'en_ligne'
);


--
-- Name: measurement_basis; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.measurement_basis AS ENUM (
    'per_100g',
    'per_100ml',
    'per_serving'
);


--
-- Name: preparation_state; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.preparation_state AS ENUM (
    'raw',
    'cooked',
    'processed',
    'fermented',
    'rehydrated',
    'unknown'
);


--
-- Name: swap_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.swap_status AS ENUM (
    'draft',
    'active',
    'deprecated'
);


--
-- Name: tolerance_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tolerance_level AS ENUM (
    'tolerates',
    'moderate',
    'cannot_tolerate',
    'unknown'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: publish_release_current; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publish_release_current (
    release_kind text NOT NULL,
    publish_id uuid NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT publish_release_current_release_kind_check CHECK ((length(TRIM(BOTH FROM release_kind)) > 0))
);


--
-- Name: published_food_rollups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.published_food_rollups (
    publish_id uuid NOT NULL,
    priority_rank integer NOT NULL,
    food_id uuid NOT NULL,
    rollup_serving_g numeric(8,2),
    overall_level public.fodmap_level NOT NULL,
    driver_subtype_code text,
    known_subtypes_count integer NOT NULL,
    coverage_ratio numeric(6,4) NOT NULL,
    source_slug text NOT NULL,
    computed_at timestamp with time zone NOT NULL,
    CONSTRAINT published_food_rollups_coverage_ratio_check CHECK (((coverage_ratio >= (0)::numeric) AND (coverage_ratio <= (1)::numeric))),
    CONSTRAINT published_food_rollups_known_subtypes_count_check CHECK (((known_subtypes_count >= 0) AND (known_subtypes_count <= 6))),
    CONSTRAINT published_food_rollups_priority_rank_check CHECK ((priority_rank > 0)),
    CONSTRAINT published_food_rollups_rollup_serving_g_check CHECK (((rollup_serving_g IS NULL) OR (rollup_serving_g > (0)::numeric)))
);


--
-- Name: api_food_rollups_current; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.api_food_rollups_current AS
 WITH current_release AS (
         SELECT cur_1.publish_id
           FROM public.publish_release_current cur_1
          WHERE (cur_1.release_kind = 'api_v0_phase3'::text)
        )
 SELECT pfr.publish_id,
    pfr.priority_rank,
    pfr.food_id,
    pfr.rollup_serving_g,
    pfr.overall_level,
    pfr.driver_subtype_code,
    pfr.known_subtypes_count,
    pfr.coverage_ratio,
    pfr.source_slug,
    pfr.computed_at
   FROM (public.published_food_rollups pfr
     JOIN current_release cur ON ((cur.publish_id = pfr.publish_id)));


--
-- Name: published_food_subtype_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.published_food_subtype_levels (
    publish_id uuid NOT NULL,
    priority_rank integer NOT NULL,
    food_id uuid NOT NULL,
    rollup_serving_g numeric(8,2),
    subtype_code text NOT NULL,
    fodmap_subtype_id smallint,
    amount_g_per_serving numeric(12,6),
    comparator public.comparator_code,
    low_max_g numeric(12,6),
    moderate_max_g numeric(12,6),
    subtype_level public.fodmap_level NOT NULL,
    signal_source_kind text,
    signal_source_slug text,
    threshold_source_slug text,
    is_default_threshold boolean DEFAULT false NOT NULL,
    is_polyol_proxy boolean DEFAULT false NOT NULL,
    burden_ratio numeric(12,6),
    computed_at timestamp with time zone NOT NULL,
    CONSTRAINT published_food_subtype_levels_priority_rank_check CHECK ((priority_rank > 0)),
    CONSTRAINT published_food_subtype_levels_rollup_serving_g_check CHECK (((rollup_serving_g IS NULL) OR (rollup_serving_g > (0)::numeric)))
);


--
-- Name: api_food_subtypes_current; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.api_food_subtypes_current AS
 WITH current_release AS (
         SELECT cur_1.publish_id
           FROM public.publish_release_current cur_1
          WHERE (cur_1.release_kind = 'api_v0_phase3'::text)
        )
 SELECT pfs.publish_id,
    pfs.priority_rank,
    pfs.food_id,
    pfs.rollup_serving_g,
    pfs.subtype_code,
    pfs.fodmap_subtype_id,
    pfs.amount_g_per_serving,
    pfs.comparator,
    pfs.low_max_g,
    pfs.moderate_max_g,
    pfs.subtype_level,
    pfs.signal_source_kind,
    pfs.signal_source_slug,
    pfs.threshold_source_slug,
    pfs.is_default_threshold,
    pfs.is_polyol_proxy,
    pfs.burden_ratio,
    pfs.computed_at
   FROM (public.published_food_subtype_levels pfs
     JOIN current_release cur ON ((cur.publish_id = pfs.publish_id)));


--
-- Name: publish_releases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publish_releases (
    publish_id uuid DEFAULT gen_random_uuid() NOT NULL,
    release_kind text NOT NULL,
    published_at timestamp with time zone DEFAULT now() NOT NULL,
    rollup_computed_at_max timestamp with time zone,
    rollup_row_count integer DEFAULT 0 NOT NULL,
    subtype_row_count integer DEFAULT 0 NOT NULL,
    swap_row_count integer DEFAULT 0 NOT NULL,
    notes text,
    CONSTRAINT publish_releases_release_kind_check CHECK ((length(TRIM(BOTH FROM release_kind)) > 0)),
    CONSTRAINT publish_releases_rollup_row_count_check CHECK ((rollup_row_count >= 0)),
    CONSTRAINT publish_releases_subtype_row_count_check CHECK ((subtype_row_count >= 0)),
    CONSTRAINT publish_releases_swap_row_count_check CHECK ((swap_row_count >= 0))
);


--
-- Name: api_publish_meta_current; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.api_publish_meta_current AS
 WITH current_release AS (
         SELECT cur_1.publish_id
           FROM public.publish_release_current cur_1
          WHERE (cur_1.release_kind = 'api_v0_phase3'::text)
        )
 SELECT (pr.publish_id)::text AS publish_id,
    pr.release_kind,
    pr.published_at,
    pr.rollup_computed_at_max,
    pr.rollup_row_count,
    pr.subtype_row_count,
    pr.swap_row_count
   FROM (public.publish_releases pr
     JOIN current_release cur ON ((cur.publish_id = pr.publish_id)));


--
-- Name: published_swaps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.published_swaps (
    publish_id uuid NOT NULL,
    swap_rule_id uuid NOT NULL,
    from_food_id uuid NOT NULL,
    to_food_id uuid NOT NULL,
    from_food_slug text NOT NULL,
    to_food_slug text NOT NULL,
    from_food_name_fr text,
    from_food_name_en text,
    to_food_name_fr text,
    to_food_name_en text,
    instruction_fr text NOT NULL,
    instruction_en text NOT NULL,
    rule_status public.swap_status NOT NULL,
    source_slug text NOT NULL,
    scoring_version text NOT NULL,
    fodmap_safety_score numeric(4,3) NOT NULL,
    overall_score numeric(4,3) NOT NULL,
    from_priority_rank integer,
    to_priority_rank integer,
    from_overall_level public.fodmap_level NOT NULL,
    to_overall_level public.fodmap_level NOT NULL,
    driver_subtype text,
    from_burden_ratio numeric(12,6),
    to_burden_ratio numeric(12,6),
    coverage_ratio numeric(6,4) NOT NULL,
    rollup_computed_at timestamp with time zone NOT NULL,
    CONSTRAINT published_swaps_coverage_ratio_check CHECK (((coverage_ratio >= (0)::numeric) AND (coverage_ratio <= (1)::numeric))),
    CONSTRAINT published_swaps_fodmap_safety_score_check CHECK (((fodmap_safety_score >= (0)::numeric) AND (fodmap_safety_score <= (1)::numeric))),
    CONSTRAINT published_swaps_from_priority_rank_check CHECK (((from_priority_rank IS NULL) OR (from_priority_rank > 0))),
    CONSTRAINT published_swaps_overall_score_check CHECK (((overall_score >= (0)::numeric) AND (overall_score <= (1)::numeric))),
    CONSTRAINT published_swaps_to_priority_rank_check CHECK (((to_priority_rank IS NULL) OR (to_priority_rank > 0)))
);


--
-- Name: api_swaps_current; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.api_swaps_current AS
 WITH current_release AS (
         SELECT cur_1.publish_id
           FROM public.publish_release_current cur_1
          WHERE (cur_1.release_kind = 'api_v0_phase3'::text)
        )
 SELECT ps.publish_id,
    ps.swap_rule_id,
    ps.from_food_id,
    ps.to_food_id,
    ps.from_food_slug,
    ps.to_food_slug,
    ps.from_food_name_fr,
    ps.from_food_name_en,
    ps.to_food_name_fr,
    ps.to_food_name_en,
    ps.instruction_fr,
    ps.instruction_en,
    ps.rule_status,
    ps.source_slug,
    ps.scoring_version,
    ps.fodmap_safety_score,
    ps.overall_score,
    ps.from_priority_rank,
    ps.to_priority_rank,
    ps.from_overall_level,
    ps.to_overall_level,
    ps.driver_subtype,
    ps.from_burden_ratio,
    ps.to_burden_ratio,
    ps.coverage_ratio,
    ps.rollup_computed_at
   FROM (public.published_swaps ps
     JOIN current_release cur ON ((cur.publish_id = ps.publish_id)));


--
-- Name: cooking_behaviors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cooking_behaviors (
    behavior_code text NOT NULL,
    label_fr text NOT NULL,
    label_en text NOT NULL
);


--
-- Name: cuisine_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuisine_tags (
    cuisine_code text NOT NULL,
    label_fr text NOT NULL,
    label_en text NOT NULL
);


--
-- Name: culinary_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.culinary_roles (
    role_code text NOT NULL,
    label_fr text NOT NULL,
    label_en text NOT NULL,
    description text
);


--
-- Name: custom_foods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.custom_foods (
    custom_food_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    label text NOT NULL,
    note text,
    version bigint DEFAULT 1 NOT NULL,
    created_at_utc timestamp with time zone DEFAULT now() NOT NULL,
    updated_at_utc timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT custom_foods_version_check CHECK ((version >= 1))
);


--
-- Name: data_licenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_licenses (
    license_id uuid DEFAULT gen_random_uuid() NOT NULL,
    spdx_id text,
    name text NOT NULL,
    url text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: eu_allergens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.eu_allergens (
    allergen_code text NOT NULL,
    annex_ii_name_en text NOT NULL,
    annex_ii_name_fr text NOT NULL,
    annex_ii_order smallint NOT NULL
);


--
-- Name: flavor_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flavor_notes (
    flavor_code text NOT NULL,
    label_fr text NOT NULL,
    label_en text NOT NULL
);


--
-- Name: fodmap_subtypes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fodmap_subtypes (
    fodmap_subtype_id smallint NOT NULL,
    code text NOT NULL,
    family text NOT NULL,
    display_name_fr text NOT NULL,
    display_name_en text NOT NULL,
    is_polyol boolean DEFAULT false NOT NULL,
    CONSTRAINT fodmap_subtypes_code_check CHECK ((code = ANY (ARRAY['fructose'::text, 'lactose'::text, 'fructan'::text, 'gos'::text, 'sorbitol'::text, 'mannitol'::text]))),
    CONSTRAINT fodmap_subtypes_family_check CHECK ((family = ANY (ARRAY['monosaccharide'::text, 'disaccharide'::text, 'oligosaccharide'::text, 'polyol'::text])))
);


--
-- Name: fodmap_subtypes_fodmap_subtype_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fodmap_subtypes_fodmap_subtype_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fodmap_subtypes_fodmap_subtype_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fodmap_subtypes_fodmap_subtype_id_seq OWNED BY public.fodmap_subtypes.fodmap_subtype_id;


--
-- Name: food_allergens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.food_allergens (
    food_id uuid NOT NULL,
    allergen_code text NOT NULL,
    presence_status text NOT NULL,
    source_id uuid NOT NULL,
    CONSTRAINT food_allergens_presence_status_check CHECK ((presence_status = ANY (ARRAY['contains'::text, 'may_contain'::text, 'unknown'::text])))
);


--
-- Name: food_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.food_categories (
    category_id bigint NOT NULL,
    code text,
    parent_category_id bigint,
    name_fr text NOT NULL,
    name_en text,
    level smallint,
    source_system text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT food_categories_level_check CHECK (((level >= 1) AND (level <= 4)))
);


--
-- Name: food_categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.food_categories_category_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: food_categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.food_categories_category_id_seq OWNED BY public.food_categories.category_id;


--
-- Name: food_category_memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.food_category_memberships (
    food_id uuid NOT NULL,
    category_id bigint NOT NULL,
    source_id uuid NOT NULL,
    is_primary boolean DEFAULT false NOT NULL
);


--
-- Name: food_cooking_behaviors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.food_cooking_behaviors (
    food_id uuid NOT NULL,
    behavior_code text NOT NULL,
    source_id uuid
);


--
-- Name: food_cuisine_affinities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.food_cuisine_affinities (
    food_id uuid NOT NULL,
    cuisine_code text NOT NULL,
    weight numeric(4,3),
    source_id uuid,
    CONSTRAINT food_cuisine_affinities_weight_check CHECK (((weight IS NULL) OR ((weight >= (0)::numeric) AND (weight <= (1)::numeric))))
);


--
-- Name: food_culinary_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.food_culinary_roles (
    food_id uuid NOT NULL,
    role_code text NOT NULL,
    intensity smallint DEFAULT 3 NOT NULL,
    source_id uuid,
    CONSTRAINT food_culinary_roles_intensity_check CHECK (((intensity >= 1) AND (intensity <= 5)))
);


--
-- Name: food_external_refs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.food_external_refs (
    food_id uuid NOT NULL,
    ref_system text NOT NULL,
    ref_value text NOT NULL,
    source_id uuid,
    country_code character(2) DEFAULT 'FR'::bpchar NOT NULL,
    valid_from date,
    valid_to date,
    CONSTRAINT food_external_refs_ref_system_check CHECK ((ref_system = ANY (ARRAY['CIQUAL'::text, 'OPEN_FOOD_FACTS'::text, 'MONASH'::text, 'FODMAP_FRIENDLY'::text, 'USDA'::text, 'EAN13'::text, 'CUSTOM'::text])))
);


--
-- Name: food_flavor_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.food_flavor_profiles (
    food_id uuid NOT NULL,
    flavor_code text NOT NULL,
    intensity smallint DEFAULT 3 NOT NULL,
    source_id uuid,
    CONSTRAINT food_flavor_profiles_intensity_check CHECK (((intensity >= 1) AND (intensity <= 5)))
);


--
-- Name: food_fodmap_measurements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.food_fodmap_measurements (
    measurement_id bigint NOT NULL,
    food_id uuid NOT NULL,
    fodmap_subtype_id smallint NOT NULL,
    source_id uuid NOT NULL,
    source_record_ref text,
    amount_raw text NOT NULL,
    comparator public.comparator_code DEFAULT 'eq'::public.comparator_code NOT NULL,
    amount_g_per_100g numeric(12,6),
    amount_g_per_serving numeric(12,6),
    serving_g numeric(8,2),
    method text NOT NULL,
    evidence_tier public.evidence_tier DEFAULT 'secondary_db'::public.evidence_tier NOT NULL,
    confidence_score numeric(4,3),
    observed_at date,
    is_current boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT food_fodmap_measurements_confidence_score_check CHECK (((confidence_score IS NULL) OR ((confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric)))),
    CONSTRAINT food_fodmap_measurements_method_check CHECK ((method = ANY (ARRAY['lab'::text, 'literature'::text, 'derived_from_nutrient'::text, 'expert_estimate'::text, 'user_report'::text])))
);


--
-- Name: food_fodmap_measurements_measurement_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.food_fodmap_measurements_measurement_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: food_fodmap_measurements_measurement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.food_fodmap_measurements_measurement_id_seq OWNED BY public.food_fodmap_measurements.measurement_id;


--
-- Name: food_fodmap_rollups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.food_fodmap_rollups (
    food_id uuid NOT NULL,
    serving_g numeric(8,2) NOT NULL,
    overall_level public.fodmap_level NOT NULL,
    driver_fodmap_subtype_id smallint,
    source_id uuid NOT NULL,
    computed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT food_fodmap_rollups_serving_g_check CHECK ((serving_g > (0)::numeric))
);


--
-- Name: food_fodmap_thresholds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.food_fodmap_thresholds (
    threshold_id bigint NOT NULL,
    food_id uuid NOT NULL,
    fodmap_subtype_id smallint NOT NULL,
    source_id uuid NOT NULL,
    serving_g numeric(8,2) NOT NULL,
    low_max_g numeric(12,6),
    moderate_max_g numeric(12,6),
    threshold_basis text DEFAULT 'per_serving'::text NOT NULL,
    evidence_tier public.evidence_tier DEFAULT 'secondary_db'::public.evidence_tier NOT NULL,
    confidence_score numeric(4,3),
    valid_from date DEFAULT CURRENT_DATE NOT NULL,
    valid_to date,
    notes text,
    CONSTRAINT chk_threshold_order CHECK ((((low_max_g IS NULL) AND (moderate_max_g IS NULL)) OR ((low_max_g IS NOT NULL) AND (moderate_max_g IS NOT NULL) AND (low_max_g <= moderate_max_g)))),
    CONSTRAINT food_fodmap_thresholds_confidence_score_check CHECK (((confidence_score IS NULL) OR ((confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric)))),
    CONSTRAINT food_fodmap_thresholds_serving_g_check CHECK ((serving_g > (0)::numeric)),
    CONSTRAINT food_fodmap_thresholds_threshold_basis_check CHECK ((threshold_basis = 'per_serving'::text))
);


--
-- Name: food_fodmap_thresholds_threshold_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.food_fodmap_thresholds_threshold_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: food_fodmap_thresholds_threshold_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.food_fodmap_thresholds_threshold_id_seq OWNED BY public.food_fodmap_thresholds.threshold_id;


--
-- Name: food_fr_contexts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.food_fr_contexts (
    food_id uuid NOT NULL,
    availability public.fr_availability DEFAULT 'common'::public.fr_availability NOT NULL,
    typical_retailers public.fr_retailer[] DEFAULT '{}'::public.fr_retailer[] NOT NULL,
    aop_aoc_igp text,
    peak_months smallint[] DEFAULT '{}'::smallint[] NOT NULL,
    available_months smallint[] DEFAULT '{}'::smallint[] NOT NULL,
    imported_year_round boolean DEFAULT false NOT NULL,
    regional_notes_fr text,
    regional_notes_en text,
    source_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_food_fr_available_months CHECK ((available_months <@ ARRAY[(1)::smallint, (2)::smallint, (3)::smallint, (4)::smallint, (5)::smallint, (6)::smallint, (7)::smallint, (8)::smallint, (9)::smallint, (10)::smallint, (11)::smallint, (12)::smallint])),
    CONSTRAINT chk_food_fr_peak_months CHECK ((peak_months <@ ARRAY[(1)::smallint, (2)::smallint, (3)::smallint, (4)::smallint, (5)::smallint, (6)::smallint, (7)::smallint, (8)::smallint, (9)::smallint, (10)::smallint, (11)::smallint, (12)::smallint]))
);


--
-- Name: food_names; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.food_names (
    food_name_id bigint NOT NULL,
    food_id uuid NOT NULL,
    locale_code text DEFAULT 'fr-FR'::text NOT NULL,
    name text NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    source_id uuid
);


--
-- Name: food_names_food_name_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.food_names_food_name_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: food_names_food_name_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.food_names_food_name_id_seq OWNED BY public.food_names.food_name_id;


--
-- Name: food_nutrient_observations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.food_nutrient_observations (
    observation_id bigint NOT NULL,
    food_id uuid NOT NULL,
    nutrient_id bigint NOT NULL,
    source_id uuid NOT NULL,
    source_record_ref text,
    amount_raw text NOT NULL,
    comparator public.comparator_code DEFAULT 'eq'::public.comparator_code NOT NULL,
    amount_value numeric(12,6),
    min_value numeric(12,6),
    max_value numeric(12,6),
    basis public.measurement_basis DEFAULT 'per_100g'::public.measurement_basis NOT NULL,
    serving_g numeric(8,2),
    confidence_code text,
    confidence_score numeric(4,3),
    observed_at date,
    effective_from date DEFAULT CURRENT_DATE NOT NULL,
    effective_to date,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT food_nutrient_observations_confidence_score_check CHECK (((confidence_score IS NULL) OR ((confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric))))
);


--
-- Name: food_nutrient_observations_observation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.food_nutrient_observations_observation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: food_nutrient_observations_observation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.food_nutrient_observations_observation_id_seq OWNED BY public.food_nutrient_observations.observation_id;


--
-- Name: food_safe_harbor_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.food_safe_harbor_assignments (
    food_id uuid NOT NULL,
    cohort_code text NOT NULL,
    rule_source_id uuid NOT NULL,
    data_source_id uuid NOT NULL,
    assignment_version text NOT NULL,
    assignment_method text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT food_safe_harbor_assignments_assignment_method_check CHECK ((assignment_method = 'explicit_measurement_pack_v1'::text)),
    CONSTRAINT food_safe_harbor_assignments_assignment_version_check CHECK ((length(TRIM(BOTH FROM assignment_version)) > 0))
);


--
-- Name: food_texture_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.food_texture_profiles (
    food_id uuid NOT NULL,
    texture_code text NOT NULL,
    intensity smallint DEFAULT 3 NOT NULL,
    source_id uuid,
    CONSTRAINT food_texture_profiles_intensity_check CHECK (((intensity >= 1) AND (intensity <= 5)))
);


--
-- Name: foods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.foods (
    food_id uuid DEFAULT gen_random_uuid() NOT NULL,
    food_slug text NOT NULL,
    canonical_name_fr text,
    canonical_name_en text,
    scientific_name text,
    description_fr text,
    preparation_state public.preparation_state DEFAULT 'unknown'::public.preparation_state NOT NULL,
    default_serving_g numeric(8,2),
    edible_portion_pct numeric(5,2),
    density_g_per_ml numeric(8,4),
    is_branded_product boolean DEFAULT false NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT foods_default_serving_g_check CHECK (((default_serving_g IS NULL) OR (default_serving_g > (0)::numeric))),
    CONSTRAINT foods_density_g_per_ml_check CHECK (((density_g_per_ml IS NULL) OR (density_g_per_ml > (0)::numeric))),
    CONSTRAINT foods_edible_portion_pct_check CHECK (((edible_portion_pct IS NULL) OR ((edible_portion_pct >= (0)::numeric) AND (edible_portion_pct <= (100)::numeric)))),
    CONSTRAINT foods_status_check CHECK ((status = ANY (ARRAY['active'::text, 'draft'::text, 'deprecated'::text])))
);


--
-- Name: ingestion_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ingestion_runs (
    ingestion_run_id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_id uuid NOT NULL,
    pipeline_name text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    status text NOT NULL,
    records_read bigint DEFAULT 0 NOT NULL,
    records_loaded bigint DEFAULT 0 NOT NULL,
    records_error bigint DEFAULT 0 NOT NULL,
    notes text,
    CONSTRAINT ingestion_runs_status_check CHECK ((status = ANY (ARRAY['running'::text, 'success'::text, 'failed'::text])))
);


--
-- Name: me_auth_identities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.me_auth_identities (
    user_id uuid NOT NULL,
    auth_provider text NOT NULL,
    auth_subject text NOT NULL,
    created_at_utc timestamp with time zone DEFAULT now() NOT NULL,
    last_authenticated_at_utc timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT me_auth_identities_auth_provider_check CHECK ((auth_provider = 'clerk'::text))
);


--
-- Name: me_delete_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.me_delete_jobs (
    delete_request_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    idempotency_key text,
    requested_by_actor_id uuid,
    scope text NOT NULL,
    reason text,
    status text NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    soft_delete_window_days integer,
    hard_delete boolean DEFAULT true NOT NULL,
    summary jsonb,
    proof jsonb,
    error_code text,
    error_detail text,
    CONSTRAINT me_delete_jobs_scope_check CHECK ((scope = ANY (ARRAY['all'::text, 'symptoms_only'::text, 'diet_only'::text, 'analytics_only'::text]))),
    CONSTRAINT me_delete_jobs_status_check CHECK ((status = ANY (ARRAY['accepted'::text, 'queued'::text, 'processing'::text, 'completed'::text, 'partial'::text, 'failed'::text])))
);


--
-- Name: me_device_signing_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.me_device_signing_keys (
    user_id uuid NOT NULL,
    device_id text NOT NULL,
    key_id text NOT NULL,
    secret_b64 text NOT NULL,
    algorithm text DEFAULT 'hmac-sha256'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    valid_from timestamp with time zone DEFAULT now() NOT NULL,
    valid_until timestamp with time zone,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by_actor_id uuid,
    CONSTRAINT me_device_signing_keys_status_check CHECK ((status = ANY (ARRAY['active'::text, 'revoked'::text, 'suspended'::text])))
);


--
-- Name: me_entity_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.me_entity_versions (
    user_id uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    current_version bigint DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: me_export_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.me_export_jobs (
    export_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    idempotency_key text,
    requested_by_actor_id uuid,
    status text NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    requested_scope jsonb NOT NULL,
    include_domain text[] DEFAULT ARRAY[]::text[] NOT NULL,
    rows_by_domain jsonb DEFAULT '{}'::jsonb NOT NULL,
    redactions text[] DEFAULT ARRAY[]::text[] NOT NULL,
    manifest jsonb,
    proof jsonb,
    download_url text,
    error_code text,
    error_detail text,
    expires_at timestamp with time zone DEFAULT (now() + '1 day'::interval) NOT NULL,
    CONSTRAINT me_export_jobs_status_check CHECK ((status = ANY (ARRAY['accepted'::text, 'queued'::text, 'processing'::text, 'ready'::text, 'ready_with_redactions'::text, 'failed'::text, 'completed'::text])))
);


--
-- Name: me_mutation_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.me_mutation_queue (
    mutation_id uuid DEFAULT gen_random_uuid() NOT NULL,
    idempotency_key text NOT NULL,
    queue_item_id uuid NOT NULL,
    user_id uuid NOT NULL,
    device_id text NOT NULL,
    app_install_id text NOT NULL,
    op text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    client_seq bigint NOT NULL,
    base_version bigint,
    payload_hash text NOT NULL,
    aad jsonb DEFAULT '{}'::jsonb NOT NULL,
    envelope_json jsonb NOT NULL,
    signature_algorithm text DEFAULT 'hmac-sha256'::text NOT NULL,
    signature_kid text NOT NULL,
    signature text NOT NULL,
    status text DEFAULT 'accepted'::text NOT NULL,
    error_code text,
    error_detail text,
    replay_window_expires_at timestamp with time zone NOT NULL,
    received_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    chain_prev_hash text,
    chain_item_hash text,
    CONSTRAINT me_mutation_queue_status_check CHECK ((status = ANY (ARRAY['accepted'::text, 'duplicate'::text, 'conflict'::text, 'replayed'::text, 'rejected'::text, 'error'::text])))
);


--
-- Name: meal_log_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meal_log_items (
    meal_log_item_id uuid DEFAULT gen_random_uuid() NOT NULL,
    meal_log_id uuid NOT NULL,
    sort_order integer NOT NULL,
    item_kind text NOT NULL,
    food_id uuid,
    food_slug_snapshot text,
    custom_food_id uuid,
    free_text_label text,
    label_snapshot text NOT NULL,
    quantity_text text,
    note text,
    CONSTRAINT meal_log_items_check CHECK ((((item_kind = 'canonical_food'::text) AND (food_id IS NOT NULL) AND (food_slug_snapshot IS NOT NULL) AND (custom_food_id IS NULL) AND (free_text_label IS NULL)) OR ((item_kind = 'custom_food'::text) AND (food_id IS NULL) AND (food_slug_snapshot IS NULL) AND (custom_food_id IS NOT NULL) AND (free_text_label IS NULL)) OR ((item_kind = 'free_text'::text) AND (food_id IS NULL) AND (food_slug_snapshot IS NULL) AND (custom_food_id IS NULL) AND (free_text_label IS NOT NULL)))),
    CONSTRAINT meal_log_items_item_kind_check CHECK ((item_kind = ANY (ARRAY['canonical_food'::text, 'custom_food'::text, 'free_text'::text]))),
    CONSTRAINT meal_log_items_sort_order_check CHECK ((sort_order >= 0))
);


--
-- Name: meal_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meal_logs (
    meal_log_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text,
    occurred_at_utc timestamp with time zone NOT NULL,
    note text,
    version bigint DEFAULT 1 NOT NULL,
    created_at_utc timestamp with time zone DEFAULT now() NOT NULL,
    updated_at_utc timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT meal_logs_version_check CHECK ((version >= 1))
);


--
-- Name: nutrient_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nutrient_definitions (
    nutrient_id bigint NOT NULL,
    nutrient_code text NOT NULL,
    infoods_code text,
    name_fr text NOT NULL,
    name_en text,
    unit text NOT NULL,
    default_basis public.measurement_basis DEFAULT 'per_100g'::public.measurement_basis NOT NULL,
    is_fodmap_relevant boolean DEFAULT false NOT NULL,
    notes text
);


--
-- Name: nutrient_definitions_nutrient_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.nutrient_definitions_nutrient_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nutrient_definitions_nutrient_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.nutrient_definitions_nutrient_id_seq OWNED BY public.nutrient_definitions.nutrient_id;


--
-- Name: phase2_priority_foods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phase2_priority_foods (
    priority_rank integer NOT NULL,
    gap_bucket text NOT NULL,
    target_subtype text NOT NULL,
    food_label text NOT NULL,
    variant_label text NOT NULL,
    ciqual_code_hint text,
    food_slug_hint text,
    resolved_food_id uuid,
    resolution_method text,
    resolution_notes text,
    serving_g_provisional numeric(8,2) NOT NULL,
    source_strategy text NOT NULL,
    status text DEFAULT 'pending_research'::text NOT NULL,
    resolved_at timestamp with time zone,
    resolved_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT phase2_priority_foods_gap_bucket_check CHECK ((gap_bucket = ANY (ARRAY['fructan_dominant'::text, 'gos_dominant'::text, 'polyol_split_needed'::text]))),
    CONSTRAINT phase2_priority_foods_priority_rank_check CHECK ((priority_rank > 0)),
    CONSTRAINT phase2_priority_foods_resolution_method_check CHECK ((resolution_method = ANY (ARRAY['ciqual_code'::text, 'slug_match'::text, 'name_match'::text, 'manual'::text, 'new_food'::text]))),
    CONSTRAINT phase2_priority_foods_serving_g_provisional_check CHECK ((serving_g_provisional > (0)::numeric)),
    CONSTRAINT phase2_priority_foods_status_check CHECK ((status = ANY (ARRAY['pending_research'::text, 'resolved'::text, 'measured'::text, 'threshold_set'::text])))
);


--
-- Name: product_allergens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_allergens (
    product_id uuid NOT NULL,
    allergen_code text NOT NULL,
    presence_status text NOT NULL,
    source_id uuid NOT NULL,
    CONSTRAINT product_allergens_presence_status_check CHECK ((presence_status = ANY (ARRAY['contains'::text, 'may_contain'::text, 'unknown'::text])))
);


--
-- Name: product_food_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_food_links (
    product_id uuid NOT NULL,
    food_id uuid NOT NULL,
    link_method text NOT NULL,
    link_confidence numeric(4,3) NOT NULL,
    CONSTRAINT product_food_links_link_confidence_check CHECK (((link_confidence >= (0)::numeric) AND (link_confidence <= (1)::numeric))),
    CONSTRAINT product_food_links_link_method_check CHECK ((link_method = ANY (ARRAY['exact_name'::text, 'manual'::text, 'nlp'::text])))
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    product_id uuid DEFAULT gen_random_uuid() NOT NULL,
    gtin13 text,
    open_food_facts_code text,
    product_name_fr text NOT NULL,
    brand text,
    countries_tags text[] DEFAULT '{}'::text[] NOT NULL,
    ingredients_text_fr text,
    serving_size_text text,
    serving_quantity_g numeric(8,2),
    nutriscore_grade character(1),
    nova_group smallint,
    source_id uuid,
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT products_nova_group_check CHECK (((nova_group >= 1) AND (nova_group <= 4))),
    CONSTRAINT products_nutriscore_grade_check CHECK ((nutriscore_grade = ANY (ARRAY['a'::bpchar, 'b'::bpchar, 'c'::bpchar, 'd'::bpchar, 'e'::bpchar])))
);


--
-- Name: recipe_fodmap_assessments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipe_fodmap_assessments (
    recipe_fodmap_assessment_id bigint NOT NULL,
    recipe_id uuid NOT NULL,
    serving_g numeric(8,2) NOT NULL,
    overall_level public.fodmap_level NOT NULL,
    limiting_subtypes text[] DEFAULT '{}'::text[] NOT NULL,
    source_id uuid NOT NULL,
    notes text,
    computed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT recipe_fodmap_assessments_serving_g_check CHECK ((serving_g > (0)::numeric))
);


--
-- Name: recipe_fodmap_assessments_recipe_fodmap_assessment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recipe_fodmap_assessments_recipe_fodmap_assessment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recipe_fodmap_assessments_recipe_fodmap_assessment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recipe_fodmap_assessments_recipe_fodmap_assessment_id_seq OWNED BY public.recipe_fodmap_assessments.recipe_fodmap_assessment_id;


--
-- Name: recipe_ingredients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipe_ingredients (
    recipe_id uuid NOT NULL,
    line_no smallint NOT NULL,
    food_id uuid,
    ingredient_text_fr text NOT NULL,
    ingredient_text_en text,
    amount numeric(12,4),
    unit text,
    amount_g numeric(12,4),
    preparation_note text,
    is_optional boolean DEFAULT false NOT NULL
);


--
-- Name: recipe_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipe_steps (
    recipe_id uuid NOT NULL,
    step_no smallint NOT NULL,
    instruction_fr text NOT NULL,
    instruction_en text
);


--
-- Name: recipes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recipes (
    recipe_id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipe_slug text NOT NULL,
    title_fr text NOT NULL,
    title_en text,
    description_fr text,
    description_en text,
    servings numeric(5,2),
    prep_minutes integer,
    cook_minutes integer,
    difficulty text,
    locale_country character(2) DEFAULT 'FR'::bpchar NOT NULL,
    source_id uuid,
    source_recipe_ref text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT recipes_cook_minutes_check CHECK (((cook_minutes IS NULL) OR (cook_minutes >= 0))),
    CONSTRAINT recipes_difficulty_check CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text]))),
    CONSTRAINT recipes_prep_minutes_check CHECK (((prep_minutes IS NULL) OR (prep_minutes >= 0)))
);


--
-- Name: safe_harbor_cohorts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.safe_harbor_cohorts (
    cohort_code text NOT NULL,
    label_fr text NOT NULL,
    label_en text NOT NULL,
    rationale_fr text NOT NULL,
    rationale_en text NOT NULL,
    caveat_fr text NOT NULL,
    caveat_en text NOT NULL,
    sort_order smallint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT safe_harbor_cohorts_cohort_code_check CHECK ((cohort_code = ANY (ARRAY['cohort_oil_fat'::text, 'cohort_plain_protein'::text, 'cohort_egg'::text]))),
    CONSTRAINT safe_harbor_cohorts_sort_order_check CHECK ((sort_order >= 1))
);


--
-- Name: saved_meal_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_meal_items (
    saved_meal_item_id uuid DEFAULT gen_random_uuid() NOT NULL,
    saved_meal_id uuid NOT NULL,
    sort_order integer NOT NULL,
    item_kind text NOT NULL,
    food_id uuid,
    food_slug_snapshot text,
    custom_food_id uuid,
    free_text_label text,
    label_snapshot text NOT NULL,
    quantity_text text,
    note text,
    CONSTRAINT saved_meal_items_check CHECK ((((item_kind = 'canonical_food'::text) AND (food_id IS NOT NULL) AND (food_slug_snapshot IS NOT NULL) AND (custom_food_id IS NULL) AND (free_text_label IS NULL)) OR ((item_kind = 'custom_food'::text) AND (food_id IS NULL) AND (food_slug_snapshot IS NULL) AND (custom_food_id IS NOT NULL) AND (free_text_label IS NULL)) OR ((item_kind = 'free_text'::text) AND (food_id IS NULL) AND (food_slug_snapshot IS NULL) AND (custom_food_id IS NULL) AND (free_text_label IS NOT NULL)))),
    CONSTRAINT saved_meal_items_item_kind_check CHECK ((item_kind = ANY (ARRAY['canonical_food'::text, 'custom_food'::text, 'free_text'::text]))),
    CONSTRAINT saved_meal_items_sort_order_check CHECK ((sort_order >= 0))
);


--
-- Name: saved_meals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_meals (
    saved_meal_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    label text NOT NULL,
    note text,
    version bigint DEFAULT 1 NOT NULL,
    created_at_utc timestamp with time zone DEFAULT now() NOT NULL,
    updated_at_utc timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT saved_meals_version_check CHECK ((version >= 1))
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: source_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.source_files (
    source_file_id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_id uuid NOT NULL,
    file_name text NOT NULL,
    persistent_id text,
    file_format text,
    checksum_sha256 text,
    imported_at timestamp with time zone
);


--
-- Name: sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sources (
    source_id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_slug text NOT NULL,
    source_name text NOT NULL,
    source_kind text NOT NULL,
    organization text,
    country_code character(2),
    citation text,
    url text,
    dataset_version text,
    published_at date,
    accessed_at timestamp with time zone,
    trust_tier public.evidence_tier DEFAULT 'secondary_db'::public.evidence_tier NOT NULL,
    is_commercial boolean DEFAULT false NOT NULL,
    license_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sources_source_kind_check CHECK ((source_kind = ANY (ARRAY['official_database'::text, 'lab'::text, 'research_paper'::text, 'app_vendor'::text, 'community'::text, 'internal'::text])))
);


--
-- Name: swap_rule_contexts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.swap_rule_contexts (
    swap_rule_context_id bigint NOT NULL,
    swap_rule_id uuid NOT NULL,
    cooking_methods text[] DEFAULT '{}'::text[] NOT NULL,
    dish_roles text[] DEFAULT '{}'::text[] NOT NULL,
    cuisine_codes text[] DEFAULT '{}'::text[] NOT NULL,
    excluded_food_ids uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    locale_country character(2) DEFAULT 'FR'::bpchar NOT NULL,
    season_months smallint[] DEFAULT '{}'::smallint[] NOT NULL,
    notes text
);


--
-- Name: swap_rule_contexts_swap_rule_context_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.swap_rule_contexts_swap_rule_context_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: swap_rule_contexts_swap_rule_context_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.swap_rule_contexts_swap_rule_context_id_seq OWNED BY public.swap_rule_contexts.swap_rule_context_id;


--
-- Name: swap_rule_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.swap_rule_scores (
    swap_rule_id uuid NOT NULL,
    scoring_version text DEFAULT 'v1'::text NOT NULL,
    fodmap_safety_score numeric(4,3) NOT NULL,
    flavor_match_score numeric(4,3) NOT NULL,
    texture_match_score numeric(4,3) NOT NULL,
    method_match_score numeric(4,3) NOT NULL,
    availability_fr_score numeric(4,3) NOT NULL,
    cost_fr_score numeric(4,3) NOT NULL,
    overall_score numeric(4,3) GENERATED ALWAYS AS (round(((((((fodmap_safety_score * 0.50) + (flavor_match_score * 0.20)) + (texture_match_score * 0.10)) + (method_match_score * 0.10)) + (availability_fr_score * 0.07)) + (cost_fr_score * 0.03)), 3)) STORED,
    CONSTRAINT swap_rule_scores_availability_fr_score_check CHECK (((availability_fr_score >= (0)::numeric) AND (availability_fr_score <= (1)::numeric))),
    CONSTRAINT swap_rule_scores_cost_fr_score_check CHECK (((cost_fr_score >= (0)::numeric) AND (cost_fr_score <= (1)::numeric))),
    CONSTRAINT swap_rule_scores_flavor_match_score_check CHECK (((flavor_match_score >= (0)::numeric) AND (flavor_match_score <= (1)::numeric))),
    CONSTRAINT swap_rule_scores_fodmap_safety_score_check CHECK (((fodmap_safety_score >= (0)::numeric) AND (fodmap_safety_score <= (1)::numeric))),
    CONSTRAINT swap_rule_scores_method_match_score_check CHECK (((method_match_score >= (0)::numeric) AND (method_match_score <= (1)::numeric))),
    CONSTRAINT swap_rule_scores_texture_match_score_check CHECK (((texture_match_score >= (0)::numeric) AND (texture_match_score <= (1)::numeric)))
);


--
-- Name: swap_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.swap_rules (
    swap_rule_id uuid DEFAULT gen_random_uuid() NOT NULL,
    from_food_id uuid NOT NULL,
    to_food_id uuid NOT NULL,
    status public.swap_status DEFAULT 'draft'::public.swap_status NOT NULL,
    rule_kind text NOT NULL,
    instruction_fr text NOT NULL,
    instruction_en text,
    min_ratio numeric(8,3) DEFAULT 0.50 NOT NULL,
    max_ratio numeric(8,3) DEFAULT 1.50 NOT NULL,
    default_ratio numeric(8,3) DEFAULT 1.00 NOT NULL,
    source_id uuid,
    evidence_tier public.evidence_tier DEFAULT 'inferred'::public.evidence_tier NOT NULL,
    confidence_score numeric(4,3),
    valid_from date DEFAULT CURRENT_DATE NOT NULL,
    valid_to date,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_swap_distinct_foods CHECK ((from_food_id <> to_food_id)),
    CONSTRAINT chk_swap_ratios CHECK (((min_ratio <= default_ratio) AND (default_ratio <= max_ratio))),
    CONSTRAINT swap_rules_confidence_score_check CHECK (((confidence_score IS NULL) OR ((confidence_score >= (0)::numeric) AND (confidence_score <= (1)::numeric)))),
    CONSTRAINT swap_rules_default_ratio_check CHECK ((default_ratio > (0)::numeric)),
    CONSTRAINT swap_rules_max_ratio_check CHECK ((max_ratio > (0)::numeric)),
    CONSTRAINT swap_rules_min_ratio_check CHECK ((min_ratio > (0)::numeric)),
    CONSTRAINT swap_rules_rule_kind_check CHECK ((rule_kind = ANY (ARRAY['direct_swap'::text, 'technique_swap'::text, 'pairing_swap'::text, 'recipe_rewrite'::text])))
);


--
-- Name: symptom_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.symptom_logs (
    symptom_log_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    symptom_type text NOT NULL,
    severity smallint NOT NULL,
    noted_at_utc timestamp with time zone NOT NULL,
    note text,
    version bigint DEFAULT 1 NOT NULL,
    created_at_utc timestamp with time zone DEFAULT now() NOT NULL,
    updated_at_utc timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT symptom_logs_severity_check CHECK (((severity >= 0) AND (severity <= 10))),
    CONSTRAINT symptom_logs_symptom_type_check CHECK ((symptom_type = ANY (ARRAY['bloating'::text, 'pain'::text, 'gas'::text, 'diarrhea'::text, 'constipation'::text, 'nausea'::text, 'reflux'::text, 'other'::text]))),
    CONSTRAINT symptom_logs_version_check CHECK ((version >= 1))
);


--
-- Name: texture_traits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.texture_traits (
    texture_code text NOT NULL,
    label_fr text NOT NULL,
    label_en text NOT NULL
);


--
-- Name: user_consent_ledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_consent_ledger (
    consent_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    device_subject_id text,
    tenant_scope text DEFAULT 'fodmap_app'::text NOT NULL,
    policy_version text NOT NULL,
    legal_basis text NOT NULL,
    consent_scope jsonb NOT NULL,
    consent_method text NOT NULL,
    source text NOT NULL,
    source_ref text,
    granted_at_utc timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at_utc timestamp with time zone,
    expires_at_utc timestamp with time zone,
    policy_fingerprint text NOT NULL,
    scope_signature text NOT NULL,
    evidence_uri text,
    evidence_hash text,
    revocation_reason text,
    revocation_actor_id uuid,
    revocation_ip_cidr inet,
    status text NOT NULL,
    parent_consent_id uuid,
    replaced_by_consent_id uuid,
    created_at_utc timestamp with time zone DEFAULT now() NOT NULL,
    created_by_actor_id uuid,
    updated_at_utc timestamp with time zone DEFAULT now() NOT NULL,
    updated_by_actor_id uuid,
    CONSTRAINT user_consent_ledger_consent_method_check CHECK ((consent_method = ANY (ARRAY['explicit_checkbox'::text, 'oauth_consent'::text, 'in_app_sheet'::text, 'api_admin'::text, 'offline_cache_reconsent'::text]))),
    CONSTRAINT user_consent_ledger_legal_basis_check CHECK ((legal_basis = ANY (ARRAY['consent'::text, 'contract'::text, 'legal_obligation'::text, 'vital_interests'::text, 'public_interest'::text, 'legitimate_interests'::text]))),
    CONSTRAINT user_consent_ledger_source_check CHECK ((source = ANY (ARRAY['mobile_app'::text, 'web_fallback'::text, 'support'::text, 'api_internal'::text]))),
    CONSTRAINT user_consent_ledger_status_check CHECK ((status = ANY (ARRAY['active'::text, 'revoked'::text, 'expired'::text, 'superseded'::text, 'invalidated'::text])))
);


--
-- Name: user_consent_ledger_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_consent_ledger_events (
    event_id uuid DEFAULT gen_random_uuid() NOT NULL,
    consent_id uuid NOT NULL,
    event_type text NOT NULL,
    actor_type text,
    actor_id uuid,
    at_utc timestamp with time zone DEFAULT now() NOT NULL,
    reason text,
    metadata_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    event_hash text NOT NULL,
    prev_hash text
);


--
-- Name: user_fodmap_tolerances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_fodmap_tolerances (
    user_profile_id uuid NOT NULL,
    fodmap_subtype_id smallint NOT NULL,
    tolerance public.tolerance_level DEFAULT 'unknown'::public.tolerance_level NOT NULL,
    max_tolerated_g numeric(12,6),
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    user_profile_id uuid DEFAULT gen_random_uuid() NOT NULL,
    external_user_id text,
    locale_code text DEFAULT 'fr-FR'::text NOT NULL,
    country_code character(2) DEFAULT 'FR'::bpchar NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: v_food_excess_fructose_measurements; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_food_excess_fructose_measurements AS
 WITH fructose_candidates AS (
         SELECT fno.observation_id,
            fno.food_id,
            fno.source_id,
            fno.comparator,
            fno.amount_value,
            COALESCE(fno.observed_at, fno.effective_from) AS observed_on,
            row_number() OVER (PARTITION BY fno.food_id, fno.source_id ORDER BY COALESCE(fno.observed_at, fno.effective_from) DESC, fno.created_at DESC, fno.observation_id DESC) AS rn
           FROM (public.food_nutrient_observations fno
             JOIN public.nutrient_definitions nd ON ((nd.nutrient_id = fno.nutrient_id)))
          WHERE ((fno.basis = 'per_100g'::public.measurement_basis) AND ((nd.infoods_code = 'FRUS'::text) OR (nd.nutrient_code = 'CIQUAL_32210'::text)))
        ), glucose_candidates AS (
         SELECT fno.observation_id,
            fno.food_id,
            fno.source_id,
            fno.comparator,
            fno.amount_value,
            COALESCE(fno.observed_at, fno.effective_from) AS observed_on,
            row_number() OVER (PARTITION BY fno.food_id, fno.source_id ORDER BY COALESCE(fno.observed_at, fno.effective_from) DESC, fno.created_at DESC, fno.observation_id DESC) AS rn
           FROM (public.food_nutrient_observations fno
             JOIN public.nutrient_definitions nd ON ((nd.nutrient_id = fno.nutrient_id)))
          WHERE ((fno.basis = 'per_100g'::public.measurement_basis) AND ((nd.infoods_code = 'GLUS'::text) OR (nd.nutrient_code = 'CIQUAL_32250'::text)))
        ), fructose_latest AS (
         SELECT fructose_candidates.observation_id,
            fructose_candidates.food_id,
            fructose_candidates.source_id,
            fructose_candidates.comparator,
            fructose_candidates.amount_value,
            fructose_candidates.observed_on,
            fructose_candidates.rn
           FROM fructose_candidates
          WHERE (fructose_candidates.rn = 1)
        ), glucose_latest AS (
         SELECT glucose_candidates.observation_id,
            glucose_candidates.food_id,
            glucose_candidates.source_id,
            glucose_candidates.comparator,
            glucose_candidates.amount_value,
            glucose_candidates.observed_on,
            glucose_candidates.rn
           FROM glucose_candidates
          WHERE (glucose_candidates.rn = 1)
        )
 SELECT COALESCE(fl.food_id, gl.food_id) AS food_id,
    COALESCE(fl.source_id, gl.source_id) AS source_id,
    s.source_slug,
    fl.observation_id AS fructose_observation_id,
    gl.observation_id AS glucose_observation_id,
    fl.comparator AS fructose_comparator,
    gl.comparator AS glucose_comparator,
    fl.amount_value AS fructose_g_per_100g,
    gl.amount_value AS glucose_g_per_100g,
        CASE
            WHEN ((fl.observation_id IS NULL) OR (gl.observation_id IS NULL)) THEN NULL::numeric
            WHEN ((fl.comparator <> ALL (ARRAY['eq'::public.comparator_code, 'lt'::public.comparator_code, 'lte'::public.comparator_code])) OR (gl.comparator <> ALL (ARRAY['eq'::public.comparator_code, 'lt'::public.comparator_code, 'lte'::public.comparator_code]))) THEN NULL::numeric
            WHEN ((fl.amount_value IS NULL) OR (gl.amount_value IS NULL)) THEN NULL::numeric
            ELSE GREATEST((fl.amount_value - gl.amount_value), (0)::numeric)
        END AS excess_fructose_g_per_100g,
        CASE
            WHEN ((fl.observation_id IS NULL) OR (gl.observation_id IS NULL)) THEN 'missing_value'::text
            WHEN ((fl.comparator <> ALL (ARRAY['eq'::public.comparator_code, 'lt'::public.comparator_code, 'lte'::public.comparator_code])) OR (gl.comparator <> ALL (ARRAY['eq'::public.comparator_code, 'lt'::public.comparator_code, 'lte'::public.comparator_code]))) THEN 'non_comparable_comparator'::text
            WHEN ((fl.amount_value IS NULL) OR (gl.amount_value IS NULL)) THEN 'missing_value'::text
            ELSE 'computed'::text
        END AS derivation_status,
    GREATEST(COALESCE(fl.observed_on, '1900-01-01'::date), COALESCE(gl.observed_on, '1900-01-01'::date)) AS observed_on
   FROM ((fructose_latest fl
     FULL JOIN glucose_latest gl ON (((fl.food_id = gl.food_id) AND (fl.source_id = gl.source_id))))
     JOIN public.sources s ON ((s.source_id = COALESCE(fl.source_id, gl.source_id))));


--
-- Name: VIEW v_food_excess_fructose_measurements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_food_excess_fructose_measurements IS 'Computes excess fructose as GREATEST(fructose - glucose, 0) when both inputs are numeric-comparable (eq/lt/lte). Otherwise excess is NULL with derivation_status.';


--
-- Name: v_food_excess_fructose_latest; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_food_excess_fructose_latest AS
 SELECT DISTINCT ON (food_id) food_id,
    source_id,
    source_slug,
    fructose_observation_id,
    glucose_observation_id,
    fructose_comparator,
    glucose_comparator,
    fructose_g_per_100g,
    glucose_g_per_100g,
    excess_fructose_g_per_100g,
    derivation_status,
    observed_on
   FROM public.v_food_excess_fructose_measurements
  ORDER BY food_id, (derivation_status = 'computed'::text) DESC, observed_on DESC NULLS LAST, source_slug;


--
-- Name: VIEW v_food_excess_fructose_latest; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_food_excess_fructose_latest IS 'Best current excess-fructose estimate per food; prefers computable rows, then most recent observation.';


--
-- Name: v_phase3_rollup_subtype_levels_latest; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_phase3_rollup_subtype_levels_latest AS
 SELECT NULL::integer AS priority_rank,
    NULL::uuid AS food_id,
    NULL::numeric(8,2) AS rollup_serving_g,
    NULL::text AS subtype_code,
    NULL::smallint AS fodmap_subtype_id,
    NULL::numeric(12,6) AS amount_g_per_serving,
    NULL::public.comparator_code AS comparator,
    NULL::numeric(12,6) AS low_max_g,
    NULL::numeric(12,6) AS moderate_max_g,
    NULL::public.fodmap_level AS subtype_level,
    NULL::text AS signal_source_kind,
    NULL::text AS signal_source_slug,
    NULL::text AS threshold_source,
    NULL::text AS threshold_source_slug,
    NULL::boolean AS is_default_threshold,
    NULL::boolean AS is_polyol_proxy,
    NULL::text AS default_threshold_citation_ref,
    NULL::text AS default_threshold_derivation_method,
    NULL::integer AS severity_rank,
    NULL::numeric(12,6) AS burden_ratio,
    NULL::timestamp with time zone AS computed_at
  WHERE false;


--
-- Name: v_phase3_rollups_latest_full; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_phase3_rollups_latest_full AS
 SELECT NULL::integer AS priority_rank,
    NULL::uuid AS food_id,
    NULL::numeric(8,2) AS rollup_serving_g,
    NULL::public.fodmap_level AS overall_level,
    NULL::text AS driver_subtype_code,
    NULL::integer AS known_subtypes_count,
    NULL::numeric(6,4) AS coverage_ratio,
    NULL::timestamp with time zone AS computed_at,
    NULL::text AS source_slug
  WHERE false;


--
-- Name: fodmap_subtypes fodmap_subtype_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fodmap_subtypes ALTER COLUMN fodmap_subtype_id SET DEFAULT nextval('public.fodmap_subtypes_fodmap_subtype_id_seq'::regclass);


--
-- Name: food_categories category_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_categories ALTER COLUMN category_id SET DEFAULT nextval('public.food_categories_category_id_seq'::regclass);


--
-- Name: food_fodmap_measurements measurement_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_fodmap_measurements ALTER COLUMN measurement_id SET DEFAULT nextval('public.food_fodmap_measurements_measurement_id_seq'::regclass);


--
-- Name: food_fodmap_thresholds threshold_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_fodmap_thresholds ALTER COLUMN threshold_id SET DEFAULT nextval('public.food_fodmap_thresholds_threshold_id_seq'::regclass);


--
-- Name: food_names food_name_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_names ALTER COLUMN food_name_id SET DEFAULT nextval('public.food_names_food_name_id_seq'::regclass);


--
-- Name: food_nutrient_observations observation_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_nutrient_observations ALTER COLUMN observation_id SET DEFAULT nextval('public.food_nutrient_observations_observation_id_seq'::regclass);


--
-- Name: nutrient_definitions nutrient_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nutrient_definitions ALTER COLUMN nutrient_id SET DEFAULT nextval('public.nutrient_definitions_nutrient_id_seq'::regclass);


--
-- Name: recipe_fodmap_assessments recipe_fodmap_assessment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_fodmap_assessments ALTER COLUMN recipe_fodmap_assessment_id SET DEFAULT nextval('public.recipe_fodmap_assessments_recipe_fodmap_assessment_id_seq'::regclass);


--
-- Name: swap_rule_contexts swap_rule_context_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swap_rule_contexts ALTER COLUMN swap_rule_context_id SET DEFAULT nextval('public.swap_rule_contexts_swap_rule_context_id_seq'::regclass);


--
-- Name: cooking_behaviors cooking_behaviors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cooking_behaviors
    ADD CONSTRAINT cooking_behaviors_pkey PRIMARY KEY (behavior_code);


--
-- Name: cuisine_tags cuisine_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuisine_tags
    ADD CONSTRAINT cuisine_tags_pkey PRIMARY KEY (cuisine_code);


--
-- Name: culinary_roles culinary_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.culinary_roles
    ADD CONSTRAINT culinary_roles_pkey PRIMARY KEY (role_code);


--
-- Name: custom_foods custom_foods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.custom_foods
    ADD CONSTRAINT custom_foods_pkey PRIMARY KEY (custom_food_id);


--
-- Name: data_licenses data_licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_licenses
    ADD CONSTRAINT data_licenses_pkey PRIMARY KEY (license_id);


--
-- Name: data_licenses data_licenses_spdx_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_licenses
    ADD CONSTRAINT data_licenses_spdx_id_key UNIQUE (spdx_id);


--
-- Name: eu_allergens eu_allergens_annex_ii_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eu_allergens
    ADD CONSTRAINT eu_allergens_annex_ii_order_key UNIQUE (annex_ii_order);


--
-- Name: eu_allergens eu_allergens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eu_allergens
    ADD CONSTRAINT eu_allergens_pkey PRIMARY KEY (allergen_code);


--
-- Name: flavor_notes flavor_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flavor_notes
    ADD CONSTRAINT flavor_notes_pkey PRIMARY KEY (flavor_code);


--
-- Name: fodmap_subtypes fodmap_subtypes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fodmap_subtypes
    ADD CONSTRAINT fodmap_subtypes_code_key UNIQUE (code);


--
-- Name: fodmap_subtypes fodmap_subtypes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fodmap_subtypes
    ADD CONSTRAINT fodmap_subtypes_pkey PRIMARY KEY (fodmap_subtype_id);


--
-- Name: food_allergens food_allergens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_allergens
    ADD CONSTRAINT food_allergens_pkey PRIMARY KEY (food_id, allergen_code, source_id);


--
-- Name: food_categories food_categories_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_categories
    ADD CONSTRAINT food_categories_code_key UNIQUE (code);


--
-- Name: food_categories food_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_categories
    ADD CONSTRAINT food_categories_pkey PRIMARY KEY (category_id);


--
-- Name: food_category_memberships food_category_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_category_memberships
    ADD CONSTRAINT food_category_memberships_pkey PRIMARY KEY (food_id, category_id, source_id);


--
-- Name: food_cooking_behaviors food_cooking_behaviors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_cooking_behaviors
    ADD CONSTRAINT food_cooking_behaviors_pkey PRIMARY KEY (food_id, behavior_code);


--
-- Name: food_cuisine_affinities food_cuisine_affinities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_cuisine_affinities
    ADD CONSTRAINT food_cuisine_affinities_pkey PRIMARY KEY (food_id, cuisine_code);


--
-- Name: food_culinary_roles food_culinary_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_culinary_roles
    ADD CONSTRAINT food_culinary_roles_pkey PRIMARY KEY (food_id, role_code);


--
-- Name: food_external_refs food_external_refs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_external_refs
    ADD CONSTRAINT food_external_refs_pkey PRIMARY KEY (food_id, ref_system, ref_value);


--
-- Name: food_flavor_profiles food_flavor_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_flavor_profiles
    ADD CONSTRAINT food_flavor_profiles_pkey PRIMARY KEY (food_id, flavor_code);


--
-- Name: food_fodmap_measurements food_fodmap_measurements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_fodmap_measurements
    ADD CONSTRAINT food_fodmap_measurements_pkey PRIMARY KEY (measurement_id);


--
-- Name: food_fodmap_rollups food_fodmap_rollups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_fodmap_rollups
    ADD CONSTRAINT food_fodmap_rollups_pkey PRIMARY KEY (food_id, serving_g, source_id, computed_at);


--
-- Name: food_fodmap_thresholds food_fodmap_thresholds_food_id_fodmap_subtype_id_source_id__key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_fodmap_thresholds
    ADD CONSTRAINT food_fodmap_thresholds_food_id_fodmap_subtype_id_source_id__key UNIQUE (food_id, fodmap_subtype_id, source_id, serving_g, valid_from);


--
-- Name: food_fodmap_thresholds food_fodmap_thresholds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_fodmap_thresholds
    ADD CONSTRAINT food_fodmap_thresholds_pkey PRIMARY KEY (threshold_id);


--
-- Name: food_fr_contexts food_fr_contexts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_fr_contexts
    ADD CONSTRAINT food_fr_contexts_pkey PRIMARY KEY (food_id);


--
-- Name: food_names food_names_food_id_locale_code_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_names
    ADD CONSTRAINT food_names_food_id_locale_code_name_key UNIQUE (food_id, locale_code, name);


--
-- Name: food_names food_names_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_names
    ADD CONSTRAINT food_names_pkey PRIMARY KEY (food_name_id);


--
-- Name: food_nutrient_observations food_nutrient_observations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_nutrient_observations
    ADD CONSTRAINT food_nutrient_observations_pkey PRIMARY KEY (observation_id);


--
-- Name: food_safe_harbor_assignments food_safe_harbor_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_safe_harbor_assignments
    ADD CONSTRAINT food_safe_harbor_assignments_pkey PRIMARY KEY (food_id);


--
-- Name: food_texture_profiles food_texture_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_texture_profiles
    ADD CONSTRAINT food_texture_profiles_pkey PRIMARY KEY (food_id, texture_code);


--
-- Name: foods foods_canonical_name_fr_preparation_state_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.foods
    ADD CONSTRAINT foods_canonical_name_fr_preparation_state_key UNIQUE (canonical_name_fr, preparation_state);


--
-- Name: foods foods_food_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.foods
    ADD CONSTRAINT foods_food_slug_key UNIQUE (food_slug);


--
-- Name: foods foods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.foods
    ADD CONSTRAINT foods_pkey PRIMARY KEY (food_id);


--
-- Name: ingestion_runs ingestion_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingestion_runs
    ADD CONSTRAINT ingestion_runs_pkey PRIMARY KEY (ingestion_run_id);


--
-- Name: me_auth_identities me_auth_identities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.me_auth_identities
    ADD CONSTRAINT me_auth_identities_pkey PRIMARY KEY (user_id);


--
-- Name: me_delete_jobs me_delete_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.me_delete_jobs
    ADD CONSTRAINT me_delete_jobs_pkey PRIMARY KEY (delete_request_id);


--
-- Name: me_device_signing_keys me_device_signing_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.me_device_signing_keys
    ADD CONSTRAINT me_device_signing_keys_pkey PRIMARY KEY (device_id, key_id);


--
-- Name: me_entity_versions me_entity_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.me_entity_versions
    ADD CONSTRAINT me_entity_versions_pkey PRIMARY KEY (user_id, entity_type, entity_id);


--
-- Name: me_export_jobs me_export_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.me_export_jobs
    ADD CONSTRAINT me_export_jobs_pkey PRIMARY KEY (export_id);


--
-- Name: me_mutation_queue me_mutation_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.me_mutation_queue
    ADD CONSTRAINT me_mutation_queue_pkey PRIMARY KEY (mutation_id);


--
-- Name: meal_log_items meal_log_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meal_log_items
    ADD CONSTRAINT meal_log_items_pkey PRIMARY KEY (meal_log_item_id);


--
-- Name: meal_logs meal_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meal_logs
    ADD CONSTRAINT meal_logs_pkey PRIMARY KEY (meal_log_id);


--
-- Name: nutrient_definitions nutrient_definitions_nutrient_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nutrient_definitions
    ADD CONSTRAINT nutrient_definitions_nutrient_code_key UNIQUE (nutrient_code);


--
-- Name: nutrient_definitions nutrient_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nutrient_definitions
    ADD CONSTRAINT nutrient_definitions_pkey PRIMARY KEY (nutrient_id);


--
-- Name: phase2_priority_foods phase2_priority_foods_food_label_variant_label_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phase2_priority_foods
    ADD CONSTRAINT phase2_priority_foods_food_label_variant_label_key UNIQUE (food_label, variant_label);


--
-- Name: phase2_priority_foods phase2_priority_foods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phase2_priority_foods
    ADD CONSTRAINT phase2_priority_foods_pkey PRIMARY KEY (priority_rank);


--
-- Name: product_allergens product_allergens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_allergens
    ADD CONSTRAINT product_allergens_pkey PRIMARY KEY (product_id, allergen_code, source_id);


--
-- Name: product_food_links product_food_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_food_links
    ADD CONSTRAINT product_food_links_pkey PRIMARY KEY (product_id, food_id);


--
-- Name: products products_gtin13_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_gtin13_key UNIQUE (gtin13);


--
-- Name: products products_open_food_facts_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_open_food_facts_code_key UNIQUE (open_food_facts_code);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);


--
-- Name: publish_release_current publish_release_current_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publish_release_current
    ADD CONSTRAINT publish_release_current_pkey PRIMARY KEY (release_kind);


--
-- Name: publish_releases publish_releases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publish_releases
    ADD CONSTRAINT publish_releases_pkey PRIMARY KEY (publish_id);


--
-- Name: published_food_rollups published_food_rollups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_food_rollups
    ADD CONSTRAINT published_food_rollups_pkey PRIMARY KEY (publish_id, food_id);


--
-- Name: published_food_rollups published_food_rollups_publish_id_priority_rank_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_food_rollups
    ADD CONSTRAINT published_food_rollups_publish_id_priority_rank_key UNIQUE (publish_id, priority_rank);


--
-- Name: published_food_subtype_levels published_food_subtype_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_food_subtype_levels
    ADD CONSTRAINT published_food_subtype_levels_pkey PRIMARY KEY (publish_id, food_id, subtype_code);


--
-- Name: published_swaps published_swaps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_swaps
    ADD CONSTRAINT published_swaps_pkey PRIMARY KEY (publish_id, swap_rule_id);


--
-- Name: recipe_fodmap_assessments recipe_fodmap_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_fodmap_assessments
    ADD CONSTRAINT recipe_fodmap_assessments_pkey PRIMARY KEY (recipe_fodmap_assessment_id);


--
-- Name: recipe_ingredients recipe_ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_pkey PRIMARY KEY (recipe_id, line_no);


--
-- Name: recipe_steps recipe_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_steps
    ADD CONSTRAINT recipe_steps_pkey PRIMARY KEY (recipe_id, step_no);


--
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY (recipe_id);


--
-- Name: recipes recipes_recipe_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_recipe_slug_key UNIQUE (recipe_slug);


--
-- Name: safe_harbor_cohorts safe_harbor_cohorts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safe_harbor_cohorts
    ADD CONSTRAINT safe_harbor_cohorts_pkey PRIMARY KEY (cohort_code);


--
-- Name: saved_meal_items saved_meal_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_meal_items
    ADD CONSTRAINT saved_meal_items_pkey PRIMARY KEY (saved_meal_item_id);


--
-- Name: saved_meals saved_meals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_meals
    ADD CONSTRAINT saved_meals_pkey PRIMARY KEY (saved_meal_id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: source_files source_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.source_files
    ADD CONSTRAINT source_files_pkey PRIMARY KEY (source_file_id);


--
-- Name: source_files source_files_source_id_persistent_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.source_files
    ADD CONSTRAINT source_files_source_id_persistent_id_key UNIQUE (source_id, persistent_id);


--
-- Name: sources sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sources
    ADD CONSTRAINT sources_pkey PRIMARY KEY (source_id);


--
-- Name: sources sources_source_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sources
    ADD CONSTRAINT sources_source_slug_key UNIQUE (source_slug);


--
-- Name: swap_rule_contexts swap_rule_contexts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swap_rule_contexts
    ADD CONSTRAINT swap_rule_contexts_pkey PRIMARY KEY (swap_rule_context_id);


--
-- Name: swap_rule_scores swap_rule_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swap_rule_scores
    ADD CONSTRAINT swap_rule_scores_pkey PRIMARY KEY (swap_rule_id);


--
-- Name: swap_rules swap_rules_from_food_id_to_food_id_rule_kind_valid_from_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swap_rules
    ADD CONSTRAINT swap_rules_from_food_id_to_food_id_rule_kind_valid_from_key UNIQUE (from_food_id, to_food_id, rule_kind, valid_from);


--
-- Name: swap_rules swap_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swap_rules
    ADD CONSTRAINT swap_rules_pkey PRIMARY KEY (swap_rule_id);


--
-- Name: symptom_logs symptom_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.symptom_logs
    ADD CONSTRAINT symptom_logs_pkey PRIMARY KEY (symptom_log_id);


--
-- Name: texture_traits texture_traits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.texture_traits
    ADD CONSTRAINT texture_traits_pkey PRIMARY KEY (texture_code);


--
-- Name: me_auth_identities uq_me_auth_identities_provider_subject; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.me_auth_identities
    ADD CONSTRAINT uq_me_auth_identities_provider_subject UNIQUE (auth_provider, auth_subject);


--
-- Name: user_consent_ledger_events user_consent_ledger_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consent_ledger_events
    ADD CONSTRAINT user_consent_ledger_events_pkey PRIMARY KEY (event_id);


--
-- Name: user_consent_ledger user_consent_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consent_ledger
    ADD CONSTRAINT user_consent_ledger_pkey PRIMARY KEY (consent_id);


--
-- Name: user_fodmap_tolerances user_fodmap_tolerances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_fodmap_tolerances
    ADD CONSTRAINT user_fodmap_tolerances_pkey PRIMARY KEY (user_profile_id, fodmap_subtype_id);


--
-- Name: user_profiles user_profiles_external_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_external_user_id_key UNIQUE (external_user_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (user_profile_id);


--
-- Name: idx_fodmap_measurements_food_subtype; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fodmap_measurements_food_subtype ON public.food_fodmap_measurements USING btree (food_id, fodmap_subtype_id);


--
-- Name: idx_food_external_refs_system_value; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_food_external_refs_system_value ON public.food_external_refs USING btree (ref_system, ref_value);


--
-- Name: idx_food_fr_contexts_availability; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_food_fr_contexts_availability ON public.food_fr_contexts USING btree (availability);


--
-- Name: idx_food_names_locale_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_food_names_locale_name ON public.food_names USING btree (locale_code, name);


--
-- Name: idx_food_safe_harbor_assignments_cohort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_food_safe_harbor_assignments_cohort ON public.food_safe_harbor_assignments USING btree (cohort_code, updated_at DESC, food_id);


--
-- Name: idx_food_safe_harbor_assignments_data_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_food_safe_harbor_assignments_data_source ON public.food_safe_harbor_assignments USING btree (data_source_id, rule_source_id);


--
-- Name: idx_nutrient_observations_food_nutrient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nutrient_observations_food_nutrient ON public.food_nutrient_observations USING btree (food_id, nutrient_id);


--
-- Name: idx_products_off_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_off_code ON public.products USING btree (open_food_facts_code);


--
-- Name: idx_publish_releases_kind_published_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_publish_releases_kind_published_at ON public.publish_releases USING btree (release_kind, published_at DESC);


--
-- Name: idx_published_food_rollups_publish_food; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_published_food_rollups_publish_food ON public.published_food_rollups USING btree (publish_id, food_id);


--
-- Name: idx_published_food_rollups_publish_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_published_food_rollups_publish_priority ON public.published_food_rollups USING btree (publish_id, priority_rank);


--
-- Name: idx_published_food_subtypes_publish_food; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_published_food_subtypes_publish_food ON public.published_food_subtype_levels USING btree (publish_id, food_id);


--
-- Name: idx_published_swaps_publish_from_food; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_published_swaps_publish_from_food ON public.published_swaps USING btree (publish_id, from_food_slug);


--
-- Name: idx_published_swaps_publish_rule_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_published_swaps_publish_rule_status ON public.published_swaps USING btree (publish_id, rule_status, from_food_slug);


--
-- Name: idx_recipe_ingredients_food_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recipe_ingredients_food_id ON public.recipe_ingredients USING btree (food_id);


--
-- Name: idx_swap_rules_from_food; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_swap_rules_from_food ON public.swap_rules USING btree (from_food_id);


--
-- Name: idx_swap_rules_to_food; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_swap_rules_to_food ON public.swap_rules USING btree (to_food_id);


--
-- Name: ix_consent_events_consent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_consent_events_consent ON public.user_consent_ledger_events USING btree (consent_id, at_utc DESC);


--
-- Name: ix_custom_foods_user_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_custom_foods_user_updated ON public.custom_foods USING btree (user_id, deleted_at, updated_at_utc DESC);


--
-- Name: ix_delete_jobs_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_delete_jobs_user_status ON public.me_delete_jobs USING btree (user_id, status, requested_at DESC);


--
-- Name: ix_export_jobs_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_export_jobs_user_status ON public.me_export_jobs USING btree (user_id, status, requested_at DESC);


--
-- Name: ix_meal_logs_user_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_meal_logs_user_time ON public.meal_logs USING btree (user_id, deleted_at, occurred_at_utc DESC);


--
-- Name: ix_mutation_device_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mutation_device_status ON public.me_mutation_queue USING btree (device_id, status, received_at DESC);


--
-- Name: ix_mutation_queue_chain; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mutation_queue_chain ON public.me_mutation_queue USING btree (user_id, device_id, chain_item_hash);


--
-- Name: ix_saved_meals_user_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_saved_meals_user_updated ON public.saved_meals USING btree (user_id, deleted_at, updated_at_utc DESC);


--
-- Name: ix_symptom_logs_user_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_symptom_logs_user_time ON public.symptom_logs USING btree (user_id, deleted_at, noted_at_utc DESC);


--
-- Name: ix_user_consent_device_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_user_consent_device_subject ON public.user_consent_ledger USING btree (device_subject_id, status);


--
-- Name: ix_user_consent_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_user_consent_user_status ON public.user_consent_ledger USING btree (user_id, status, granted_at_utc DESC);


--
-- Name: uq_delete_idempotent; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_delete_idempotent ON public.me_delete_jobs USING btree (user_id, idempotency_key) WHERE (idempotency_key IS NOT NULL);


--
-- Name: uq_export_idempotent; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_export_idempotent ON public.me_export_jobs USING btree (user_id, idempotency_key) WHERE (idempotency_key IS NOT NULL);


--
-- Name: uq_meal_log_items_parent_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_meal_log_items_parent_sort ON public.meal_log_items USING btree (meal_log_id, sort_order);


--
-- Name: uq_mutation_idempotency_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_mutation_idempotency_user ON public.me_mutation_queue USING btree (user_id, idempotency_key);


--
-- Name: uq_saved_meal_items_parent_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_saved_meal_items_parent_sort ON public.saved_meal_items USING btree (saved_meal_id, sort_order);


--
-- Name: uq_user_consent_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_user_consent_active ON public.user_consent_ledger USING btree (user_id) WHERE (status = 'active'::text);


--
-- Name: food_allergens food_allergens_allergen_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_allergens
    ADD CONSTRAINT food_allergens_allergen_code_fkey FOREIGN KEY (allergen_code) REFERENCES public.eu_allergens(allergen_code);


--
-- Name: food_allergens food_allergens_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_allergens
    ADD CONSTRAINT food_allergens_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: food_allergens food_allergens_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_allergens
    ADD CONSTRAINT food_allergens_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: food_categories food_categories_parent_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_categories
    ADD CONSTRAINT food_categories_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES public.food_categories(category_id);


--
-- Name: food_category_memberships food_category_memberships_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_category_memberships
    ADD CONSTRAINT food_category_memberships_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.food_categories(category_id);


--
-- Name: food_category_memberships food_category_memberships_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_category_memberships
    ADD CONSTRAINT food_category_memberships_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: food_category_memberships food_category_memberships_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_category_memberships
    ADD CONSTRAINT food_category_memberships_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: food_cooking_behaviors food_cooking_behaviors_behavior_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_cooking_behaviors
    ADD CONSTRAINT food_cooking_behaviors_behavior_code_fkey FOREIGN KEY (behavior_code) REFERENCES public.cooking_behaviors(behavior_code);


--
-- Name: food_cooking_behaviors food_cooking_behaviors_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_cooking_behaviors
    ADD CONSTRAINT food_cooking_behaviors_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: food_cooking_behaviors food_cooking_behaviors_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_cooking_behaviors
    ADD CONSTRAINT food_cooking_behaviors_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: food_cuisine_affinities food_cuisine_affinities_cuisine_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_cuisine_affinities
    ADD CONSTRAINT food_cuisine_affinities_cuisine_code_fkey FOREIGN KEY (cuisine_code) REFERENCES public.cuisine_tags(cuisine_code);


--
-- Name: food_cuisine_affinities food_cuisine_affinities_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_cuisine_affinities
    ADD CONSTRAINT food_cuisine_affinities_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: food_cuisine_affinities food_cuisine_affinities_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_cuisine_affinities
    ADD CONSTRAINT food_cuisine_affinities_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: food_culinary_roles food_culinary_roles_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_culinary_roles
    ADD CONSTRAINT food_culinary_roles_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: food_culinary_roles food_culinary_roles_role_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_culinary_roles
    ADD CONSTRAINT food_culinary_roles_role_code_fkey FOREIGN KEY (role_code) REFERENCES public.culinary_roles(role_code);


--
-- Name: food_culinary_roles food_culinary_roles_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_culinary_roles
    ADD CONSTRAINT food_culinary_roles_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: food_external_refs food_external_refs_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_external_refs
    ADD CONSTRAINT food_external_refs_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: food_external_refs food_external_refs_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_external_refs
    ADD CONSTRAINT food_external_refs_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: food_flavor_profiles food_flavor_profiles_flavor_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_flavor_profiles
    ADD CONSTRAINT food_flavor_profiles_flavor_code_fkey FOREIGN KEY (flavor_code) REFERENCES public.flavor_notes(flavor_code);


--
-- Name: food_flavor_profiles food_flavor_profiles_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_flavor_profiles
    ADD CONSTRAINT food_flavor_profiles_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: food_flavor_profiles food_flavor_profiles_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_flavor_profiles
    ADD CONSTRAINT food_flavor_profiles_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: food_fodmap_measurements food_fodmap_measurements_fodmap_subtype_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_fodmap_measurements
    ADD CONSTRAINT food_fodmap_measurements_fodmap_subtype_id_fkey FOREIGN KEY (fodmap_subtype_id) REFERENCES public.fodmap_subtypes(fodmap_subtype_id);


--
-- Name: food_fodmap_measurements food_fodmap_measurements_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_fodmap_measurements
    ADD CONSTRAINT food_fodmap_measurements_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: food_fodmap_measurements food_fodmap_measurements_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_fodmap_measurements
    ADD CONSTRAINT food_fodmap_measurements_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: food_fodmap_rollups food_fodmap_rollups_driver_fodmap_subtype_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_fodmap_rollups
    ADD CONSTRAINT food_fodmap_rollups_driver_fodmap_subtype_id_fkey FOREIGN KEY (driver_fodmap_subtype_id) REFERENCES public.fodmap_subtypes(fodmap_subtype_id);


--
-- Name: food_fodmap_rollups food_fodmap_rollups_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_fodmap_rollups
    ADD CONSTRAINT food_fodmap_rollups_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: food_fodmap_rollups food_fodmap_rollups_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_fodmap_rollups
    ADD CONSTRAINT food_fodmap_rollups_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: food_fodmap_thresholds food_fodmap_thresholds_fodmap_subtype_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_fodmap_thresholds
    ADD CONSTRAINT food_fodmap_thresholds_fodmap_subtype_id_fkey FOREIGN KEY (fodmap_subtype_id) REFERENCES public.fodmap_subtypes(fodmap_subtype_id);


--
-- Name: food_fodmap_thresholds food_fodmap_thresholds_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_fodmap_thresholds
    ADD CONSTRAINT food_fodmap_thresholds_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: food_fodmap_thresholds food_fodmap_thresholds_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_fodmap_thresholds
    ADD CONSTRAINT food_fodmap_thresholds_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: food_fr_contexts food_fr_contexts_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_fr_contexts
    ADD CONSTRAINT food_fr_contexts_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: food_fr_contexts food_fr_contexts_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_fr_contexts
    ADD CONSTRAINT food_fr_contexts_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: food_names food_names_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_names
    ADD CONSTRAINT food_names_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: food_names food_names_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_names
    ADD CONSTRAINT food_names_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: food_nutrient_observations food_nutrient_observations_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_nutrient_observations
    ADD CONSTRAINT food_nutrient_observations_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: food_nutrient_observations food_nutrient_observations_nutrient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_nutrient_observations
    ADD CONSTRAINT food_nutrient_observations_nutrient_id_fkey FOREIGN KEY (nutrient_id) REFERENCES public.nutrient_definitions(nutrient_id);


--
-- Name: food_nutrient_observations food_nutrient_observations_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_nutrient_observations
    ADD CONSTRAINT food_nutrient_observations_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: food_safe_harbor_assignments food_safe_harbor_assignments_cohort_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_safe_harbor_assignments
    ADD CONSTRAINT food_safe_harbor_assignments_cohort_code_fkey FOREIGN KEY (cohort_code) REFERENCES public.safe_harbor_cohorts(cohort_code);


--
-- Name: food_safe_harbor_assignments food_safe_harbor_assignments_data_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_safe_harbor_assignments
    ADD CONSTRAINT food_safe_harbor_assignments_data_source_id_fkey FOREIGN KEY (data_source_id) REFERENCES public.sources(source_id);


--
-- Name: food_safe_harbor_assignments food_safe_harbor_assignments_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_safe_harbor_assignments
    ADD CONSTRAINT food_safe_harbor_assignments_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: food_safe_harbor_assignments food_safe_harbor_assignments_rule_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_safe_harbor_assignments
    ADD CONSTRAINT food_safe_harbor_assignments_rule_source_id_fkey FOREIGN KEY (rule_source_id) REFERENCES public.sources(source_id);


--
-- Name: food_texture_profiles food_texture_profiles_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_texture_profiles
    ADD CONSTRAINT food_texture_profiles_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: food_texture_profiles food_texture_profiles_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_texture_profiles
    ADD CONSTRAINT food_texture_profiles_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: food_texture_profiles food_texture_profiles_texture_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.food_texture_profiles
    ADD CONSTRAINT food_texture_profiles_texture_code_fkey FOREIGN KEY (texture_code) REFERENCES public.texture_traits(texture_code);


--
-- Name: ingestion_runs ingestion_runs_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingestion_runs
    ADD CONSTRAINT ingestion_runs_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: meal_log_items meal_log_items_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meal_log_items
    ADD CONSTRAINT meal_log_items_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id);


--
-- Name: meal_log_items meal_log_items_meal_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meal_log_items
    ADD CONSTRAINT meal_log_items_meal_log_id_fkey FOREIGN KEY (meal_log_id) REFERENCES public.meal_logs(meal_log_id) ON DELETE CASCADE;


--
-- Name: phase2_priority_foods phase2_priority_foods_resolved_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phase2_priority_foods
    ADD CONSTRAINT phase2_priority_foods_resolved_food_id_fkey FOREIGN KEY (resolved_food_id) REFERENCES public.foods(food_id);


--
-- Name: phase2_priority_foods phase2_priority_foods_target_subtype_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phase2_priority_foods
    ADD CONSTRAINT phase2_priority_foods_target_subtype_fkey FOREIGN KEY (target_subtype) REFERENCES public.fodmap_subtypes(code);


--
-- Name: product_allergens product_allergens_allergen_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_allergens
    ADD CONSTRAINT product_allergens_allergen_code_fkey FOREIGN KEY (allergen_code) REFERENCES public.eu_allergens(allergen_code);


--
-- Name: product_allergens product_allergens_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_allergens
    ADD CONSTRAINT product_allergens_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;


--
-- Name: product_allergens product_allergens_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_allergens
    ADD CONSTRAINT product_allergens_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: product_food_links product_food_links_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_food_links
    ADD CONSTRAINT product_food_links_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: product_food_links product_food_links_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_food_links
    ADD CONSTRAINT product_food_links_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;


--
-- Name: products products_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: publish_release_current publish_release_current_publish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publish_release_current
    ADD CONSTRAINT publish_release_current_publish_id_fkey FOREIGN KEY (publish_id) REFERENCES public.publish_releases(publish_id) ON DELETE CASCADE;


--
-- Name: published_food_rollups published_food_rollups_driver_subtype_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_food_rollups
    ADD CONSTRAINT published_food_rollups_driver_subtype_code_fkey FOREIGN KEY (driver_subtype_code) REFERENCES public.fodmap_subtypes(code);


--
-- Name: published_food_rollups published_food_rollups_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_food_rollups
    ADD CONSTRAINT published_food_rollups_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: published_food_rollups published_food_rollups_publish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_food_rollups
    ADD CONSTRAINT published_food_rollups_publish_id_fkey FOREIGN KEY (publish_id) REFERENCES public.publish_releases(publish_id) ON DELETE CASCADE;


--
-- Name: published_food_subtype_levels published_food_subtype_levels_fodmap_subtype_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_food_subtype_levels
    ADD CONSTRAINT published_food_subtype_levels_fodmap_subtype_id_fkey FOREIGN KEY (fodmap_subtype_id) REFERENCES public.fodmap_subtypes(fodmap_subtype_id);


--
-- Name: published_food_subtype_levels published_food_subtype_levels_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_food_subtype_levels
    ADD CONSTRAINT published_food_subtype_levels_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: published_food_subtype_levels published_food_subtype_levels_publish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_food_subtype_levels
    ADD CONSTRAINT published_food_subtype_levels_publish_id_fkey FOREIGN KEY (publish_id) REFERENCES public.publish_releases(publish_id) ON DELETE CASCADE;


--
-- Name: published_food_subtype_levels published_food_subtype_levels_subtype_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_food_subtype_levels
    ADD CONSTRAINT published_food_subtype_levels_subtype_code_fkey FOREIGN KEY (subtype_code) REFERENCES public.fodmap_subtypes(code);


--
-- Name: published_swaps published_swaps_driver_subtype_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_swaps
    ADD CONSTRAINT published_swaps_driver_subtype_fkey FOREIGN KEY (driver_subtype) REFERENCES public.fodmap_subtypes(code);


--
-- Name: published_swaps published_swaps_from_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_swaps
    ADD CONSTRAINT published_swaps_from_food_id_fkey FOREIGN KEY (from_food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: published_swaps published_swaps_publish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_swaps
    ADD CONSTRAINT published_swaps_publish_id_fkey FOREIGN KEY (publish_id) REFERENCES public.publish_releases(publish_id) ON DELETE CASCADE;


--
-- Name: published_swaps published_swaps_to_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.published_swaps
    ADD CONSTRAINT published_swaps_to_food_id_fkey FOREIGN KEY (to_food_id) REFERENCES public.foods(food_id) ON DELETE CASCADE;


--
-- Name: recipe_fodmap_assessments recipe_fodmap_assessments_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_fodmap_assessments
    ADD CONSTRAINT recipe_fodmap_assessments_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(recipe_id) ON DELETE CASCADE;


--
-- Name: recipe_fodmap_assessments recipe_fodmap_assessments_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_fodmap_assessments
    ADD CONSTRAINT recipe_fodmap_assessments_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: recipe_ingredients recipe_ingredients_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id);


--
-- Name: recipe_ingredients recipe_ingredients_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(recipe_id) ON DELETE CASCADE;


--
-- Name: recipe_steps recipe_steps_recipe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipe_steps
    ADD CONSTRAINT recipe_steps_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES public.recipes(recipe_id) ON DELETE CASCADE;


--
-- Name: recipes recipes_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: saved_meal_items saved_meal_items_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_meal_items
    ADD CONSTRAINT saved_meal_items_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.foods(food_id);


--
-- Name: saved_meal_items saved_meal_items_saved_meal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_meal_items
    ADD CONSTRAINT saved_meal_items_saved_meal_id_fkey FOREIGN KEY (saved_meal_id) REFERENCES public.saved_meals(saved_meal_id) ON DELETE CASCADE;


--
-- Name: source_files source_files_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.source_files
    ADD CONSTRAINT source_files_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: sources sources_license_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sources
    ADD CONSTRAINT sources_license_id_fkey FOREIGN KEY (license_id) REFERENCES public.data_licenses(license_id);


--
-- Name: swap_rule_contexts swap_rule_contexts_swap_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swap_rule_contexts
    ADD CONSTRAINT swap_rule_contexts_swap_rule_id_fkey FOREIGN KEY (swap_rule_id) REFERENCES public.swap_rules(swap_rule_id) ON DELETE CASCADE;


--
-- Name: swap_rule_scores swap_rule_scores_swap_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swap_rule_scores
    ADD CONSTRAINT swap_rule_scores_swap_rule_id_fkey FOREIGN KEY (swap_rule_id) REFERENCES public.swap_rules(swap_rule_id) ON DELETE CASCADE;


--
-- Name: swap_rules swap_rules_from_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swap_rules
    ADD CONSTRAINT swap_rules_from_food_id_fkey FOREIGN KEY (from_food_id) REFERENCES public.foods(food_id);


--
-- Name: swap_rules swap_rules_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swap_rules
    ADD CONSTRAINT swap_rules_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(source_id);


--
-- Name: swap_rules swap_rules_to_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.swap_rules
    ADD CONSTRAINT swap_rules_to_food_id_fkey FOREIGN KEY (to_food_id) REFERENCES public.foods(food_id);


--
-- Name: user_consent_ledger_events user_consent_ledger_events_consent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consent_ledger_events
    ADD CONSTRAINT user_consent_ledger_events_consent_id_fkey FOREIGN KEY (consent_id) REFERENCES public.user_consent_ledger(consent_id) ON DELETE CASCADE;


--
-- Name: user_consent_ledger user_consent_ledger_parent_consent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consent_ledger
    ADD CONSTRAINT user_consent_ledger_parent_consent_id_fkey FOREIGN KEY (parent_consent_id) REFERENCES public.user_consent_ledger(consent_id);


--
-- Name: user_consent_ledger user_consent_ledger_replaced_by_consent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_consent_ledger
    ADD CONSTRAINT user_consent_ledger_replaced_by_consent_id_fkey FOREIGN KEY (replaced_by_consent_id) REFERENCES public.user_consent_ledger(consent_id);


--
-- Name: user_fodmap_tolerances user_fodmap_tolerances_fodmap_subtype_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_fodmap_tolerances
    ADD CONSTRAINT user_fodmap_tolerances_fodmap_subtype_id_fkey FOREIGN KEY (fodmap_subtype_id) REFERENCES public.fodmap_subtypes(fodmap_subtype_id);


--
-- Name: user_fodmap_tolerances user_fodmap_tolerances_user_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_fodmap_tolerances
    ADD CONSTRAINT user_fodmap_tolerances_user_profile_id_fkey FOREIGN KEY (user_profile_id) REFERENCES public.user_profiles(user_profile_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict dbmate


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20260321000000'),
    ('20260321143000');
