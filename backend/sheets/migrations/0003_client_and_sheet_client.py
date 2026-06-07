from django.db import migrations, models
import django.db.models.deletion


def assign_default_client(apps, schema_editor):
    Client = apps.get_model("sheets", "Client")
    Sheet = apps.get_model("sheets", "Sheet")
    default_client, _ = Client.objects.get_or_create(name="Unassigned")
    Sheet.objects.filter(client__isnull=True).update(client=default_client)


class Migration(migrations.Migration):

    dependencies = [
        ("sheets", "0002_sprint_conversation_message"),
    ]

    operations = [
        migrations.CreateModel(
            name="Client",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "clients",
                "ordering": ["name"],
            },
        ),
        migrations.AddField(
            model_name="sheet",
            name="client",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="sheets",
                to="sheets.client",
            ),
        ),
        migrations.RunPython(assign_default_client, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="sheet",
            name="client",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="sheets",
                to="sheets.client",
            ),
        ),
    ]
