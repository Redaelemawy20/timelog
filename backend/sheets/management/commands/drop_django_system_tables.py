from django.core.management.base import BaseCommand
from django.db import connection

SYSTEM_TABLES = [
    "django_session",
    "auth_user_user_permissions",
    "auth_user_groups",
    "auth_group_permissions",
    "auth_permission",
    "auth_group",
    "auth_user",
    "django_content_type",
]

SYSTEM_APPS = ("auth", "contenttypes", "sessions", "admin")


class Command(BaseCommand):
    help = "Drop Django auth, session, and contenttype tables (not used by this app)."

    def handle(self, *args, **options):
        vendor = connection.vendor
        with connection.cursor() as cursor:
            for table in SYSTEM_TABLES:
                if vendor == "postgresql":
                    cursor.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE')
                else:
                    cursor.execute(f"DROP TABLE IF EXISTS {table}")

            cursor.execute(
                "DELETE FROM django_migrations WHERE app IN (%s, %s, %s, %s)",
                SYSTEM_APPS,
            )

        self.stdout.write(self.style.SUCCESS("Removed Django system tables."))
