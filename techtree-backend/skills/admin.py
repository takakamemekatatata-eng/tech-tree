from django.contrib import admin
from .models import Node, Relation


@admin.register(Node)
class NodeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'node_type', 'category')
    search_fields = ('name', 'category', 'tags')


@admin.register(Relation)
class RelationAdmin(admin.ModelAdmin):
    list_display = ('id', 'from_node', 'to_node', 'relation_type', 'strength', 'context')
    list_filter = ('relation_type', 'context')
    search_fields = ('from_node__name', 'to_node__name')
