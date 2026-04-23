from django.db import models


class Sheet(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sheets"
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return self.name


class SheetRepo(models.Model):
    sheet = models.ForeignKey(Sheet, on_delete=models.CASCADE, related_name="repos")
    owner = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    display_name = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = "sheet_repos"
        constraints = [
            models.UniqueConstraint(
                fields=["sheet", "owner", "name"],
                name="unique_sheet_owner_name",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.owner}/{self.name}"


class LogEntryRun(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SAVED = "saved", "Saved"

    sheet = models.ForeignKey(Sheet, on_delete=models.CASCADE, related_name="log_entry_runs")
    range_start = models.DateField()
    range_end = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.DRAFT,
        blank=True,
    )

    class Meta:
        db_table = "log_entry_runs"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.sheet_id} {self.range_start}–{self.range_end}"


class LogEntry(models.Model):
    sheet = models.ForeignKey(Sheet, on_delete=models.CASCADE, related_name="log_entries")
    run = models.ForeignKey(
        LogEntryRun,
        on_delete=models.CASCADE,
        related_name="log_entries",
        null=True,
        blank=True,
    )
    sheet_repo = models.ForeignKey(
        SheetRepo,
        on_delete=models.PROTECT,
        related_name="log_entries",
    )
    period_start = models.DateField()
    period_end = models.DateField()
    task = models.CharField(max_length=512, blank=True)
    time_hours = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    project = models.CharField(max_length=255)
    notes = models.TextField(blank=True, null=True)
    commit_messages = models.TextField(blank=True)
    raw_commits_json = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "log_entries"
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["run", "sheet_repo"],
                condition=models.Q(run__isnull=False),
                name="unique_run_sheet_repo",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.project} ({self.period_start})"
