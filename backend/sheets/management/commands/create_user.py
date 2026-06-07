from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create a dashboard user account."

    def add_arguments(self, parser):
        parser.add_argument("username", type=str)
        parser.add_argument("password", type=str)

    def handle(self, *args, **options):
        username = options["username"].strip()
        password = options["password"]
        if not username:
            raise CommandError("Username is required.")
        if not password:
            raise CommandError("Password is required.")

        User = get_user_model()
        if User.objects.filter(username=username).exists():
            raise CommandError(f'User "{username}" already exists.')

        User.objects.create_user(username=username, password=password)
        self.stdout.write(self.style.SUCCESS(f'Created user "{username}".'))
