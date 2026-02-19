"""
Views for $${name_snake}.

Add your DRF viewsets and views here.
"""

from __future__ import annotations

from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

# Example viewset - replace with your own viewsets
# from $${name_snake}.$${name_snake}_app.models import Item
# from $${name_snake}.$${name_snake}_app.serializers import ItemSerializer
#
#
# class ItemViewSet(viewsets.ModelViewSet):
#     """ViewSet for Item model."""
#
#     queryset = Item.objects.all()
#     serializer_class = ItemSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint."""
    return Response({"status": "ok"}, status=status.HTTP_200_OK)
