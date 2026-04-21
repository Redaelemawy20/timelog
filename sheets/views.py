from django.http import HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404, render

from .models import Sheet


def sheet_list(request: HttpRequest) -> HttpResponse:
    sheets = Sheet.objects.all()
    return render(request, "sheets/list.html", {"sheets": sheets})


def sheet_detail(request: HttpRequest, sheet_id: int) -> HttpResponse:
    sheet = get_object_or_404(Sheet, pk=sheet_id)
    return render(request, "sheets/detail.html", {"sheet": sheet})
