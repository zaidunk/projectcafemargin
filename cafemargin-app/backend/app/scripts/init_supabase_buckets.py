import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

BASE_DIR = Path(__file__).resolve().parents[3]
load_dotenv(BASE_DIR / ".env")


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing {name}")
    return value


def main() -> int:
    url = _require_env("SUPABASE_URL")
    key = _require_env("SUPABASE_SERVICE_ROLE_KEY")
    buckets = {
        os.getenv("SUPABASE_BUCKET_UPLOADS", "cafemargin-uploads"):
        {"public": False},
        os.getenv("SUPABASE_BUCKET_REPORTS", "cafemargin-reports"):
        {"public": False},
        os.getenv("SUPABASE_BUCKET_MODELS", "cafemargin-models"):
        {"public": False},
    }

    client = create_client(url, key)
    for bucket_name, options in buckets.items():
        response = client.storage.create_bucket(bucket_name, bucket_name, options)
        if isinstance(response, dict):
            error = response.get("error")
            if error:
                # Ignore if the bucket already exists
                if "already exists" in str(error).lower():
                    continue
                raise RuntimeError(error)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Bucket init failed: {exc}", file=sys.stderr)
        raise
