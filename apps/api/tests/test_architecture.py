"""Module boundaries: a module talks to another module only through its service.

Importing another module's `repository` (or its DB session usage through it) is forbidden;
use `<other>.service` instead.
"""

import ast
from pathlib import Path

MODULES_DIR = Path(__file__).resolve().parents[1] / "src/app/modules"


def test_modules_do_not_import_other_modules_repositories() -> None:
    violations = []
    for path in MODULES_DIR.rglob("*.py"):
        own = path.relative_to(MODULES_DIR).parts[0]
        for node in ast.walk(ast.parse(path.read_text())):
            if isinstance(node, ast.ImportFrom) and node.module:
                parts = node.module.split(".")
                if parts[:2] == ["app", "modules"] and len(parts) > 3:
                    other, layer = parts[2], parts[3]
                    if other != own and layer == "repository":
                        violations.append(f"{path.relative_to(MODULES_DIR)}: {node.module}")
    assert not violations, "Use the other module's service instead:\n" + "\n".join(violations)
