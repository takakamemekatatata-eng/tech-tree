from rest_framework import viewsets, mixins, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Skill
from .serializers import SkillSerializer


class SkillViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):
    """
    GET    /skills/        -> list skills
    GET    /skills/{id}/   -> retrieve skill
    PATCH  /skills/{id}/   -> update skill (level only)
    """

    queryset = Skill.objects.all().order_by('id')
    serializer_class = SkillSerializer
    permission_classes = [AllowAny]

    def partial_update(self, request, *args, **kwargs):
        """
        Only allow updating `level`
        """
        instance = self.get_object()
        data = request.data or {}

        if 'level' not in data:
            return Response(
                {'detail': 'Only `level` can be updated.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            level = int(data['level'])
            if level < 1:
                raise ValueError()
        except Exception:
            return Response(
                {'level': ['Must be integer >= 1']},
                status=status.HTTP_400_BAD_REQUEST
            )

        instance.level = level
        instance.save(update_fields=['level'])

        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)
