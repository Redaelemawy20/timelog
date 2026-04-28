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


class Sprint(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SAVED = "saved", "Saved"

    sheet = models.ForeignKey(Sheet, on_delete=models.CASCADE, related_name="sprints")
    range_start = models.DateField()
    range_end = models.DateField()
    summary = models.TextField(blank=True)
    time_hours = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.DRAFT,
        blank=True,
    )

    class Meta:
        db_table = "sprints"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["sheet"]),
        ]

    def __str__(self) -> str:
        return f"{self.sheet_id} {self.range_start}–{self.range_end}"


class SprintRepo(models.Model):
    sheet = models.ForeignKey(Sheet, on_delete=models.CASCADE, related_name="sprint_repos")
    sprint = models.ForeignKey(
        Sprint,
        on_delete=models.CASCADE,
        related_name="sprint_repos",
    )
    sheet_repo = models.ForeignKey(
        SheetRepo,
        on_delete=models.PROTECT,
        related_name="sprint_repos",
    )
    project = models.CharField(max_length=255)
    notes = models.TextField(blank=True, null=True)
    commit_messages = models.TextField(blank=True)
    raw_commits_json = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sprint_repos"
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["sprint", "sheet_repo"],
                name="unique_sprint_sheet_repo",
            ),
        ]
        indexes = [
            models.Index(fields=["sheet"]),
            models.Index(fields=["sprint"]),
            models.Index(fields=["sheet_repo"]),
        ]

    def __str__(self) -> str:
        return f"{self.project} ({self.sprint_id})"
