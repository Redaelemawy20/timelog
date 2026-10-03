from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("sheets", "0006_client_remaining_hours_sheet_include_previous")]

    operations = [
        migrations.AddField(
            model_name="client",
            name="sheet_naming_pattern",
            field=models.CharField(
                choices=[("manual", "Manual"), ("month", "Current month"), ("client_date", "Client name and date")],
                default="manual",
                max_length=16,
            ),
        ),
    ]
