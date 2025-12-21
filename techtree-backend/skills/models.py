from django.db import models


class Skill(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100)
    level = models.IntegerField()
    category = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(default='')
    user_comment = models.TextField(default='')
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='children'
    )

    class Meta:
        managed = False              # DjangoにDDLをさせない
        db_table = 'skills' # スキーマ明示

    def __str__(self):
        return self.name
