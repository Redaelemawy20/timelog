from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Export app data from db.sqlite3 into a JSON seed fixture."

    def add_arguments(self, parser):
        parser.add_argument(
            "-o",
            "--output",
            default="",
            help="Output path (default: backend/fixtures/time_log_seed.json)",
        )

    def handle(self, *args, **options):
        alias = self._sqlite_alias()
        sqlite_path = settings.DATABASES[alias]["NAME"]
        if not Path(sqlite_path).exists():
            raise CommandError(f"SQLite file not found: {sqlite_path}")

        output = options["output"] or str(settings.BASE_DIR / "fixtures" / "time_log_seed.json")
        output_path = Path(output)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with output_path.open("w", encoding="utf-8") as handle:
            call_command(
                "dumpdata",
                "sheets",
                database=alias,
                indent=2,
                stdout=handle,
            )

        self.stdout.write(self.style.SUCCESS(f"Seed written to {output_path}"))

    def _sqlite_alias(self) -> str:
        if "sqlite" in settings.DATABASES:
            return "sqlite"
        engine = settings.DATABASES["default"]["ENGINE"]
        if "sqlite" in engine:
            return "default"
        raise CommandError(
            "No SQLite database configured. Remove DATABASE_URL from .env to export from db.sqlite3."
        )
