from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("sheets", "0005_remove_sprint_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="client",
            name="remaining_hours",
            field=models.DecimalField(max_digits=8, decimal_places=2, default=0),
        ),
        migrations.AddField(
            model_name="sheet",
            name="include_previous_hours",
            field=models.BooleanField(default=True),
        ),
    ]
