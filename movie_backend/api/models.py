from django.db import models

class Movie(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    published_date = models.DateTimeField(auto_now_add=False)
    seeders = models.IntegerField()
    leechers = models.IntegerField()

    def __str__(self):
        return self.title
