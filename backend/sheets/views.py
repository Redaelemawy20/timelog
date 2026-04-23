from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

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
