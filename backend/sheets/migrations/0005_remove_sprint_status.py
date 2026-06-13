from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("sheets", "0004_sheet_share_fields"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="sprint",
            name="status",
        ),
    ]
