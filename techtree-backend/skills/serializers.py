from rest_framework import serializers
from .models import Node, Relation


class NodeSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField(), allow_empty=True, required=False)

    class Meta:
        model = Node
        fields = ['id', 'name', 'node_type', 'category', 'description', 'tags']


class RelationSerializer(serializers.ModelSerializer):
    from_node_id = serializers.PrimaryKeyRelatedField(source='from_node', queryset=Node.objects.all())
    to_node_id = serializers.PrimaryKeyRelatedField(source='to_node', queryset=Node.objects.all())

    class Meta:
        model = Relation
        fields = ['id', 'from_node_id', 'to_node_id', 'relation_type', 'strength', 'context']
