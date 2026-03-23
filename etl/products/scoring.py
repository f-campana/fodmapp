from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

TOKEN_RE = re.compile(r"[a-z0-9]+")


@dataclass(frozen=True)
class CandidateFood:
    food_id: str
    food_slug: str
    canonical_name_fr: str
    canonical_name_en: str
    category_codes: tuple[str, ...]


@dataclass(frozen=True)
class ScoredCandidate:
    food_id: str
    food_slug: str
    canonical_name_fr: str
    canonical_name_en: str
    score: float
    confidence_tier: str
    match_method: str
    signal_breakdown: dict[str, float]


def score_ingredient_candidates(
    ingredient_name: str,
    product_name: str,
    categories_tags: list[str],
    foods: list[CandidateFood],
    heuristic_version: str,
) -> list[ScoredCandidate]:
    ingredient_tokens = tokenize(ingredient_name)
    product_tokens = tokenize(product_name)
    category_tokens = _extract_category_tokens(categories_tags)

    scored: list[ScoredCandidate] = []
    for food in foods:
        name_tokens = tokenize(f"{food.canonical_name_fr} {food.canonical_name_en} {food.food_slug}")
        food_category_tokens = _extract_category_tokens(list(food.category_codes))
        ingredient_score = _overlap_score(ingredient_tokens, name_tokens)
        product_score = _overlap_score(product_tokens, name_tokens)
        category_score = _overlap_score(category_tokens, food_category_tokens)
        score = round((0.60 * ingredient_score) + (0.25 * product_score) + (0.15 * category_score), 3)
        if score <= 0:
            continue

        breakdown = {
            "ingredient_score": round(ingredient_score, 3),
            "product_score": round(product_score, 3),
            "category_score": round(category_score, 3),
        }
        scored.append(
            ScoredCandidate(
                food_id=food.food_id,
                food_slug=food.food_slug,
                canonical_name_fr=food.canonical_name_fr,
                canonical_name_en=food.canonical_name_en,
                score=score,
                confidence_tier=_confidence_tier(score),
                match_method=_dominant_signal(breakdown),
                signal_breakdown={**breakdown, "heuristic_version": heuristic_version},
            )
        )

    scored.sort(key=lambda item: (-item.score, item.food_slug))
    return scored[:5]


def choose_selected_candidate(candidates: list[ScoredCandidate]) -> ScoredCandidate | None:
    if not candidates:
        return None

    top = candidates[0]
    second_score = candidates[1].score if len(candidates) > 1 else 0.0
    if top.score < 0.75:
        return None
    if (top.score - second_score) < 0.10:
        return None
    return top


def tokenize(value: str | None) -> set[str]:
    if not value:
        return set()
    normalized = unicodedata.normalize("NFKD", value)
    normalized = normalized.encode("ascii", "ignore").decode("ascii")
    normalized = normalized.lower()
    return {token for token in TOKEN_RE.findall(normalized) if token}


def _extract_category_tokens(tags: list[str]) -> set[str]:
    tokens: set[str] = set()
    for tag in tags:
        suffix = tag.split(":")[-1]
        for part in suffix.replace("-", " ").split():
            if part:
                tokens.add(part)
    return tokens


def _overlap_score(left: set[str], right: set[str]) -> float:
    if not left or not right:
        return 0.0
    overlap = len(left.intersection(right))
    if overlap == 0:
        return 0.0
    return overlap / max(len(left), len(right))


def _confidence_tier(score: float) -> str:
    if score >= 0.85:
        return "high"
    if score >= 0.75:
        return "medium"
    if score >= 0.50:
        return "low"
    return "insufficient"


def _dominant_signal(breakdown: dict[str, float]) -> str:
    best_signal = max(
        (("ingredient_name", breakdown["ingredient_score"]), ("product_name", breakdown["product_score"]), ("category_overlap", breakdown["category_score"])),
        key=lambda item: item[1],
    )[0]
    return best_signal
