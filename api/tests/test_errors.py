"""Focused unit tests for api/app/errors.py.

Tests all factory functions and the three registered exception handlers
without requiring a database or the full application stack.
"""

from __future__ import annotations

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.errors import (
    ApiError,
    bad_request,
    conflict,
    invalid_barcode,
    locked,
    not_found,
    precondition_failed,
    register_error_handlers,
    request_not_readable,
    rollup_not_available,
    service_unavailable,
    too_many_requests,
    unauthorized,
)

# ---------------------------------------------------------------------------
# Factory function tests
# ---------------------------------------------------------------------------

_FACTORY_CASES = [
    (not_found, "not_found", "Resource not found", 404),
    (rollup_not_available, "rollup_not_available", "Rollup not available for this food", 404),
    (service_unavailable, "service_unavailable", "Database unavailable", 503),
    (unauthorized, "unauthorized", "Unauthorized", 401),
    (conflict, "conflict", "Conflict", 409),
    (precondition_failed, "precondition_failed", "Precondition failed", 412),
    (locked, "locked", "Locked", 423),
    (too_many_requests, "too_many_requests", "Too many requests", 429),
    (bad_request, "bad_request", "Bad request", 400),
    (invalid_barcode, "invalid_barcode", "Invalid barcode", 422),
    (request_not_readable, "request_unreadable", "Request could not be read", 422),
]


@pytest.mark.parametrize(
    "factory, expected_code, expected_default_msg, expected_status",
    _FACTORY_CASES,
    ids=[c[1] for c in _FACTORY_CASES],
)
class TestFactoryDefaults:
    def test_returns_api_error(self, factory, expected_code, expected_default_msg, expected_status):
        err = factory()
        assert isinstance(err, ApiError)
        assert isinstance(err, Exception)

    def test_default_fields(self, factory, expected_code, expected_default_msg, expected_status):
        err = factory()
        assert err.code == expected_code
        assert err.message == expected_default_msg
        assert err.status_code == expected_status

    def test_custom_message(self, factory, expected_code, expected_default_msg, expected_status):
        err = factory("custom msg")
        assert err.message == "custom msg"
        assert err.code == expected_code
        assert err.status_code == expected_status


# ---------------------------------------------------------------------------
# Exception handler tests — uses a minimal FastAPI app, no DB needed
# ---------------------------------------------------------------------------


@pytest.fixture()
def error_app() -> FastAPI:
    app = FastAPI()
    register_error_handlers(app)

    @app.get("/raise-api-error")
    async def _raise_api_error():
        raise not_found("thing missing")

    @app.get("/raise-internal")
    async def _raise_internal():
        raise RuntimeError("boom")

    @app.get("/validation-error")
    async def _validation_error(count: int):  # noqa: ARG001
        return {}

    return app


@pytest.fixture()
def error_client(error_app: FastAPI) -> TestClient:
    return TestClient(error_app, raise_server_exceptions=False)


class TestApiErrorHandler:
    def test_status_code(self, error_client: TestClient):
        resp = error_client.get("/raise-api-error")
        assert resp.status_code == 404

    def test_body_shape(self, error_client: TestClient):
        body = error_client.get("/raise-api-error").json()
        assert body == {"error": {"code": "not_found", "message": "thing missing"}}


class TestValidationErrorHandler:
    def test_status_code(self, error_client: TestClient):
        resp = error_client.get("/validation-error", params={"count": "abc"})
        assert resp.status_code == 422

    def test_body_shape(self, error_client: TestClient):
        body = error_client.get("/validation-error", params={"count": "abc"}).json()
        err = body["error"]
        assert err["code"] == "validation_error"
        assert err["message"] == "Invalid request parameters"
        assert isinstance(err["details"], list)
        assert len(err["details"]) > 0


class TestInternalErrorHandler:
    def test_status_code(self, error_client: TestClient):
        resp = error_client.get("/raise-internal")
        assert resp.status_code == 500

    def test_body_shape(self, error_client: TestClient):
        body = error_client.get("/raise-internal").json()
        assert body == {
            "error": {
                "code": "internal_error",
                "message": "Unexpected server error",
            }
        }
