from django.db.models import Count, Sum
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from ..models import Client
from ..serializers import ClientCreateSerializer, ClientSerializer, ClientUpdateSerializer


@api_view(["GET", "POST"])
def api_client_list(request: Request) -> Response:
    if request.method == "GET":
        clients = Client.objects.annotate(
            sheet_count=Count("sheets", distinct=True),
            _total_worked_hours=Sum("sheets__sprints__time_hours"),
        ).all()
        return Response(ClientSerializer(clients, many=True).data)

    create = ClientCreateSerializer(data=request.data)
    create.is_valid(raise_exception=True)
    client = create.save()
    return Response(ClientSerializer(client).data, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
def api_client_detail(request: Request, client_id: int) -> Response:
    client = get_object_or_404(Client, pk=client_id)

    if request.method == "DELETE":
        if client.sheets.exists():
            return Response(
                {"detail": "Remove or reassign sheets before deleting this client."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        client.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    update = ClientUpdateSerializer(client, data=request.data, partial=True)
    update.is_valid(raise_exception=True)
    client = update.save()
    return Response(ClientSerializer(client).data)
