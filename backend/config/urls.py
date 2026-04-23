from django.urls import include, path


urlpatterns = [
    path("api/", include("sheets.api_urls")),
]
