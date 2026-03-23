from __future__ import annotations

import argparse
import os

import psycopg
from psycopg.rows import dict_row

from etl.products.barcodes import normalize_retail_barcode
from etl.products.compiler import CompileSettings, drain_refresh_requests, process_refresh_request
from etl.products.off_client import OpenFoodFactsClient, settings_from_env


def main() -> int:
    parser = argparse.ArgumentParser(description="Compile guided product state from queued refresh requests.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    drain_parser = subparsers.add_parser("drain", help="Process queued product refresh requests.")
    drain_parser.add_argument("--limit", type=int, default=25)

    code_parser = subparsers.add_parser("code", help="Process one barcode immediately.")
    code_parser.add_argument("barcode")

    args = parser.parse_args()
    settings = CompileSettings(
        db_url=os.getenv("API_DB_URL", f"postgresql://{os.getenv('USER', 'postgres')}@localhost:5432/fodmap_test"),
        stale_after_hours=int(os.getenv("PRODUCTS_STALE_AFTER_HOURS", "72")),
        refresh_cooldown_seconds=int(os.getenv("PRODUCTS_REFRESH_COOLDOWN_SECONDS", "900")),
    )
    client = OpenFoodFactsClient(settings_from_env())

    if args.command == "drain":
        results = drain_refresh_requests(settings, client, limit=args.limit)
        print(f"processed={len(results)}")
        for result in results:
            print(f"{result['normalized_code']} status={result['status']} product_id={result['product_id']}")
        return 0

    normalized_code, canonical_format = normalize_retail_barcode(args.barcode)
    with psycopg.connect(settings.db_url, row_factory=dict_row) as conn:
        with conn.transaction():
            conn.execute(
                """
                INSERT INTO product_refresh_requests (
                  normalized_code,
                  canonical_format,
                  provider_source_id,
                  status,
                  requested_at,
                  last_requested_at,
                  refresh_after,
                  cooldown_until,
                  updated_at
                ) VALUES (
                  %(normalized_code)s,
                  %(canonical_format)s,
                  (SELECT source_id FROM sources WHERE source_slug = 'open_food_facts'),
                  'queued',
                  now(),
                  now(),
                  now(),
                  now(),
                  now()
                )
                ON CONFLICT (normalized_code) DO UPDATE SET
                  status = 'queued',
                  canonical_format = EXCLUDED.canonical_format,
                  last_requested_at = now(),
                  refresh_after = now(),
                  cooldown_until = now(),
                  updated_at = now()
                """,
                {
                    "normalized_code": normalized_code,
                    "canonical_format": canonical_format,
                },
            )
            result = process_refresh_request(
                conn,
                normalized_code=normalized_code,
                canonical_format=canonical_format,
                stale_after_hours=settings.stale_after_hours,
                client=client,
            )
            print(f"{result['normalized_code']} status={result['status']} product_id={result['product_id']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
