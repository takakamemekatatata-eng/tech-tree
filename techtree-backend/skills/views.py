from rest_framework import viewsets, mixins, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Skill, Category
from .serializers import SkillSerializer, CategorySerializer


class SkillViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoint for skills.
    """

    queryset = Skill.objects.all().order_by('id')
    serializer_class = SkillSerializer
    permission_classes = [AllowAny]

    def partial_update(self, request, *args, **kwargs):
        """
        Allow partial update but restrict level to 0-5.
        """
        data = request.data or {}
        if 'level' in data:
            try:
                level = int(data['level'])
            except Exception:
                return Response({'level': ['Must be an integer.']}, status=status.HTTP_400_BAD_REQUEST)
            if level < 0 or level > 5:
                return Response({'level': ['Must be between 0 and 5.']}, status=status.HTTP_400_BAD_REQUEST)
        return super().partial_update(request, *args, **kwargs)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('id')
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field = 'id'
