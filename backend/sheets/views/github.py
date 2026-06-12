from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from ..github_token import fetch_github_user_repos, read_github_token, verify_github_token
from ..services.github_http import http_status_for_github_code


@api_view(["GET"])
def api_github_token_status(request: Request) -> Response:
    read = read_github_token()
    if not read.ok:
        if "not configured" in (read.error or "").lower():
            return Response({"phase": "not_configured"})
        return Response({"phase": "file_error", "file_error": read.error})

    assert read.token is not None
    verified = verify_github_token(read.token)
    if verified.ok:
        return Response({"phase": "success", "login": verified.login, "name": verified.name})

    return Response({"phase": "api_error", "api_error": verified.error})


@api_view(["GET"])
def api_github_repos(request: Request) -> Response:
    read = read_github_token()
    if not read.ok:
        return Response(
            {"error": read.error},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    assert read.token is not None
    listed = fetch_github_user_repos(read.token)
    if not listed.ok:
        return Response(
            {"error": listed.error},
            status=http_status_for_github_code(listed.http_status),
        )

    assert listed.repos is not None
    return Response({"repos": listed.repos})
