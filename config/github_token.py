"""Read GitHub PAT from disk and verify via GET /user (stdlib only)."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

GITHUB_USER_URL = "https://api.github.com/user"
REQUEST_TIMEOUT_S = 10
USER_AGENT = "time-log/1.0"


@dataclass(frozen=True)
class ReadTokenResult:
    ok: bool
    token: str | None
    error: str | None


@dataclass(frozen=True)
class VerifyResult:
    ok: bool
    login: str | None
    error: str | None
    status_code: int | None
    name: str | None = None


def resolve_token_path(base_dir: Path, raw: str | None) -> Path | None:
    if raw is None:
        return None
    text = raw.strip()
    if not text:
        return None
    path = Path(text)
    if not path.is_absolute():
        path = base_dir / path
    return path


def read_github_token(path: Path) -> ReadTokenResult:
    try:
        data = path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return ReadTokenResult(False, None, "Token file not found.")
    except PermissionError:
        return ReadTokenResult(False, None, "Permission denied reading the token file.")
    except OSError as exc:
        return ReadTokenResult(False, None, f"Could not read token file: {exc}")

    if not data:
        return ReadTokenResult(False, None, "Token file is empty.")
    return ReadTokenResult(True, data, None)


def _api_error_message(status: int) -> str:
    if status == 401:
        return "GitHub rejected the token (401). It may be invalid or expired."
    if status == 403:
        return "GitHub returned forbidden (403). Check token scopes or rate limits."
    if status == 429:
        return "GitHub rate limit exceeded (429). Try again later."
    return f"GitHub API error ({status})."


def verify_github_token(token: str) -> VerifyResult:
    request = Request(
        GITHUB_USER_URL,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": USER_AGENT,
        },
        method="GET",
    )
    try:
        with urlopen(request, timeout=REQUEST_TIMEOUT_S) as response:
            raw = response.read().decode("utf-8")
            status = getattr(response, "status", 200) or 200
    except HTTPError as exc:
        return VerifyResult(
            False,
            None,
            _api_error_message(exc.code),
            exc.code,
            None,
        )
    except URLError as exc:
        reason = exc.reason if getattr(exc, "reason", None) else str(exc)
        return VerifyResult(False, None, f"Network error: {reason}", None, None)

    try:
        payload: dict[str, Any] = json.loads(raw)
    except json.JSONDecodeError:
        return VerifyResult(False, None, "Invalid response from GitHub (not JSON).", None, None)

    login = payload.get("login")
    if not isinstance(login, str) or not login:
        return VerifyResult(False, None, "GitHub response did not include a login.", None, None)

    display_name = payload.get("name")
    name_str = display_name.strip() if isinstance(display_name, str) and display_name.strip() else None

    return VerifyResult(True, login, None, status, name_str)
