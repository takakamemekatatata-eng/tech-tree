from django.db import models

# Create your models here.
class Skill(models.Model):
    name = models.CharField(max_length=100)
    level = models.IntegerField(default=1)

    def __str__(self):
        return self.name

