import os
import re
import time
from collections import defaultdict, deque

MAX_ATTEMPTS = int(os.getenv("LOGIN_MAX_ATTEMPTS", "5"))
WINDOW_SECONDS = int(os.getenv("LOGIN_WINDOW_SECONDS", "300"))
BLOCK_SECONDS = int(os.getenv("LOGIN_BLOCK_SECONDS", "600"))

_attempts = defaultdict(deque)
_blocked_until = {}


def get_client_ip(request) -> str:
    if not request:
        return "unknown"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host or "unknown"
    return "unknown"


def rate_limit_key(username: str, client_ip: str) -> str:
    return f"{client_ip}:{(username or '').strip().lower()}"


def is_rate_limited(key: str) -> bool:
    now = time.time()
    blocked_until = _blocked_until.get(key)
    if blocked_until and blocked_until > now:
        return True
    if blocked_until and blocked_until <= now:
        _blocked_until.pop(key, None)
    return False


def register_failed_attempt(key: str) -> None:
    now = time.time()
    attempts = _attempts[key]
    while attempts and now - attempts[0] > WINDOW_SECONDS:
        attempts.popleft()
    attempts.append(now)
    if len(attempts) >= MAX_ATTEMPTS:
        _blocked_until[key] = now + BLOCK_SECONDS
        attempts.clear()


def clear_failed_attempts(key: str) -> None:
    _attempts.pop(key, None)
    _blocked_until.pop(key, None)


def validate_password(password: str) -> str | None:
    if not password or len(password) < 8:
        return "Password minimal 8 karakter"
    if not re.search(r"[A-Za-z]", password):
        return "Password harus mengandung huruf"
    if not re.search(r"\d", password):
        return "Password harus mengandung angka"
    return None
