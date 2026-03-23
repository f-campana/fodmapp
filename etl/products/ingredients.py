from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

_PERCENT_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*%")
_NON_WORD_RE = re.compile(r"[^a-z0-9\s-]+")
_SPACE_RE = re.compile(r"\s+")
_SUBSTANTIVE_STOPWORDS = {
    "eau",
    "sel",
    "sucre",
    "arome",
    "aromes",
    "aromes naturels",
    "epices",
    "epice",
    "acidifiant",
    "conservateur",
    "emulsifiant",
    "colorant",
}


@dataclass(frozen=True)
class ParsedIngredient:
    line_no: int
    ingredient_text_fr: str
    normalized_name: str
    declared_share_pct: float | None
    parse_confidence: float
    is_substantive: bool


def parse_ingredients(ingredients_text: str | None, parser_version: str = "ingredients_v1") -> tuple[str, list[ParsedIngredient]]:
    if not ingredients_text:
        return parser_version, []

    items: list[ParsedIngredient] = []
    for idx, chunk in enumerate(_split_top_level(ingredients_text), start=1):
        raw = chunk.strip()
        if not raw:
            continue

        percent = _extract_percent(raw)
        normalized_name = normalize_ingredient_name(raw)
        if not normalized_name:
            continue

        is_substantive = normalized_name not in _SUBSTANTIVE_STOPWORDS
        parse_confidence = 0.98 if percent is not None else 0.92
        items.append(
            ParsedIngredient(
                line_no=idx,
                ingredient_text_fr=raw,
                normalized_name=normalized_name,
                declared_share_pct=percent,
                parse_confidence=parse_confidence,
                is_substantive=is_substantive,
            )
        )

    return parser_version, items


def normalize_ingredient_name(raw: str) -> str:
    normalized = unicodedata.normalize("NFKD", raw)
    normalized = normalized.encode("ascii", "ignore").decode("ascii")
    normalized = normalized.lower()
    normalized = _PERCENT_RE.sub(" ", normalized)
    normalized = normalized.replace("*", " ")
    normalized = normalized.replace("(", " ").replace(")", " ")
    normalized = _NON_WORD_RE.sub(" ", normalized)
    normalized = _SPACE_RE.sub(" ", normalized).strip(" -")
    return normalized


def _extract_percent(raw: str) -> float | None:
    match = _PERCENT_RE.search(raw)
    if match is None:
        return None

    return float(match.group(1).replace(",", "."))


def _split_top_level(text: str) -> list[str]:
    parts: list[str] = []
    current: list[str] = []
    depth = 0
    for char in text:
        if char == "(":
            depth += 1
        elif char == ")" and depth > 0:
            depth -= 1

        if depth == 0 and char in {",", ";"}:
            parts.append("".join(current))
            current = []
            continue

        current.append(char)

    if current:
        parts.append("".join(current))
    return parts
