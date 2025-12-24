from rest_framework import serializers
from .models import Node, Relation


class NodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Node
        fields = ['id', 'name', 'node_type', 'category', 'description', 'level']


class RelationSerializer(serializers.ModelSerializer):
    from_node_id = serializers.PrimaryKeyRelatedField(source='from_node', queryset=Node.objects.all())
    to_node_id = serializers.PrimaryKeyRelatedField(source='to_node', queryset=Node.objects.all())

    class Meta:
        model = Relation
        fields = ['id', 'from_node_id', 'to_node_id', 'relation_type', 'strength']
