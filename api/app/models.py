from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

FoodLevel = Literal["none", "low", "moderate", "high", "unknown"]
RuleStatus = Literal["active", "draft"]


class ErrorBody(BaseModel):
    code: str
    message: str
    details: Optional[List[Dict[str, Any]]] = None


class ErrorResponse(BaseModel):
    error: ErrorBody


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str
    timestamp: datetime


class FoodResponse(BaseModel):
    food_slug: str
    canonical_name_fr: str
    canonical_name_en: str
    preparation_state: Optional[str] = None
    status: Optional[str] = None
    source_slug: Optional[str] = None


class FoodSearchItem(BaseModel):
    food_slug: str
    canonical_name_fr: str
    canonical_name_en: str
    overall_level: Optional[FoodLevel] = None
    driver_subtype: Optional[str] = None
    coverage_ratio: Optional[float] = None
    rollup_computed_at: Optional[datetime] = None


class FoodSearchResponse(BaseModel):
    query: str
    limit: int
    items: list[FoodSearchItem]
    total: int


class FoodRollupResponse(BaseModel):
    food_slug: str
    canonical_name_fr: str
    canonical_name_en: str
    rollup_serving_g: Optional[float] = None
    overall_level: FoodLevel
    driver_subtype: Optional[str] = None
    known_subtypes_count: int
    coverage_ratio: float
    source_slug: str
    rollup_computed_at: datetime
    scoring_version: Optional[str] = None


class TraitLabel(BaseModel):
    code: str
    label_fr: Optional[str] = None
    label_en: Optional[str] = None


class FoodSubtypeItem(BaseModel):
    subtype_code: str
    subtype_level: FoodLevel
    amount_g_per_serving: Optional[float] = None
    comparator: Optional[str] = None
    low_max_g: Optional[float] = None
    moderate_max_g: Optional[float] = None
    burden_ratio: Optional[float] = None
    signal_source_kind: Optional[str] = None
    signal_source_slug: Optional[str] = None
    threshold_source_slug: Optional[str] = None
    is_default_threshold: bool
    is_polyol_proxy: bool
    rollup_serving_g: Optional[float] = None
    computed_at: datetime


class FoodSubtypeListResponse(BaseModel):
    food_slug: str
    canonical_name_fr: str
    canonical_name_en: str
    items: list[FoodSubtypeItem]
    total: int


class FoodTraitsResponse(BaseModel):
    food_slug: str
    canonical_name_fr: str
    canonical_name_en: str
    source_slug: Optional[str] = None
    culinary_roles: list[TraitLabel]
    flavor_profiles: list[TraitLabel]
    texture_profiles: list[TraitLabel]
    cooking_behaviors: list[TraitLabel]
    cuisine_affinities: list[TraitLabel]


class SwapItem(BaseModel):
    from_food_slug: str
    to_food_slug: str
    from_food_name_fr: Optional[str] = None
    from_food_name_en: Optional[str] = None
    to_food_name_fr: Optional[str] = None
    to_food_name_en: Optional[str] = None
    instruction_fr: str
    instruction_en: str
    from_overall_level: FoodLevel
    to_overall_level: FoodLevel
    driver_subtype: Optional[str] = None
    from_burden_ratio: Optional[float] = None
    to_burden_ratio: Optional[float] = None
    coverage_ratio: float
    fodmap_safety_score: float = Field(ge=0, le=1)
    overall_score: float = Field(ge=0, le=1)
    rule_status: RuleStatus
    scoring_version: str
    source_slug: str
    rollup_computed_at: datetime


class AppliedFilters(BaseModel):
    limit: int
    min_safety_score: float


class SwapListResponse(BaseModel):
    from_food_slug: str
    applied_filters: AppliedFilters
    items: list[SwapItem]
    total: int
