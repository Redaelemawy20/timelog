from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from ..models import Sheet
from ..serializers import (
    SheetCreateSerializer,
    SheetDetailSerializer,
    SheetListSerializer,
    SheetUpdateSerializer,
)
from ..services.excel_export import build_sheet_export


@api_view(["GET", "POST"])
def api_sheet_list(request: Request) -> Response:
    if request.method == "GET":
        sheets = Sheet.objects.select_related("client").all()
        return Response(SheetListSerializer(sheets, many=True).data)

    create = SheetCreateSerializer(data=request.data)
    create.is_valid(raise_exception=True)
    sheet = create.save()
    return Response(SheetListSerializer(sheet).data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
def api_sheet_detail(request: Request, sheet_id: int) -> Response:
    sheet = get_object_or_404(Sheet.objects.select_related("client"), pk=sheet_id)

    if request.method == "GET":
        return Response(SheetDetailSerializer(sheet).data)

    if request.method == "DELETE":
        sheet.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    update = SheetUpdateSerializer(sheet, data=request.data, partial=True)
    update.is_valid(raise_exception=True)
    sheet = update.save()
    sheet = Sheet.objects.select_related("client").get(pk=sheet.pk)
    return Response(SheetListSerializer(sheet).data)


@api_view(["GET"])
def api_sheet_export_excel(request: Request, sheet_id: int) -> FileResponse:
    sheet = get_object_or_404(Sheet, pk=sheet_id)
    buffer, filename = build_sheet_export(sheet)
    return FileResponse(
        buffer,
        as_attachment=True,
        filename=filename,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
