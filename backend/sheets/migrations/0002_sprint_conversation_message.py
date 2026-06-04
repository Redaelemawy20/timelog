from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("sheets", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="SprintConversationMessage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "role",
                    models.CharField(
                        choices=[("user", "User"), ("assistant", "Assistant")],
                        max_length=16,
                    ),
                ),
                ("content", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "sprint",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="conversation_messages",
                        to="sheets.sprint",
                    ),
                ),
            ],
            options={
                "db_table": "sprint_conversation_messages",
                "ordering": ["created_at"],
                "indexes": [
                    models.Index(fields=["sprint", "created_at"], name="sprint_conv_sprint__a1b2c3_idx"),
                ],
            },
        ),
    ]
