from rest_framework import serializers
from .models import Skill, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'color']


class SkillSerializer(serializers.ModelSerializer):
    parent_id = serializers.IntegerField(source='parent.id', read_only=True)
    parent = serializers.PrimaryKeyRelatedField(queryset=Skill.objects.all(), required=False, allow_null=True, write_only=True)
    category = serializers.SlugRelatedField(slug_field='name', queryset=Category.objects.all(), required=False, allow_null=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True)
    category_color = serializers.SerializerMethodField(read_only=True)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    user_comment = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = Skill
        fields = ['id', 'name', 'category', 'category_id', 'category_color', 'level', 'description', 'user_comment', 'parent_id', 'parent']

    def get_category_color(self, obj):
        return getattr(obj.category, 'color', None)

    def validate_level(self, value):
        if value is None or value < 0 or value > 5:
            raise serializers.ValidationError('level must be an integer between 0 and 5')
        return value

    def create(self, validated_data):
        parent = validated_data.pop('parent', None)
        return Skill.objects.create(parent=parent, **validated_data)

    def update(self, instance, validated_data):
        parent_supplied = 'parent' in validated_data
        parent = validated_data.pop('parent', None)
        if parent_supplied:
            instance.parent = parent
        for field in ['name', 'category', 'level', 'description', 'user_comment']:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        instance.save()
        return instance
