from django.urls import path

from . import views

urlpatterns = [
    path("sheets/", views.api_sheet_list, name="api_sheet_list"),
    path("sheets/<int:sheet_id>/", views.api_sheet_detail, name="api_sheet_detail"),
]
