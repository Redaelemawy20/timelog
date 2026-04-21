from django.contrib import admin
from django.urls import include, path

from . import views


urlpatterns = [
    path("admin/", admin.site.urls),
    path("status/github-token/", views.github_token_status, name="github_token_status"),
    path("sheets/", include("sheets.urls")),
]
