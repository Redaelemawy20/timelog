from django.conf import settings
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render

from .github_token import read_github_token, resolve_token_path, verify_github_token


def github_token_status(request: HttpRequest) -> HttpResponse:
    resolved_path = resolve_token_path(settings.BASE_DIR, settings.GITHUB_TOKEN_FILE)
    if resolved_path is None:
        return render(
            request,
            "github_token_status.html",
            {"phase": "not_configured"},
        )

    read = read_github_token(resolved_path)
    if not read.ok:
        return render(
            request,
            "github_token_status.html",
            {
                "phase": "file_error",
                "file_error": read.error,
            },
        )

    assert read.token is not None
    verified = verify_github_token(read.token)
    if verified.ok:
        return render(
            request,
            "github_token_status.html",
            {
                "phase": "success",
                "login": verified.login,
                "name": verified.name,
            },
        )

    return render(
        request,
        "github_token_status.html",
        {
            "phase": "api_error",
            "api_error": verified.error,
        },
    )
