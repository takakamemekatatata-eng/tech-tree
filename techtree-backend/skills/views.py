from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import Node, Relation
from .serializers import NodeSerializer, RelationSerializer


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
        context = self.request.query_params.get('context')

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
        if context:
            queryset = queryset.filter(context=context)
        return queryset
