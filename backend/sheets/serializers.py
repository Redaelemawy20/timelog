from rest_framework import serializers

from .models import Sheet, SheetRepo, Sprint, SprintConversationMessage, SprintRepo

MAX_REPOS_PER_SPRINT = 3


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
            "status",
            "summary",
            "time_hours",
            "created_at",
            "sprint_repos",
        ]


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
    sprints = SprintSerializer(many=True, read_only=True)

    class Meta:
        model = Sheet
        fields = ["id", "name", "created_at", "updated_at", "repos", "sprints"]


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
