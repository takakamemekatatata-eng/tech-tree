# Create your views here.

from .models import Skill
from .serializers import SkillSerializer
from rest_framework.views import APIView
from rest_framework.response import Response

class SkillListAPIView(APIView):
    def get(self, request):
        data = [
            {
                "id": 1,
                "name": "Python",
                "level": 4,
                "category": "Backend",
                'parent_id': None
            },
            {
                "id": 2,
                "name": "Django",
                "level": 3,
                "category": "Backend",
                'parent_id': 1
            },
            {
                "id": 3,
                "name": "Flask",
                "level": 2,
                "category": "Backend",
                'parent_id': 1
            },
            {
                "id": 4,
                "name": "REST API Design",
                "level": 3,
                "category": "Backend",
                'parent_id': None
            },
            {
                "id": 5,
                "name": "Angular",
                "level": 2,
                "category": "Frontend",
                'parent_id': 7
            },
            {
                "id": 6,
                "name": "TypeScript",
                "level": 3,
                "category": "Frontend",
                'parent_id': 5
            },
            {
                "id": 7,
                "name": "HTML / CSS",
                "level": 4,
                "category": "Frontend",
                'parent_id': None
            },
            {
                "id": 8,
                "name": "PostgreSQL",
                "level": 3,
                "category": "Backend",
                'parent_id': None
            },
            {
                "id": 9,
                "name": "Docker",
                "level": 2,
                "category": "Infra",
                'parent_id': 10
            },
            {
                "id": 10,
                "name": "Linux",
                "level": 3,
                "category": "Infra",
                'parent_id': None
            }
        ]

        return Response(data)
