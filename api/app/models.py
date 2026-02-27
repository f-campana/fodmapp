from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional, Sequence
from uuid import UUID

from pydantic import BaseModel, Field

FoodLevel = Literal["none", "low", "moderate", "high", "unknown"]
RuleStatus = Literal["active", "draft"]
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
QueueStatus = Literal["accepted", "duplicate", "conflict", "replayed", "rejected", "error"]


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


class MutationEnvelope(BaseModel):
    queue_item_id: UUID
    idempotency_key: str = Field(min_length=16)
    device_id: str
    app_install_id: str
    op: str
    entity_type: str
    entity_id: Optional[str] = None
    client_seq: int
    base_version: Optional[int] = None
    attempt: int = 1
    ttl_seconds: int = 172800
    created_at_utc: datetime
    payload: Dict[str, Any]
    aad: Dict[str, Any] = Field(default_factory=dict)
    signature: str
    signature_kid: str
    signature_algorithm: Literal["hmac-sha256"] = "hmac-sha256"
    ciphertext: Optional[str] = None
    nonce: Optional[str] = None
    tag: Optional[str] = None


class SyncMutationRequest(BaseModel):
    items: Sequence[MutationEnvelope]


class MutationResult(BaseModel):
    queue_item_id: UUID
    idempotency_key: str
    status: QueueStatus
    mutation_status: str
    entity_version: Optional[int] = None
    error_code: Optional[str] = None


class SyncMutationResponse(BaseModel):
    processed: int
    accepted: int
    duplicates: int
    results: list[MutationResult]


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
    user_id: str
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
