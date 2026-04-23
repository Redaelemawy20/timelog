import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
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


@dataclass(frozen=True)
class UserReposResult:
    ok: bool
    repos: list[dict[str, Any]] | None = None
    error: str | None = None
    http_status: int | None = None


def _github_auth_headers(token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "time-log",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def _slim_repo_payload(item: dict[str, Any]) -> dict[str, Any]:
    owner = item.get("owner") or {}
    if not isinstance(owner, dict):
        owner = {}
    return {
        "id": item.get("id"),
        "name": item.get("name"),
        "full_name": item.get("full_name"),
        "private": item.get("private"),
        "html_url": item.get("html_url"),
        "description": item.get("description"),
        "default_branch": item.get("default_branch"),
        "updated_at": item.get("updated_at"),
        "owner_login": owner.get("login"),
    }


def fetch_github_user_repos(
    token: str,
    *,
    per_page: int = 100,
    max_pages: int = 10,
) -> UserReposResult:
    """List repositories the token can access (same as GitHub /user/repos). Paginated."""
    if per_page < 1 or per_page > 100:
        per_page = 100
    all_repos: list[dict[str, Any]] = []
    for page in range(1, max_pages + 1):
        query = urlencode(
            {
                "per_page": per_page,
                "page": page,
                "sort": "updated",
                "direction": "desc",
            }
        )
        request = Request(
            f"https://api.github.com/user/repos?{query}",
            headers=_github_auth_headers(token),
        )
        try:
            with urlopen(request, timeout=30) as response:
                raw = response.read().decode("utf-8")
        except HTTPError as exc:
            try:
                body = exc.read().decode("utf-8", errors="replace")
                detail = json.loads(body).get("message") if body else None
            except Exception:
                detail = None
            msg = detail or f"GitHub API error: {exc.code}"
            return UserReposResult(ok=False, error=msg, http_status=exc.code)
        except URLError as exc:
            return UserReposResult(ok=False, error=f"Network error: {exc.reason}")
        except Exception as exc:  # pragma: no cover
            return UserReposResult(ok=False, error=f"Unexpected error: {exc}")

        try:
            batch = json.loads(raw)
        except json.JSONDecodeError:
            return UserReposResult(ok=False, error="Invalid JSON from GitHub.")

        if not isinstance(batch, list):
            return UserReposResult(ok=False, error="Unexpected response shape from GitHub.")

        if not batch:
            break

        for item in batch:
            if isinstance(item, dict):
                all_repos.append(_slim_repo_payload(item))

        if len(batch) < per_page:
            break

    return UserReposResult(ok=True, repos=all_repos)
