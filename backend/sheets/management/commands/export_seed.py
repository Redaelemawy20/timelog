from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Export app data from the database into a JSON seed fixture."

    def add_arguments(self, parser):
        parser.add_argument(
            "-o",
            "--output",
            default="",
            help="Output path (default: backend/fixtures/time_log_seed.json)",
        )

    def handle(self, *args, **options):
        output = options["output"] or str(settings.BASE_DIR / "fixtures" / "time_log_seed.json")
        output_path = Path(output)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with output_path.open("w", encoding="utf-8") as handle:
            call_command("dumpdata", "sheets", indent=2, stdout=handle)

        self.stdout.write(self.style.SUCCESS(f"Seed written to {output_path}"))
