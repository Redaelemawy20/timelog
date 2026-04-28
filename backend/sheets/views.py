from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from .github_token import (
    fetch_commits_for_range,
    fetch_github_user_repos,
    read_github_token,
    resolve_token_path,
    verify_github_token,
)
from .models import Sheet, SheetRepo, Sprint, SprintRepo
from .serializers import (
    SheetCreateSerializer,
    SheetDetailSerializer,
    SheetListSerializer,
    SprintCreateSerializer,
    SprintSerializer,
)


@api_view(["GET", "POST"])
def api_sheet_list(request: Request) -> Response:
    if request.method == "GET":
        sheets = Sheet.objects.all()
        return Response(SheetListSerializer(sheets, many=True).data)

    create = SheetCreateSerializer(data=request.data)
    create.is_valid(raise_exception=True)
    sheet = create.save()
    return Response(SheetListSerializer(sheet).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def api_sheet_detail(request: Request, sheet_id: int) -> Response:
    sheet = get_object_or_404(Sheet, pk=sheet_id)
    return Response(SheetDetailSerializer(sheet).data)


@api_view(["POST"])
def api_sprint_create(request: Request, sheet_id: int) -> Response:
    sheet = get_object_or_404(Sheet, pk=sheet_id)
    create = SprintCreateSerializer(data=request.data)
    create.is_valid(raise_exception=True)
    data = create.validated_data
    range_start = data["range_start"]
    range_end = data["range_end"]
    repo_specs = data["repos"]

    resolved_path = resolve_token_path(settings.BASE_DIR, settings.GITHUB_TOKEN_FILE)
    if resolved_path is None:
        return Response(
            {"detail": "GitHub token file is not configured (GITHUB_TOKEN_FILE)."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    read = read_github_token(resolved_path)
    if not read.ok:
        return Response(
            {"detail": read.error},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    assert read.token is not None

    prepared: list[tuple[str, str, str, str, list[dict]]] = []
    for spec in repo_specs:
        owner = spec["owner"]
        name = spec["name"]
        display_name_raw = spec.get("display_name")
        display_name = ""
        if isinstance(display_name_raw, str):
            display_name = display_name_raw.strip()
        if not display_name:
            display_name = f"{owner}/{name}"
        branch_raw = spec.get("default_branch")
        branch = "main"
        if isinstance(branch_raw, str) and branch_raw.strip():
            branch = branch_raw.strip()

        listed = fetch_commits_for_range(read.token, owner, name, branch, range_start, range_end)
        if not listed.ok:
            gh_code = listed.http_status
            if gh_code == 401:
                resp_status = status.HTTP_401_UNAUTHORIZED
            elif gh_code == 403:
                resp_status = status.HTTP_403_FORBIDDEN
            elif gh_code is not None and 500 <= gh_code < 600:
                resp_status = status.HTTP_502_BAD_GATEWAY
            else:
                resp_status = status.HTTP_502_BAD_GATEWAY
            return Response({"detail": listed.error}, status=resp_status)

        commits = listed.commits or []
        prepared.append((owner, name, display_name, branch, commits))

    with transaction.atomic():
        sprint = Sprint.objects.create(
            sheet=sheet,
            range_start=range_start,
            range_end=range_end,
            status=Sprint.Status.DRAFT,
            summary="",
            time_hours=None,
        )
        for owner, name, display_name, _branch, commits in prepared:
            sheet_repo, _ = SheetRepo.objects.get_or_create(
                sheet=sheet,
                owner=owner,
                name=name,
                defaults={"display_name": display_name},
            )
            messages_joined = "\n\n".join(
                c["message"] for c in commits if isinstance(c.get("message"), str) and c["message"]
            )
            SprintRepo.objects.create(
                sheet=sheet,
                sprint=sprint,
                sheet_repo=sheet_repo,
                project=name,
                notes=None,
                commit_messages=messages_joined,
                raw_commits_json=commits,
            )

    sprint = Sprint.objects.prefetch_related("sprint_repos__sheet_repo").get(pk=sprint.pk)
    return Response(SprintSerializer(sprint).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def api_github_token_status(request: Request) -> Response:
    resolved_path = resolve_token_path(settings.BASE_DIR, settings.GITHUB_TOKEN_FILE)
    if resolved_path is None:
        return Response({"phase": "not_configured"})

    read = read_github_token(resolved_path)
    if not read.ok:
        return Response({"phase": "file_error", "file_error": read.error})

    assert read.token is not None
    verified = verify_github_token(read.token)
    if verified.ok:
        return Response({"phase": "success", "login": verified.login, "name": verified.name})

    return Response({"phase": "api_error", "api_error": verified.error})


@api_view(["GET"])
def api_github_repos(request: Request) -> Response:
    """List GitHub repositories for the configured user token (GITHUB_TOKEN_FILE)."""
    resolved_path = resolve_token_path(settings.BASE_DIR, settings.GITHUB_TOKEN_FILE)
    if resolved_path is None:
        return Response(
            {"error": "GitHub token file is not configured (GITHUB_TOKEN_FILE)."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    read = read_github_token(resolved_path)
    if not read.ok:
        return Response(
            {"error": read.error},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    assert read.token is not None
    listed = fetch_github_user_repos(read.token)
    if not listed.ok:
        gh_code = listed.http_status
        if gh_code == 401:
            resp_status = status.HTTP_401_UNAUTHORIZED
        elif gh_code == 403:
            resp_status = status.HTTP_403_FORBIDDEN
        elif gh_code is not None and 500 <= gh_code < 600:
            resp_status = status.HTTP_502_BAD_GATEWAY
        else:
            resp_status = status.HTTP_502_BAD_GATEWAY
        return Response({"error": listed.error}, status=resp_status)

    assert listed.repos is not None
    return Response({"repos": listed.repos})
