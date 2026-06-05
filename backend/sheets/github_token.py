import json
import logging
import os
from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)


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


def read_github_token() -> TokenReadResult:
    token = os.getenv("GITHUB_TOKEN", "").strip()
    if not token:
        return TokenReadResult(
            ok=False,
            error="GitHub token is not configured (GITHUB_TOKEN).",
        )
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


@dataclass(frozen=True)
class CommitsFetchResult:
    ok: bool
    commits: list[dict[str, Any]] | None = None
    error: str | None = None
    http_status: int | None = None


def _parse_commit_datetime(item: dict[str, Any]) -> datetime | None:
    commit_obj = item.get("commit")
    if not isinstance(commit_obj, dict):
        return None
    date_str = None
    committer = commit_obj.get("committer")
    if isinstance(committer, dict):
        date_str = committer.get("date")
    if not date_str:
        author = commit_obj.get("author")
        if isinstance(author, dict):
            date_str = author.get("date")
    if not isinstance(date_str, str):
        return None
    raw = date_str.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(raw)
    except ValueError:
        return None


def fetch_commits_for_range(
    token: str,
    owner: str,
    repo: str,
    branch: str,
    range_start: date,
    range_end: date,
    *,
    per_page: int = 100,
    max_pages: int = 100,
) -> CommitsFetchResult:
    if range_start > range_end:
        return CommitsFetchResult(ok=False, error="Invalid date range.")

    owner_q = quote(owner, safe="")
    repo_q = quote(repo, safe="")
    base = f"https://api.github.com/repos/{owner_q}/{repo_q}/commits"

    slim: list[dict[str, Any]] = []
    seen_sha: set[str] = set()
    stop_all_pages = False

    for page in range(1, max_pages + 1):
        if stop_all_pages:
            break
        query = urlencode(
            {
                "sha": branch,
                "per_page": per_page,
                "page": page,
            }
        )
        request = Request(f"{base}?{query}", headers=_github_auth_headers(token))
        try:
            with urlopen(request, timeout=45) as response:
                raw = response.read().decode("utf-8")
        except HTTPError as exc:
            try:
                body = exc.read().decode("utf-8", errors="replace")
                detail = json.loads(body).get("message") if body else None
            except Exception:
                detail = None
            msg = detail or f"GitHub API error: {exc.code}"
            logger.warning("GitHub commits API %s/%s@%s: %s", owner, repo, branch, msg)
            return CommitsFetchResult(ok=False, error=msg, http_status=exc.code)
        except URLError as exc:
            logger.warning("GitHub commits API %s/%s@%s: %s", owner, repo, branch, exc.reason)
            return CommitsFetchResult(ok=False, error=f"Network error: {exc.reason}")
        except Exception as exc:  # pragma: no cover
            logger.warning("GitHub commits API %s/%s@%s: %s", owner, repo, branch, exc)
            return CommitsFetchResult(ok=False, error=f"Unexpected error: {exc}")

        try:
            batch = json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("GitHub commits API %s/%s@%s: invalid JSON in response", owner, repo, branch)
            return CommitsFetchResult(ok=False, error="Invalid JSON from GitHub.")

        if not isinstance(batch, list):
            logger.warning(
                "GitHub commits API %s/%s@%s: expected list in response, got %s",
                owner,
                repo,
                branch,
                type(batch).__name__,
            )
            return CommitsFetchResult(ok=False, error="Unexpected response shape from GitHub.")

        if not batch:
            break

        for item in batch:
            if not isinstance(item, dict):
                continue
            sha = item.get("sha")
            if not isinstance(sha, str) or sha in seen_sha:
                continue
            commit_obj = item.get("commit")
            message = ""
            if isinstance(commit_obj, dict) and isinstance(commit_obj.get("message"), str):
                message = commit_obj["message"]
            dt = _parse_commit_datetime(item)
            if dt is None:
                continue
            day = dt.astimezone(timezone.utc).date()
            if day > range_end:
                continue
            if day < range_start:
                stop_all_pages = True
                break
            seen_sha.add(sha)
            slim.append(
                {
                    "sha": sha,
                    "message": message,
                    "date": dt.astimezone(timezone.utc).isoformat(),
                }
            )

        if len(batch) < per_page:
            break

    slim.sort(key=lambda c: c["date"])
    logger.info(
        "GitHub commits API %s/%s@%s %s..%s → %d commit(s)",
        owner,
        repo,
        branch,
        range_start.isoformat(),
        range_end.isoformat(),
        len(slim),
    )
    return CommitsFetchResult(ok=True, commits=slim)
