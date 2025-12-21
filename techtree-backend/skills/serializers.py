from rest_framework import serializers
from .models import Skill

class SkillSerializer(serializers.ModelSerializer):
    parent_id = serializers.IntegerField(source='parent.id', read_only=True)

    class Meta:
        model = Skill
        fields = ['id', 'name', 'category', 'level', 'description', 'user_comment', 'parent_id']

    def validate_level(self, value):
        if value is None or value < 0:
            raise serializers.ValidationError('level must be an integer >= 0')
        return value
