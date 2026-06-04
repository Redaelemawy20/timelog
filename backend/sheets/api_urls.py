from django.urls import path

from . import views

urlpatterns = [
    path("sheets/", views.api_sheet_list, name="api_sheet_list"),
    path(
        "sheets/<int:sheet_id>/sprints/",
        views.api_sprint_create,
        name="api_sprint_create",
    ),
    path(
        "sheets/<int:sheet_id>/sprints/<int:sprint_id>/",
        views.api_sprint_update,
        name="api_sprint_update",
    ),
    path(
        "sprints/<int:sprint_id>/conversation/",
        views.api_sprint_conversation,
        name="api_sprint_conversation",
    ),
    path("sheets/<int:sheet_id>/", views.api_sheet_detail, name="api_sheet_detail"),
    path(
        "sheets/<int:sheet_id>/export/",
        views.api_sheet_export_excel,
        name="api_sheet_export_excel",
    ),
    path("github/token-status/", views.api_github_token_status, name="api_github_token_status"),
    path("github/repos/", views.api_github_repos, name="api_github_repos"),
]
