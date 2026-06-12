from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from ..models import Client, Sheet, Sprint


@api_view(["GET"])
@permission_classes([AllowAny])
def api_health(request: Request) -> Response:
    return Response({"status": "ok"})


@api_view(["GET"])
def api_auth_me(request: Request) -> Response:
    return Response({"username": request.user.username})


@api_view(["GET"])
def api_dashboard_stats(request: Request) -> Response:
    return Response(
        {
            "client_count": Client.objects.count(),
            "sheet_count": Sheet.objects.count(),
            "sprint_count": Sprint.objects.count(),
        }
    )
