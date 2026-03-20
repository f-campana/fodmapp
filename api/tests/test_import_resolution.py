from __future__ import annotations

from pathlib import Path

import app.main


def test_local_app_import_resolves_from_repo_checkout() -> None:
    expected_module_path = (Path(__file__).resolve().parents[1] / "app" / "main.py").resolve()
    resolved_module_path = Path(app.main.__file__).resolve()

    assert resolved_module_path == expected_module_path
