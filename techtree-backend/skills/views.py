from django.db import transaction
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import CardSelection, Node, Relation
from .serializers import CardSelectionSerializer, NodeSerializer, RelationSerializer


class NodeViewSet(viewsets.ModelViewSet):
    """CRUD endpoint for technology nodes."""

    queryset = Node.objects.all().order_by('id')
    serializer_class = NodeSerializer
    permission_classes = [AllowAny]


class RelationViewSet(viewsets.ModelViewSet):
    """CRUD endpoint for relations between nodes."""

    queryset = Relation.objects.select_related('from_node', 'to_node').all().order_by('id')
    serializer_class = RelationSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        relation_type = self.request.query_params.get('relation_type')
        min_strength = self.request.query_params.get('min_strength')
        max_strength = self.request.query_params.get('max_strength')

        if relation_type:
            queryset = queryset.filter(relation_type=relation_type)
        if min_strength is not None:
            try:
                queryset = queryset.filter(strength__gte=float(min_strength))
            except ValueError:
                pass
        if max_strength is not None:
            try:
                queryset = queryset.filter(strength__lte=float(max_strength))
            except ValueError:
                pass
        return queryset


class CardSelectionViewSet(viewsets.ModelViewSet):
    queryset = CardSelection.objects.select_related('node').all().order_by('position', 'id')
    serializer_class = CardSelectionSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'], url_path='bulk-save')
    def bulk_save(self, request):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            CardSelection.objects.all().delete()
            instances = [
                CardSelection(node=item['node'], position=item.get('position', idx))
                for idx, item in enumerate(serializer.validated_data)
            ]
            CardSelection.objects.bulk_create(instances)

        return Response(self.get_serializer(CardSelection.objects.order_by('position', 'id'), many=True).data)
