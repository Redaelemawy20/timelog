from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from ..github_token import read_github_token
from ..llm_summary import (
    INITIAL_USER_MESSAGE,
    SummaryGenerationConfigError,
    SummaryGenerationUpstreamError,
    generate_conversation_reply,
)
from ..models import Sheet, Sprint, SprintConversationMessage
from ..serializers import (
    SprintConversationMessageSerializer,
    SprintConversationSendSerializer,
    SprintCreateSerializer,
    SprintSerializer,
    SprintUpdateSerializer,
)
from ..services.sprint_create import create_sprint


@api_view(["POST"])
def api_sprint_create(request: Request, sheet_id: int) -> Response:
    sheet = get_object_or_404(Sheet, pk=sheet_id)
    create = SprintCreateSerializer(data=request.data)
    create.is_valid(raise_exception=True)
    data = create.validated_data

    read = read_github_token()
    if not read.ok:
        return Response(
            {"detail": read.error},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    assert read.token is not None

    result = create_sprint(
        sheet,
        data["range_start"],
        data["range_end"],
        data["repos"],
        read.token,
    )
    if not result.ok:
        return Response({"detail": result.error_detail}, status=result.error_status)
    return Response(SprintSerializer(result.sprint).data, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
def api_sprint_update(request: Request, sheet_id: int, sprint_id: int) -> Response:
    sprint = get_object_or_404(Sprint, pk=sprint_id, sheet_id=sheet_id)

    if request.method == "DELETE":
        sprint.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    update = SprintUpdateSerializer(data=request.data)
    update.is_valid(raise_exception=True)
    changed_fields: list[str] = []
    if "summary" in update.validated_data:
        sprint.summary = update.validated_data["summary"]
        changed_fields.append("summary")
    if "time_hours" in update.validated_data:
        sprint.time_hours = update.validated_data["time_hours"]
        changed_fields.append("time_hours")
    sprint.save(update_fields=changed_fields)
    return Response(SprintSerializer(sprint).data)


def _sprint_with_repos(sprint_id: int) -> Sprint:
    return get_object_or_404(
        Sprint.objects.prefetch_related("sprint_repos__sheet_repo"),
        pk=sprint_id,
    )


def _conversation_messages(sprint: Sprint) -> list[SprintConversationMessage]:
    return list(sprint.conversation_messages.order_by("created_at"))


def _conversation_error_response(exc: Exception) -> Response:
    if isinstance(exc, SummaryGenerationConfigError):
        return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    if isinstance(exc, SummaryGenerationUpstreamError):
        return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
    raise exc


@api_view(["GET", "POST"])
def api_sprint_conversation(request: Request, sprint_id: int) -> Response:
    sprint = _sprint_with_repos(sprint_id)

    if request.method == "GET":
        messages = _conversation_messages(sprint)
        return Response(SprintConversationMessageSerializer(messages, many=True).data)

    send = SprintConversationSendSerializer(data=request.data)
    send.is_valid(raise_exception=True)
    content = send.validated_data["content"]
    init = send.validated_data["init"]
    existing = _conversation_messages(sprint)

    if init or (not existing and not content):
        user_content = INITIAL_USER_MESSAGE
    elif content:
        user_content = content
    else:
        return Response(
            {"detail": "Message content is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user_message = SprintConversationMessage.objects.create(
        sprint=sprint,
        role=SprintConversationMessage.Role.USER,
        content=user_content,
    )
    history = existing + [user_message]

    try:
        reply = generate_conversation_reply(sprint, history)
    except (SummaryGenerationConfigError, SummaryGenerationUpstreamError) as exc:
        user_message.delete()
        return _conversation_error_response(exc)

    assistant_message = SprintConversationMessage.objects.create(
        sprint=sprint,
        role=SprintConversationMessage.Role.ASSISTANT,
        content=reply,
    )
    return Response(
        SprintConversationMessageSerializer([user_message, assistant_message], many=True).data,
        status=status.HTTP_201_CREATED,
    )
