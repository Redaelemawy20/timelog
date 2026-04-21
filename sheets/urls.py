from django.urls import path

from . import views


app_name = "sheets"

urlpatterns = [
    path("", views.sheet_list, name="list"),
    path("<int:sheet_id>/", views.sheet_detail, name="detail"),
]
