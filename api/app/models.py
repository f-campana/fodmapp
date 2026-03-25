from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

FoodLevel = Literal["none", "low", "moderate", "high", "unknown"]
RuleStatus = Literal["active", "draft"]
BarcodeCanonicalFormat = Literal["EAN8", "EAN13"]
ProductContractTier = Literal["guided"]
ProductLookupStatus = Literal["ready", "queued", "refreshing", "stale", "not_found", "failed"]
ProductSyncState = Literal["fresh", "stale", "refreshing", "failed"]
ProductConfidenceTier = Literal["high", "medium", "low", "insufficient"]
ProductNumericGuidanceStatus = Literal[
    "available",
    "insufficient_confidence",
    "mixed_ingredients",
    "unknown_rollup",
    "not_enough_data",
]
SafeHarborCohortCode = Literal["cohort_oil_fat", "cohort_plain_protein", "cohort_egg"]
TrackingItemKind = Literal["canonical_food", "custom_food", "free_text"]
SymptomType = Literal[
    "bloating",
    "pain",
    "gas",
    "diarrhea",
    "constipation",
    "nausea",
    "reflux",
    "other",
]
ConsentStatus = Literal["active", "revoked", "expired", "superseded", "invalidated"]
ConsentAction = Literal["grant", "revoke", "update"]
ConsentLegalBasis = Literal[
    "consent",
    "contract",
    "legal_obligation",
    "vital_interests",
    "public_interest",
    "legitimate_interests",
]
ConsentMethod = Literal[
    "explicit_checkbox",
    "oauth_consent",
    "in_app_sheet",
    "api_admin",
    "offline_cache_reconsent",
]
ConsentSource = Literal["mobile_app", "web_fallback", "support", "api_internal"]
SyncDeleteScope = Literal["all", "symptoms_only", "diet_only", "analytics_only"]
SyncOperation = Literal[
    "create_symptom_log",
    "update_symptom_log",
    "accept_swap",
    "discard_swap",
]
SyncV1MutationType = Literal[
    "SYMPTOM_CREATE",
    "SYMPTOM_UPDATE",
    "SYMPTOM_DELETE",
    "MEAL_CREATE",
    "MEAL_UPDATE",
    "MEAL_DELETE",
    "CUSTOM_FOOD_CREATE",
    "CUSTOM_FOOD_UPDATE",
    "CUSTOM_FOOD_DELETE",
    "SAVED_MEAL_CREATE",
    "SAVED_MEAL_UPDATE",
    "SAVED_MEAL_DELETE",
    "PREF_SET",
    "PREF_DELETE",
    "SWAP_APPLY",
    "SWAP_REVERT",
    "WITHDRAW_CONSENT",
    "DELETE_ACCOUNT",
]
SyncV1MutationResultState = Literal[
    "APPLIED",
    "DUPLICATE",
    "CONFLICT",
    "RETRY_WAIT",
    "FAILED_PERMANENT",
    "CANCELLED_BY_CONSENT",
    "CANCELLED_BY_DELETE",
]
SyncV1ConflictCode = Literal[
    "RULE_INACTIVE",
    "RULE_SCORE_BELOW_THRESHOLD",
    "ENDPOINT_UNKNOWN",
    "RANK2_BLOCKED",
    "VERSION_CONFLICT",
    "CONSENT_REVOKED",
    "ACCOUNT_DELETED",
]
SyncV1ResultCode = Literal[
    "OK",
    "DUPLICATE",
    "RULE_INACTIVE",
    "RULE_SCORE_BELOW_THRESHOLD",
    "ENDPOINT_UNKNOWN",
    "RANK2_BLOCKED",
    "VERSION_CONFLICT",
    "CONSENT_REVOKED",
    "ACCOUNT_DELETED",
    "INVALID_PAYLOAD",
    "INTERNAL_ERROR",
]


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
    publish_id: Optional[str] = None
    published_at: Optional[datetime] = None
    rollup_computed_at_max: Optional[datetime] = None


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


class ProductLookupSummary(BaseModel):
    product_id: UUID
    product_name_fr: str
    product_name_en: Optional[str] = None
    brand: Optional[str] = None


class ProductLookupResponse(BaseModel):
    query_code: str
    normalized_code: str
    canonical_format: BarcodeCanonicalFormat
    lookup_status: ProductLookupStatus
    refresh_enqueued: bool
    provider: str
    provider_last_synced_at: Optional[datetime] = None
    product: Optional[ProductLookupSummary] = None


class ProductResponse(BaseModel):
    product_id: UUID
    contract_tier: ProductContractTier
    sync_state: ProductSyncState
    refresh_enqueued: bool
    provider: str
    provider_status: Optional[str] = None
    provider_last_synced_at: Optional[datetime] = None
    stale_after_utc: Optional[datetime] = None
    refresh_requested_at: Optional[datetime] = None
    gtin13: Optional[str] = None
    open_food_facts_code: Optional[str] = None
    primary_normalized_code: Optional[str] = None
    canonical_format: Optional[BarcodeCanonicalFormat] = None
    product_name_fr: str
    product_name_en: Optional[str] = None
    brand: Optional[str] = None
    categories_tags: list[str]
    countries_tags: list[str]
    ingredients_text_fr: Optional[str] = None
    assessment_available: bool
    assessment_status: Optional[str] = None


class ProductIngredientCandidate(BaseModel):
    candidate_rank: int
    food_slug: str
    canonical_name_fr: str
    canonical_name_en: str
    score: float = Field(ge=0, le=1)
    confidence_tier: ProductConfidenceTier
    match_method: str
    signal_breakdown: Dict[str, Any]
    is_selected: bool


class ProductIngredientItem(BaseModel):
    line_no: int
    ingredient_text_fr: str
    normalized_name: str
    declared_share_pct: Optional[float] = Field(default=None, ge=0, le=100)
    parse_confidence: float = Field(ge=0, le=1)
    is_substantive: bool
    candidates: list[ProductIngredientCandidate]


class ProductIngredientsResponse(BaseModel):
    product_id: UUID
    contract_tier: ProductContractTier
    parser_version: str
    items: list[ProductIngredientItem]
    total: int


class ProductAssessmentSubtype(BaseModel):
    subtype_code: str
    subtype_level: FoodLevel
    source_food_slug: Optional[str] = None
    source_food_name_fr: Optional[str] = None
    source_food_name_en: Optional[str] = None
    low_max_g: Optional[float] = Field(default=None, gt=0)
    moderate_max_g: Optional[float] = Field(default=None, gt=0)
    burden_ratio: Optional[float] = None


class ProductAssessmentResponse(BaseModel):
    product_id: UUID
    contract_tier: ProductContractTier
    assessment_mode: Literal["guided"]
    assessment_status: str
    confidence_tier: ProductConfidenceTier
    heuristic_overall_level: FoodLevel
    heuristic_max_low_portion_g: Optional[float] = Field(default=None, gt=0)
    numeric_guidance_status: ProductNumericGuidanceStatus
    numeric_guidance_basis: Optional[Literal["dominant_matched_food"]] = None
    limiting_subtypes: list[str]
    caveats: list[str]
    method_version: str
    provider: str
    provider_last_synced_at: Optional[datetime] = None
    computed_at: datetime
    dominant_food_slug: Optional[str] = None
    dominant_food_name_fr: Optional[str] = None
    dominant_food_name_en: Optional[str] = None
    subtypes: list[ProductAssessmentSubtype]


class SafeHarborFoodItem(BaseModel):
    food_slug: str
    canonical_name_fr: str
    canonical_name_en: str
    preparation_state: Optional[str] = None


class SafeHarborCohort(BaseModel):
    cohort_code: SafeHarborCohortCode
    label_fr: str
    label_en: str
    rationale_fr: str
    rationale_en: str
    caveat_fr: str
    caveat_en: str
    items: list[SafeHarborFoodItem]
    total: int


class SafeHarborMeta(BaseModel):
    total_cohorts: int
    total_foods: int
    cohort_rule_source_slug: str
    cohort_rule_version: str
    data_source_slug: str
    data_source_name: str
    data_source_version: Optional[str] = None
    data_source_published_at: Optional[date] = None
    attribution: str
    no_endorsement_notice: str


class SafeHarborResponse(BaseModel):
    cohorts: list[SafeHarborCohort]
    meta: SafeHarborMeta


class TrackingItemInput(BaseModel):
    item_kind: TrackingItemKind
    food_slug: Optional[str] = None
    custom_food_id: Optional[UUID] = None
    free_text_label: Optional[str] = None
    quantity_text: Optional[str] = None
    note: Optional[str] = None

    @model_validator(mode="after")
    def validate_item(self) -> "TrackingItemInput":
        if self.item_kind == "canonical_food":
            if not self.food_slug or self.custom_food_id is not None or self.free_text_label is not None:
                raise ValueError("canonical_food items require food_slug only")
        elif self.item_kind == "custom_food":
            if self.custom_food_id is None or self.food_slug is not None or self.free_text_label is not None:
                raise ValueError("custom_food items require custom_food_id only")
        elif self.item_kind == "free_text":
            if not self.free_text_label or self.food_slug is not None or self.custom_food_id is not None:
                raise ValueError("free_text items require free_text_label only")

        return self


class MealLogItem(BaseModel):
    meal_log_item_id: UUID
    sort_order: int
    item_kind: TrackingItemKind
    label: str
    food_slug: Optional[str] = None
    custom_food_id: Optional[UUID] = None
    quantity_text: Optional[str] = None
    note: Optional[str] = None


class MealLog(BaseModel):
    meal_log_id: UUID
    title: Optional[str] = None
    occurred_at_utc: datetime
    note: Optional[str] = None
    version: int
    created_at_utc: datetime
    updated_at_utc: datetime
    items: list[MealLogItem]


class MealLogCreateRequest(BaseModel):
    occurred_at_utc: datetime
    title: Optional[str] = None
    note: Optional[str] = None
    items: list[TrackingItemInput] = Field(min_length=1)


class MealLogUpdateRequest(BaseModel):
    occurred_at_utc: Optional[datetime] = None
    title: Optional[str] = None
    note: Optional[str] = None
    items: Optional[list[TrackingItemInput]] = None

    @model_validator(mode="after")
    def validate_update(self) -> "MealLogUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("at least one meal field must be provided")
        if self.items is not None and len(self.items) == 0:
            raise ValueError("items cannot be empty")
        return self


class SymptomLog(BaseModel):
    symptom_log_id: UUID
    symptom_type: SymptomType
    severity: int = Field(ge=0, le=10)
    noted_at_utc: datetime
    note: Optional[str] = None
    version: int
    created_at_utc: datetime
    updated_at_utc: datetime


class SymptomLogCreateRequest(BaseModel):
    symptom_type: SymptomType
    severity: int = Field(ge=0, le=10)
    noted_at_utc: datetime
    note: Optional[str] = None


class SymptomLogUpdateRequest(BaseModel):
    symptom_type: Optional[SymptomType] = None
    severity: Optional[int] = Field(default=None, ge=0, le=10)
    noted_at_utc: Optional[datetime] = None
    note: Optional[str] = None

    @model_validator(mode="after")
    def validate_update(self) -> "SymptomLogUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("at least one symptom field must be provided")
        return self


class CustomFood(BaseModel):
    custom_food_id: UUID
    label: str
    note: Optional[str] = None
    version: int
    created_at_utc: datetime
    updated_at_utc: datetime


class CustomFoodCreateRequest(BaseModel):
    label: str = Field(min_length=1)
    note: Optional[str] = None


class CustomFoodUpdateRequest(BaseModel):
    label: Optional[str] = None
    note: Optional[str] = None

    @model_validator(mode="after")
    def validate_update(self) -> "CustomFoodUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("at least one custom food field must be provided")
        return self


class SavedMealItem(BaseModel):
    saved_meal_item_id: UUID
    sort_order: int
    item_kind: TrackingItemKind
    label: str
    food_slug: Optional[str] = None
    custom_food_id: Optional[UUID] = None
    quantity_text: Optional[str] = None
    note: Optional[str] = None


class SavedMeal(BaseModel):
    saved_meal_id: UUID
    label: str
    note: Optional[str] = None
    version: int
    created_at_utc: datetime
    updated_at_utc: datetime
    items: list[SavedMealItem]


class SavedMealCreateRequest(BaseModel):
    label: str = Field(min_length=1)
    note: Optional[str] = None
    items: list[TrackingItemInput] = Field(min_length=1)


class SavedMealUpdateRequest(BaseModel):
    label: Optional[str] = None
    note: Optional[str] = None
    items: Optional[list[TrackingItemInput]] = None

    @model_validator(mode="after")
    def validate_update(self) -> "SavedMealUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("at least one saved meal field must be provided")
        if self.items is not None and len(self.items) == 0:
            raise ValueError("items cannot be empty")
        return self


class TrackingFeedEntry(BaseModel):
    entry_type: Literal["meal", "symptom"]
    occurred_at_utc: datetime
    meal: Optional[MealLog] = None
    symptom: Optional[SymptomLog] = None


class TrackingFeedResponse(BaseModel):
    total: int
    limit: int
    items: list[TrackingFeedEntry]


class DailyTrackingCount(BaseModel):
    date: date
    meal_count: int
    symptom_count: int


class SymptomTypeCount(BaseModel):
    symptom_type: SymptomType
    count: int


class TrackingSeveritySummary(BaseModel):
    average: Optional[float] = None
    maximum: Optional[int] = None


class ProximityMeal(BaseModel):
    meal_log_id: UUID
    title: Optional[str] = None
    occurred_at_utc: datetime
    hours_before_symptom: float
    item_labels: list[str]


class SymptomProximityGroup(BaseModel):
    symptom_log_id: UUID
    symptom_type: SymptomType
    severity: int = Field(ge=0, le=10)
    noted_at_utc: datetime
    nearby_meals: list[ProximityMeal]


class WeeklyTrackingSummaryResponse(BaseModel):
    anchor_date: date
    window_start_utc: datetime
    window_end_utc: datetime
    daily_counts: list[DailyTrackingCount]
    symptom_counts: list[SymptomTypeCount]
    severity: TrackingSeveritySummary
    proximity_groups: list[SymptomProximityGroup]


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


class ConsentState(BaseModel):
    active: bool
    consent_id: UUID
    policy_version: str
    legal_basis: ConsentLegalBasis
    scope: Dict[str, bool]
    method: ConsentMethod
    source: ConsentSource
    granted_at_utc: datetime
    revoked_at_utc: Optional[datetime] = None
    revocation_reason: Optional[str] = None
    status: ConsentStatus


class ConsentHistoryEntry(BaseModel):
    event: str
    at_utc: datetime
    policy_version: Optional[str] = None
    source: Optional[str] = None
    reason: Optional[str] = None


class ConsentGetResponse(BaseModel):
    user_id: UUID
    consent_state: ConsentState
    history: list[ConsentHistoryEntry]


class ConsentPostRequest(BaseModel):
    policy_version: str
    action: ConsentAction
    scope: Dict[str, bool]
    legal_basis: ConsentLegalBasis = "consent"
    method: ConsentMethod = "in_app_sheet"
    source: ConsentSource = "mobile_app"
    source_ref: Optional[str] = None
    language: str = "fr-FR"
    reason: Optional[str] = None
    signature_payload: Optional[str] = None
    signature: Optional[str] = None
    public_key_id: Optional[str] = None


class ConsentPostResponse(BaseModel):
    consent_id: UUID
    status: ConsentStatus
    policy_version: str
    legal_basis: ConsentLegalBasis
    effective_at_utc: datetime
    previous_consent_id: Optional[UUID] = None
    evidence_uri: Optional[str] = None
    evidence_hash: str
    history: list[ConsentHistoryEntry]


class ExportRequest(BaseModel):
    format: Literal["json", "ndjson"] = "json"
    from_ts_utc: Optional[datetime] = None
    to_ts_utc: Optional[datetime] = None
    include: list[str] = ["consent", "profile", "symptoms", "diet_logs", "swap_history"]
    anonymize: bool = True
    idempotency_key: Optional[str] = None


class Receipt(BaseModel):
    receipt_id: UUID
    issued_at_utc: datetime
    actor: str
    policy_version: Optional[str] = None
    manifest_hash: str
    proof_signature: Optional[str] = None


class ExportAcceptedResponse(BaseModel):
    export_id: UUID
    status: Literal["accepted", "queued", "processing", "ready", "ready_with_redactions", "failed"]
    requested_at_utc: datetime
    expiry_at_utc: datetime
    idempotency_key: Optional[str] = None
    status_uri: str


class ExportPollResponse(BaseModel):
    export_id: UUID
    idempotency_key: Optional[str] = None
    status: str
    completed_at_utc: Optional[datetime] = None
    scope: Dict[str, Any]
    rows_by_domain: Dict[str, int]
    redactions: list[str]
    download_url: Optional[str] = None
    manifest: Dict[str, Any]
    proof: Optional[Receipt] = None
    failure: Optional[Dict[str, str]] = None


class DeleteRequest(BaseModel):
    scope: SyncDeleteScope
    soft_delete_window_days: int = Field(default=0, ge=0)
    hard_delete: bool = True
    confirm_text: str
    reason: Optional[str] = None
    client_nonce: Optional[str] = None
    idempotency_key: Optional[str] = None


class DeleteSummary(BaseModel):
    consent_records_touched: int = 0
    symptom_logs_deleted: int = 0
    diet_logs_deleted: int = 0
    swap_history_deleted: int = 0
    queue_items_dropped: int = 0
    exports_invalidated: int = 0


class DeleteAcceptedResponse(BaseModel):
    delete_request_id: UUID
    status: Literal["accepted", "queued", "processing", "completed", "partial", "failed"]
    requested_at_utc: datetime
    scope: SyncDeleteScope
    idempotency_key: Optional[str] = None
    local_effective_ttl_seconds: int
    server_effective_at_utc: datetime
    proof_uri: Optional[str] = None
    status_uri: str


class RetainedArtifact(BaseModel):
    type: str
    reason: str
    retention_until_utc: datetime


class DeletePollResponse(BaseModel):
    delete_request_id: UUID
    status: Literal["accepted", "queued", "processing", "completed", "partial", "failed"]
    idempotency_key: Optional[str] = None
    completed_at_utc: Optional[datetime] = None
    summary: DeleteSummary
    proof: Optional[Receipt] = None
    failure: Optional[Dict[str, str]] = None
    retained_artifacts: list[RetainedArtifact] = Field(default_factory=list)


class SyncV1MutationSource(BaseModel):
    platform: Literal["ios", "android", "web"]
    screen: str
    actor: Literal["user", "background_replay", "system"]
    app_build: Optional[str] = None


class SyncV1MutationIntegrity(BaseModel):
    payload_hash: str = Field(min_length=8)
    chain_prev_hash: Optional[str] = None
    signature_algo: Literal["hmac-sha256"] = "hmac-sha256"
    signature: str = Field(min_length=8)
    signature_version: int = 1


class SyncV1MutationRecovery(BaseModel):
    action: Literal[
        "SHOW_REPLACEMENT",
        "KEEP_REMOTE",
        "MANUAL_RETRY",
        "OPEN_SETTINGS",
        "NONE",
    ]
    replacement_rule_id: Optional[str] = None
    note: Optional[str] = None


class SyncV1MutationConflict(BaseModel):
    code: SyncV1ConflictCode
    message_key: str
    retryable: bool = False
    is_resolvable_client_side: bool = False
    recovery: SyncV1MutationRecovery
    fodmap_safety_score_snapshot: Optional[float] = None
    scoring_version_snapshot: Optional[str] = None
    from_food_slug: Optional[str] = None
    to_food_slug: Optional[str] = None
    to_overall_level: Optional[FoodLevel] = None
    coverage_ratio: Optional[float] = None


class SyncV1MutationItem(BaseModel):
    mutation_id: Optional[str] = Field(default=None, min_length=1)
    idempotency_key: Optional[str] = None
    operation_type: Optional[SyncV1MutationType] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    base_version: Optional[int] = None
    client_seq: int = Field(default=0, ge=0)
    client_created_at: datetime
    payload: Dict[str, Any] = Field(default_factory=dict)
    depends_on_mutation_id: Optional[str] = None
    source: Optional[SyncV1MutationSource] = None
    conflict_marker: Optional[Dict[str, Any]] = None
    integrity: Optional[SyncV1MutationIntegrity] = None
    # legacy fallback
    mutation_id_legacy: Optional[str] = None
    operation_legacy: Optional[SyncV1MutationType] = None
    legacy_source: Optional[Dict[str, Any]] = None


class SyncV1MutationBatchRequest(BaseModel):
    schema_version: int = 1
    batch_id: str
    client_device_id: str
    sync_session_id: str
    client_time_utc: datetime
    user_id: Optional[str] = None
    items: list[SyncV1MutationItem]
    migration_mode: bool = False


class SyncV1MutationObservability(BaseModel):
    event_id: str
    request_id: str
    payload_hash: str
    processing_ms: int
    signature_valid: bool = False
    server_received_at_utc: datetime
    dedupe_hit: bool = False
    retry_attempt: int = 0


class SyncV1MutationResult(BaseModel):
    mutation_id: str
    idempotency_key: str
    status: SyncV1MutationResultState
    result_code: SyncV1ResultCode
    retry_after_ms: int = 0
    attempted: bool = True
    applied_version: Optional[int] = None
    conflict: Optional[SyncV1MutationConflict] = None
    observability: SyncV1MutationObservability
    server_received_at_utc: datetime


class SyncV1MutationBatchResponse(BaseModel):
    batch_id: str
    schema_version: int = 1
    received_at_utc: datetime
    server_batch_seq: int
    items: list[SyncV1MutationResult]
