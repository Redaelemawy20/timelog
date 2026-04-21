from django.http import Http404, HttpRequest, HttpResponse
from django.shortcuts import render


DUMMY_SHEETS = [
    {"id": 1, "name": "My First Sheet"},
]


def sheet_list(request: HttpRequest) -> HttpResponse:
    return render(request, "sheets/list.html", {"sheets": DUMMY_SHEETS})


def sheet_detail(request: HttpRequest, sheet_id: int) -> HttpResponse:
    sheet = next((item for item in DUMMY_SHEETS if item["id"] == sheet_id), None)
    if not sheet:
        raise Http404("Sheet not found")
    return render(request, "sheets/detail.html", {"sheet": sheet})
