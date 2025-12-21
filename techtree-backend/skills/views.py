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
        Only allow updating `level` and `user_comment`
        """
        instance = self.get_object()
        data = request.data or {}

        allowed_keys = {'level', 'user_comment'}
        unexpected_keys = set(data.keys()) - allowed_keys
        if unexpected_keys:
            return Response(
                {'detail': f'Only {sorted(allowed_keys)} can be updated.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated_fields = []

        if 'level' in data:
            try:
                level = int(data['level'])
                if level < 0:
                    raise ValueError()
                instance.level = level
                updated_fields.append('level')
            except Exception:
                return Response(
                    {'level': ['Must be integer >= 0']},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if 'user_comment' in data:
            instance.user_comment = data.get('user_comment') or ''
            updated_fields.append('user_comment')

        if not updated_fields:
            return Response(
                {'detail': 'No updatable fields provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        instance.save(update_fields=updated_fields)

        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)
