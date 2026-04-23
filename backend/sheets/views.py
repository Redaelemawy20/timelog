from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from .github_token import read_github_token, resolve_token_path, verify_github_token
from .models import Sheet
from .serializers import SheetDetailSerializer, SheetListSerializer

@api_view(["GET"])
def api_sheet_list(request: Request) -> Response:
    sheets = Sheet.objects.all()
    return Response(SheetListSerializer(sheets, many=True).data)


@api_view(["GET"])
def api_sheet_detail(request: Request, sheet_id: int) -> Response:
    sheet = get_object_or_404(Sheet, pk=sheet_id)
    return Response(SheetDetailSerializer(sheet).data)


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
