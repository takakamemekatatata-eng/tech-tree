from django.contrib import admin
from .models import Node, Relation


@admin.register(Node)
class NodeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'node_type', 'category', 'level')
    search_fields = ('name', 'category', 'description')


@admin.register(Relation)
class RelationAdmin(admin.ModelAdmin):
    list_display = ('id', 'from_node', 'to_node', 'relation_type', 'strength')
    list_filter = ('relation_type',)
    search_fields = ('from_node__name', 'to_node__name')
