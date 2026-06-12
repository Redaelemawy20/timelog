from rest_framework import status


def http_status_for_github_code(gh_code: int | None) -> int:
    if gh_code == 401:
        return status.HTTP_401_UNAUTHORIZED
    if gh_code == 403:
        return status.HTTP_403_FORBIDDEN
    if gh_code is not None and 500 <= gh_code < 600:
        return status.HTTP_502_BAD_GATEWAY
    return status.HTTP_502_BAD_GATEWAY
