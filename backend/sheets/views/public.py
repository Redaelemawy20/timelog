from django.http import FileResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from ..models import Sheet
from ..services.snapshot_export import build_snapshot_export


def _public_sheet(token: str) -> Sheet | None:
    try:
        sheet = Sheet.objects.get(share_token=token, is_published=True)
        return sheet
    except Sheet.DoesNotExist:
        return None


@api_view(["GET"])
@permission_classes([AllowAny])
def api_public_sheet(request: Request, token: str) -> Response:
    sheet = _public_sheet(token)
    if sheet is None:
        return Response({"detail": "Not found."}, status=404)
    return Response(sheet.published_snapshot)


@api_view(["GET"])
@permission_classes([AllowAny])
def api_public_sheet_export_excel(request: Request, token: str) -> FileResponse | Response:
    sheet = _public_sheet(token)
    if sheet is None:
        return Response({"detail": "Not found."}, status=404)
    if not sheet.published_snapshot:
        return Response({"detail": "No snapshot available."}, status=404)
    buffer, filename = build_snapshot_export(sheet.published_snapshot)
    return FileResponse(
        buffer,
        as_attachment=True,
        filename=filename,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
