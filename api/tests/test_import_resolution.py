from __future__ import annotations

import importlib
from pathlib import Path


def test_local_app_import_resolves_from_repo_checkout() -> None:
    expected_module_path = (Path(__file__).resolve().parents[1] / "app" / "main.py").resolve()
    app_main = importlib.import_module("app.main")
    resolved_module_path = Path(app_main.__file__).resolve()

    assert resolved_module_path == expected_module_path


def test_create_app_uses_current_env_after_cached_settings(monkeypatch) -> None:
    app_config = importlib.import_module("app.config")

    monkeypatch.delenv("API_NAME", raising=False)
    monkeypatch.delenv("API_VERSION", raising=False)
    app_config.get_settings.cache_clear()
    _ = app_config.get_settings()

    monkeypatch.setenv("API_NAME", "fodmapp-api-test")
    monkeypatch.setenv("API_VERSION", "test-v0")
    app_config.get_settings.cache_clear()

    try:
        app_main = importlib.import_module("app.main")
        app = app_main.create_app()
        assert app.title == "fodmapp-api-test"
        assert app.version == "test-v0"
    finally:
        app_config.get_settings.cache_clear()
