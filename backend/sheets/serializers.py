from rest_framework import serializers

from .models import LogEntry, LogEntryRun, Sheet, SheetRepo

MAX_REPOS_PER_LOG_ENTRY_RUN = 3


class SheetRepoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SheetRepo
        fields = ["id", "owner", "name", "display_name"]


class LogEntrySerializer(serializers.ModelSerializer):
    repo = SheetRepoSerializer(source="sheet_repo")

    class Meta:
        model = LogEntry
        fields = [
            "id",
            "repo",
            "period_start",
            "period_end",
            "task",
            "time_hours",
            "project",
            "notes",
            "commit_messages",
            "created_at",
            "updated_at",
        ]


class LogEntryRunSerializer(serializers.ModelSerializer):
    log_entries = LogEntrySerializer(many=True, read_only=True)

    class Meta:
        model = LogEntryRun
        fields = ["id", "range_start", "range_end", "status", "created_at", "log_entries"]


class SheetListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sheet
        fields = ["id", "name", "created_at", "updated_at"]


class SheetCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sheet
        fields = ["name"]

    def validate_name(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Name is required.")
        return cleaned


class SheetDetailSerializer(serializers.ModelSerializer):
    repos = SheetRepoSerializer(many=True, read_only=True)
    log_entry_runs = LogEntryRunSerializer(many=True, read_only=True)

    class Meta:
        model = Sheet
        fields = ["id", "name", "created_at", "updated_at", "repos", "log_entry_runs"]


class RepoRefSerializer(serializers.Serializer):
    owner = serializers.CharField(max_length=255)
    name = serializers.CharField(max_length=255)
    display_name = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    default_branch = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    def validate_owner(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Owner is required.")
        return cleaned

    def validate_name(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Repository name is required.")
        return cleaned


class LogEntryRunCreateSerializer(serializers.Serializer):
    range_start = serializers.DateField()
    range_end = serializers.DateField()
    repos = RepoRefSerializer(many=True)

    def validate(self, attrs: dict) -> dict:
        start = attrs["range_start"]
        end = attrs["range_end"]
        if start > end:
            raise serializers.ValidationError(
                {"range_end": "End date must be on or after start date."}
            )
        repos = attrs.get("repos") or []
        if len(repos) < 1:
            raise serializers.ValidationError({"repos": "Select at least one repository."})
        if len(repos) > MAX_REPOS_PER_LOG_ENTRY_RUN:
            raise serializers.ValidationError(
                {
                    "repos": f"You can select at most {MAX_REPOS_PER_LOG_ENTRY_RUN} repositories."
                }
            )
        return attrs
