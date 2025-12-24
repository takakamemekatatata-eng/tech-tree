from django.contrib.postgres.fields import ArrayField
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Node(models.Model):
    NODE_TYPE_CHOICES = (
        ('technology', 'Technology'),
    )

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=150, unique=True)
    node_type = models.CharField(max_length=50, choices=NODE_TYPE_CHOICES, default='technology')
    category = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True, default='')
    tags = ArrayField(models.CharField(max_length=50), default=list, blank=True)

    class Meta:
        managed = False
        db_table = 'nodes'

    def __str__(self):
        return self.name


class Relation(models.Model):
    RELATION_TYPE_CHOICES = (
        ('prerequisite', 'Prerequisite'),
        ('used_with', 'Used With'),
        ('alternative', 'Alternative'),
        ('related', 'Related'),
        ('built_on', 'Built On'),
    )

    id = models.BigAutoField(primary_key=True)
    from_node = models.ForeignKey(
        Node, on_delete=models.CASCADE, related_name='outgoing_relations'
    )
    to_node = models.ForeignKey(
        Node, on_delete=models.CASCADE, related_name='incoming_relations'
    )
    relation_type = models.CharField(max_length=50, choices=RELATION_TYPE_CHOICES)
    strength = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(1.0)], default=0.5)
    context = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'relations'

    def __str__(self):
        return f"{self.from_node} -> {self.to_node} ({self.relation_type})"
