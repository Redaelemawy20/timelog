import os
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

import dj_database_url
from django.core.exceptions import ImproperlyConfigured


def _sanitize_database_url(url: str) -> str:
    parsed = urlparse(url)
    query = parse_qs(parsed.query, keep_blank_values=True)
    query.pop("pgbouncer", None)
    return urlunparse(parsed._replace(query=urlencode(query, doseq=True)))


def build_databases(base_dir: Path) -> dict:
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url or "[" in database_url:
        raise ImproperlyConfigured(
            "Set DATABASE_URL in backend/.env to your Supabase PostgreSQL connection string."
        )

    postgres = dj_database_url.parse(
        _sanitize_database_url(database_url),
        conn_max_age=600,
        ssl_require=True,
    )
    postgres.setdefault("OPTIONS", {})
    postgres["OPTIONS"]["sslmode"] = "require"
    return {"default": postgres}
