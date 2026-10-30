"""Export the OpenAPI schema consumed by `packages/api-client` codegen.

Usage: uv run python scripts/export_openapi.py [output_path]
"""

import json
import sys
from pathlib import Path

from app.main import create_app

DEFAULT_OUTPUT = Path(__file__).resolve().parents[3] / "packages/api-client/openapi.json"

if __name__ == "__main__":
    output = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_OUTPUT
    schema = create_app().openapi()
    output.write_text(json.dumps(schema, indent=2, ensure_ascii=False) + "\n")
    print(f"OpenAPI schema written to {output}")
