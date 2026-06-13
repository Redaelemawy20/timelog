import uuid

from django.db import migrations, models


def populate_share_tokens(apps, schema_editor):
    Sheet = apps.get_model("sheets", "Sheet")
    for sheet in Sheet.objects.filter(share_token=None):
        sheet.share_token = uuid.uuid4()
        sheet.save(update_fields=["share_token"])


class Migration(migrations.Migration):

    dependencies = [
        ("sheets", "0003_client_and_sheet_client"),
    ]

    operations = [
        migrations.AddField(
            model_name="sheet",
            name="share_token",
            field=models.UUIDField(null=True, editable=False),
        ),
        migrations.RunPython(populate_share_tokens, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="sheet",
            name="share_token",
            field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False),
        ),
        migrations.AddField(
            model_name="sheet",
            name="is_published",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="sheet",
            name="published_at",
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name="sheet",
            name="published_snapshot",
            field=models.JSONField(null=True, blank=True),
        ),
    ]
