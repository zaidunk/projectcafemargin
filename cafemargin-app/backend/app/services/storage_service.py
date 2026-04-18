import os
import re
import os.path
from typing import Optional
from supabase import create_client, Client


def _require_supabase_config() -> tuple[str, str]:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    missing = []
    if not url:
        missing.append("SUPABASE_URL")
    if not key:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if missing:
        raise RuntimeError(f"Missing Supabase config: {', '.join(missing)}")
    return url, key


def get_bucket_names() -> dict:
    return {
        "uploads": os.getenv("SUPABASE_BUCKET_UPLOADS", "cafemargin-uploads"),
        "reports": os.getenv("SUPABASE_BUCKET_REPORTS", "cafemargin-reports"),
        "models": os.getenv("SUPABASE_BUCKET_MODELS", "cafemargin-models"),
    }


def get_default_signed_url_ttl() -> int:
    return int(os.getenv("SUPABASE_SIGNED_URL_EXPIRES", "3600"))


def get_supabase_client() -> Client:
    url, key = _require_supabase_config()
    return create_client(url, key)


def sanitize_filename(filename: Optional[str]) -> str:
    name = os.path.basename(filename or "")
    if not name:
        name = "file"
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name)
    return name[:200]


def upload_bytes(bucket: str, path: str, data: bytes, content_type: Optional[str] = None) -> None:
    client = get_supabase_client()
    _ensure_bucket(client, bucket)
    options = {"content-type": content_type} if content_type else {}
    response = client.storage.from_(bucket).upload(path, data, options)
    if isinstance(response, dict):
        error = response.get("error")
        if error:
            raise RuntimeError(error)


def create_signed_url(bucket: str, path: str, expires_in: int) -> str:
    client = get_supabase_client()
    response = client.storage.from_(bucket).create_signed_url(path, expires_in)
    if isinstance(response, dict):
        error = response.get("error")
        if error:
            raise RuntimeError(error)
        data = response.get("data")
        if isinstance(data, dict):
            signed_url = data.get("signedUrl") or data.get("signedURL")
            if signed_url:
                return signed_url
        signed_url = response.get("signedUrl") or response.get("signedURL")
        if signed_url:
            return signed_url
    raise RuntimeError("Failed to create signed URL")


def _ensure_bucket(client: Client, bucket: str) -> None:
    try:
        response = client.storage.create_bucket(bucket, bucket, {"public": False})
        if isinstance(response, dict):
            error = response.get("error")
            if error and "already exists" not in str(error).lower():
                raise RuntimeError(error)
    except Exception as exc:
        message = str(exc).lower()
        if "already exists" in message or "duplicate" in message:
            return
        raise
