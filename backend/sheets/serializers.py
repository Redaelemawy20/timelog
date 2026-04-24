from rest_framework import serializers

from .models import LogEntry, LogEntryRun, Sheet, SheetRepo


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
