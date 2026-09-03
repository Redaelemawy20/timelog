from typing import Any


def branches_from_repo_spec(spec: dict[str, Any]) -> list[str]:
    branches_raw = spec.get("branches")
    if isinstance(branches_raw, list):
        cleaned: list[str] = []
        seen: set[str] = set()
        for branch in branches_raw:
            if not isinstance(branch, str):
                continue
            name = branch.strip()
            if not name or name in seen:
                continue
            seen.add(name)
            cleaned.append(name)
        if cleaned:
            return cleaned

    for key in ("branch", "default_branch"):
        branch_raw = spec.get(key)
        if isinstance(branch_raw, str) and branch_raw.strip():
            return [branch_raw.strip()]

    return ["main"]
