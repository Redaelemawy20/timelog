import json
from dataclasses import dataclass
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


@dataclass(frozen=True)
class TokenReadResult:
    ok: bool
    token: str | None = None
    error: str | None = None


@dataclass(frozen=True)
class TokenVerifyResult:
    ok: bool
    login: str | None = None
    name: str | None = None
    error: str | None = None


def resolve_token_path(base_dir: Path, configured_path: str | None) -> Path | None:
    if not configured_path:
        return None
    path = Path(configured_path)
    if path.is_absolute():
        return path
    return base_dir / path


def read_github_token(path: Path) -> TokenReadResult:
    try:
        token = path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return TokenReadResult(ok=False, error=f"Token file not found: {path}")
    except OSError as exc:
        return TokenReadResult(ok=False, error=str(exc))

    if not token:
        return TokenReadResult(ok=False, error="Token file is empty.")
    return TokenReadResult(ok=True, token=token)


def verify_github_token(token: str) -> TokenVerifyResult:
    request = Request(
        "https://api.github.com/user",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "time-log",
        },
    )
    try:
        with urlopen(request, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        return TokenVerifyResult(ok=False, error=f"GitHub API error: {exc.code}")
    except URLError as exc:
        return TokenVerifyResult(ok=False, error=f"Network error: {exc.reason}")
    except Exception as exc:  # pragma: no cover
        return TokenVerifyResult(ok=False, error=f"Unexpected error: {exc}")

    login = payload.get("login")
    name = payload.get("name")
    if not login:
        return TokenVerifyResult(ok=False, error="Token validated but no login returned.")
    return TokenVerifyResult(ok=True, login=login, name=name)
