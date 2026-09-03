from typing import Any


def merge_commits_by_sha(commit_batches: list[list[dict[str, Any]]]) -> list[dict[str, Any]]:
    by_sha: dict[str, dict[str, Any]] = {}
    for batch in commit_batches:
        for commit in batch:
            sha = commit.get("sha")
            if not isinstance(sha, str) or not sha or sha in by_sha:
                continue
            by_sha[sha] = commit
    merged = list(by_sha.values())
    merged.sort(key=lambda commit: commit.get("date") or "")
    return merged


def format_commit_messages(commits: list[dict[str, Any]]) -> str:
    return "\n\n".join(
        commit["message"]
        for commit in commits
        if isinstance(commit.get("message"), str) and commit["message"]
    )
