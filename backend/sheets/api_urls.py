from django.urls import path

from . import views

urlpatterns = [
    path("sheets/", views.api_sheet_list, name="api_sheet_list"),
    path("sheets/<int:sheet_id>/", views.api_sheet_detail, name="api_sheet_detail"),
    path("github/token-status/", views.api_github_token_status, name="api_github_token_status"),
    path("github/repos/", views.api_github_repos, name="api_github_repos"),
]
