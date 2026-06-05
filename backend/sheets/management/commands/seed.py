from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from sheets.models import (
    Sheet,
    SheetRepo,
    Sprint,
    SprintConversationMessage,
    SprintRepo,
)

CLEAR_ORDER = [
    SprintConversationMessage,
    SprintRepo,
    Sprint,
    SheetRepo,
    Sheet,
]

FIXTURE_NAME = "time_log_seed"


class Command(BaseCommand):
    help = "Load time_log_seed.json into the database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Clear existing app rows before loading the seed.",
        )

    def handle(self, *args, **options):
        fixture_dirs = getattr(settings, "FIXTURE_DIRS", [])
        if not fixture_dirs:
            raise CommandError("FIXTURE_DIRS is not configured in settings.")

        if Sheet.objects.exists() and not options["force"]:
            raise CommandError(
                "Database already has data. Re-run with --force to replace it."
            )

        with transaction.atomic():
            if options["force"]:
                for model in CLEAR_ORDER:
                    model.objects.all().delete()

            call_command("loaddata", FIXTURE_NAME, verbosity=0)

        self.stdout.write(self.style.SUCCESS(f"Loaded fixture {FIXTURE_NAME}."))
