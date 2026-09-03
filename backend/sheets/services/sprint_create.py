from dataclasses import dataclass
from datetime import date
from typing import Any

from django.db import transaction

from ..github_token import CommitsFetchResult, fetch_commits_for_range
from ..models import Sheet, SheetRepo, Sprint, SprintRepo
from .commit_merge import format_commit_messages, merge_commits_by_sha
from .github_http import http_status_for_github_code
from .repo_branches import branches_from_repo_spec


@dataclass
class SprintCreateResult:
    sprint: Sprint | None = None
    error_detail: str | None = None
    error_status: int | None = None

    @property
    def ok(self) -> bool:
        return self.sprint is not None


def _repo_display_name(spec: dict[str, Any]) -> str:
    owner = spec["owner"]
    name = spec["name"]
    display_name_raw = spec.get("display_name")
    if isinstance(display_name_raw, str):
        display_name = display_name_raw.strip()
        if display_name:
            return display_name
    return f"{owner}/{name}"


def _fetch_repo_commits(
    token: str,
    spec: dict[str, Any],
    range_start: date,
    range_end: date,
) -> CommitsFetchResult | list[dict[str, Any]]:
    owner = spec["owner"]
    name = spec["name"]
    branches = branches_from_repo_spec(spec)
    batches: list[list[dict[str, Any]]] = []

    for branch in branches:
        listed = fetch_commits_for_range(token, owner, name, branch, range_start, range_end)
        if not listed.ok:
            return listed
        batches.append(listed.commits or [])

    return merge_commits_by_sha(batches)


def create_sprint(
    sheet: Sheet,
    range_start: date,
    range_end: date,
    repo_specs: list[dict[str, Any]],
    token: str,
) -> SprintCreateResult:
    prepared: list[tuple[str, str, str, list[dict[str, Any]]]] = []
    for spec in repo_specs:
        owner = spec["owner"]
        name = spec["name"]
        display_name = _repo_display_name(spec)
        fetched = _fetch_repo_commits(token, spec, range_start, range_end)
        if isinstance(fetched, CommitsFetchResult):
            return SprintCreateResult(
                error_detail=fetched.error,
                error_status=http_status_for_github_code(fetched.http_status),
            )
        prepared.append((owner, name, display_name, fetched))

    with transaction.atomic():
        sprint = Sprint.objects.create(
            sheet=sheet,
            range_start=range_start,
            range_end=range_end,
            summary="",
            time_hours=None,
        )
        for owner, name, display_name, commits in prepared:
            sheet_repo, _ = SheetRepo.objects.get_or_create(
                sheet=sheet,
                owner=owner,
                name=name,
                defaults={"display_name": display_name},
            )
            SprintRepo.objects.create(
                sheet=sheet,
                sprint=sprint,
                sheet_repo=sheet_repo,
                project=name,
                notes=None,
                commit_messages=format_commit_messages(commits),
                raw_commits_json=commits,
            )

    sprint = Sprint.objects.prefetch_related("sprint_repos__sheet_repo").get(pk=sprint.pk)
    return SprintCreateResult(sprint=sprint)
