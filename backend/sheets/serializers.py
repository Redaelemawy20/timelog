from django.db import models
from rest_framework import serializers

from .models import Client, Sheet, SheetRepo, Sprint, SprintConversationMessage, SprintRepo

MAX_REPOS_PER_SPRINT = 3


class ClientSerializer(serializers.ModelSerializer):
    sheet_count = serializers.SerializerMethodField()
    total_worked_hours = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = ["id", "name", "remaining_hours", "total_worked_hours", "sheet_count", "created_at", "updated_at"]

    def get_sheet_count(self, obj: Client) -> int:
        annotated = getattr(obj, "sheet_count", None)
        if annotated is not None:
            return annotated
        return obj.sheets.count()

    def get_total_worked_hours(self, obj: Client) -> float:
        annotated = getattr(obj, "_total_worked_hours", None)
        if annotated is not None:
            return float(annotated) if annotated else 0.0
        from .models import Sprint
        return float(
            Sprint.objects.filter(sheet__client=obj).aggregate(total=models.Sum("time_hours"))["total"] or 0
        )


class ClientCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ["name", "remaining_hours"]
        extra_kwargs = {"remaining_hours": {"required": False}}

    def validate_name(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Name is required.")
        return cleaned


class ClientUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ["name", "remaining_hours"]

    def validate_name(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Name is required.")
        return cleaned


class SheetRepoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SheetRepo
        fields = ["id", "owner", "name", "display_name"]


class SprintRepoSerializer(serializers.ModelSerializer):
    repo = SheetRepoSerializer(source="sheet_repo")

    class Meta:
        model = SprintRepo
        fields = [
            "id",
            "repo",
            "project",
            "notes",
            "commit_messages",
            "raw_commits_json",
            "created_at",
            "updated_at",
        ]


class SprintSerializer(serializers.ModelSerializer):
    sprint_repos = SprintRepoSerializer(many=True, read_only=True)

    class Meta:
        model = Sprint
        fields = [
            "id",
            "range_start",
            "range_end",
            "summary",
            "time_hours",
            "created_at",
            "sprint_repos",
        ]


class SheetListSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    total_worked_hours = serializers.SerializerMethodField()

    class Meta:
        model = Sheet
        fields = ["id", "name", "client", "include_previous_hours", "total_worked_hours", "created_at", "updated_at"]

    def get_total_worked_hours(self, obj: Sheet) -> float:
        annotated = getattr(obj, "_total_worked_hours", None)
        if annotated is not None:
            return float(annotated) if annotated else 0.0
        return float(obj.sprints.aggregate(total=models.Sum("time_hours"))["total"] or 0)


class SheetCreateSerializer(serializers.ModelSerializer):
    client_id = serializers.PrimaryKeyRelatedField(
        source="client",
        queryset=Client.objects.all(),
    )

    class Meta:
        model = Sheet
        fields = ["name", "client_id"]

    def validate_name(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Name is required.")
        return cleaned


class SheetUpdateSerializer(serializers.ModelSerializer):
    client_id = serializers.PrimaryKeyRelatedField(
        source="client",
        queryset=Client.objects.all(),
        required=False,
    )

    class Meta:
        model = Sheet
        fields = ["name", "client_id", "include_previous_hours"]

    def validate_name(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Name is required.")
        return cleaned

    def validate(self, attrs: dict) -> dict:
        if not attrs and not self.partial:
            raise serializers.ValidationError("Provide at least one field to update.")
        return attrs


class SheetDetailSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    repos = SheetRepoSerializer(many=True, read_only=True)
    sprints = SprintSerializer(many=True, read_only=True)
    total_worked_hours = serializers.SerializerMethodField()

    class Meta:
        model = Sheet
        fields = [
            "id", "name", "client", "include_previous_hours", "total_worked_hours", "created_at", "updated_at",
            "repos", "sprints",
            "share_token", "is_published", "published_at", "published_snapshot",
        ]

    def get_total_worked_hours(self, obj: Sheet) -> float:
        return float(obj.sprints.aggregate(total=models.Sum("time_hours"))["total"] or 0)


class RepoRefSerializer(serializers.Serializer):
    owner = serializers.CharField(max_length=255)
    name = serializers.CharField(max_length=255)
    display_name = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    branches = serializers.ListField(
        child=serializers.CharField(max_length=255, allow_blank=False),
        required=False,
        allow_empty=False,
    )
    branch = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        allow_null=True,
    )
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

    def validate(self, attrs: dict) -> dict:
        branches_raw = attrs.get("branches")
        if isinstance(branches_raw, list):
            cleaned: list[str] = []
            seen: set[str] = set()
            for branch in branches_raw:
                name = branch.strip()
                if not name or name in seen:
                    continue
                seen.add(name)
                cleaned.append(name)
            if not cleaned:
                raise serializers.ValidationError({"branches": "Select at least one branch."})
            attrs["branches"] = cleaned
            return attrs

        for key in ("branch", "default_branch"):
            branch_raw = attrs.get(key)
            if isinstance(branch_raw, str) and branch_raw.strip():
                attrs["branches"] = [branch_raw.strip()]
                return attrs

        attrs["branches"] = ["main"]
        return attrs


class SprintCreateSerializer(serializers.Serializer):
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
        if len(repos) > MAX_REPOS_PER_SPRINT:
            raise serializers.ValidationError(
                {
                    "repos": f"You can select at most {MAX_REPOS_PER_SPRINT} repositories."
                }
            )
        return attrs


class SprintUpdateSerializer(serializers.Serializer):
    summary = serializers.CharField(required=False, allow_blank=True)
    time_hours = serializers.DecimalField(
        max_digits=8,
        decimal_places=2,
        required=False,
        allow_null=True,
        min_value=0,
    )

    def validate_summary(self, value: str) -> str:
        return value.strip()

    def validate(self, attrs: dict) -> dict:
        if "summary" not in attrs and "time_hours" not in attrs:
            raise serializers.ValidationError("Provide at least one field to update.")
        return attrs


class SprintConversationMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SprintConversationMessage
        fields = ["id", "role", "content", "created_at"]


class SprintConversationSendSerializer(serializers.Serializer):
    content = serializers.CharField(required=False, allow_blank=True, default="")
    init = serializers.BooleanField(required=False, default=False)

    def validate_content(self, value: str) -> str:
        return value.strip()
