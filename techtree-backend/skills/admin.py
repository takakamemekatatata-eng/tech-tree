from django.contrib import admin
from .models import Skill

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'level', 'parent')
    list_filter = ('category',)
    search_fields = ('name',)
