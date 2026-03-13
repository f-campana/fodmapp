from __future__ import annotations

from fastapi import APIRouter, Request

from app import sql
from app.db import Database
from app.models import SafeHarborCohort, SafeHarborFoodItem, SafeHarborMeta, SafeHarborResponse

router = APIRouter(prefix="/v0/safe-harbors", tags=["safe-harbors"])


def _get_db(request: Request) -> Database:
    return request.app.state.db


def _normalize_names(row: dict) -> dict:
    canonical_name_fr = row.get("canonical_name_fr") or row["food_slug"]
    canonical_name_en = row.get("canonical_name_en") or canonical_name_fr
    row["canonical_name_fr"] = canonical_name_fr
    row["canonical_name_en"] = canonical_name_en
    return row


def _build_attribution(meta_row: dict) -> str:
    version = meta_row.get("data_source_version")
    published_at = meta_row.get("data_source_published_at")
    details: list[str] = []
    if version:
        details.append(f"version {version}")
    if published_at:
        details.append(f"mise à jour {published_at.isoformat()}")
    if details:
        return "Source: Anses - Table de composition nutritionnelle des aliments Ciqual (" + ", ".join(details) + ")."
    return "Source: Anses - Table de composition nutritionnelle des aliments Ciqual."


@router.get("", response_model=SafeHarborResponse)
def list_safe_harbors(request: Request) -> SafeHarborResponse:
    db = _get_db(request)
    with db.readonly_connection() as conn:
        rows = sql.fetch_all(conn, sql.SQL_LIST_SAFE_HARBORS, {})
        meta_row = sql.fetch_one(conn, sql.SQL_GET_SAFE_HARBOR_META, {})

    grouped: dict[str, dict] = {}
    for row in rows:
        payload = _normalize_names(row)
        cohort_code = payload["cohort_code"]
        cohort = grouped.setdefault(
            cohort_code,
            {
                "cohort_code": cohort_code,
                "label_fr": payload["label_fr"],
                "label_en": payload["label_en"],
                "rationale_fr": payload["rationale_fr"],
                "rationale_en": payload["rationale_en"],
                "caveat_fr": payload["caveat_fr"],
                "caveat_en": payload["caveat_en"],
                "items": [],
            },
        )
        cohort["items"].append(
            SafeHarborFoodItem(
                food_slug=payload["food_slug"],
                canonical_name_fr=payload["canonical_name_fr"],
                canonical_name_en=payload["canonical_name_en"],
                preparation_state=payload.get("preparation_state"),
            )
        )

    cohorts = [SafeHarborCohort(**{**cohort, "total": len(cohort["items"])}) for cohort in grouped.values()]
    total_foods = sum(cohort.total for cohort in cohorts)

    if meta_row is None:
        meta_row = {
            "cohort_rule_source_slug": "internal_rules_v1",
            "cohort_rule_version": "safe_harbor_v1",
            "data_source_slug": "ciqual_2025",
            "data_source_name": "ANSES CIQUAL 2025",
            "data_source_version": None,
            "data_source_published_at": None,
        }

    meta = SafeHarborMeta(
        total_cohorts=len(cohorts),
        total_foods=total_foods,
        cohort_rule_source_slug=meta_row["cohort_rule_source_slug"],
        cohort_rule_version=meta_row["cohort_rule_version"],
        data_source_slug=meta_row["data_source_slug"],
        data_source_name=meta_row["data_source_name"],
        data_source_version=meta_row.get("data_source_version"),
        data_source_published_at=meta_row.get("data_source_published_at"),
        attribution=_build_attribution(meta_row),
        no_endorsement_notice="Aucune approbation ou validation par l'Anses n'est revendiquée.",
    )

    return SafeHarborResponse(cohorts=cohorts, meta=meta)
