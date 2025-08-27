from django.db import models

class Movie(models.Model):
    tmdb_id = models.IntegerField(primary_key=True)
    imdb = models.CharField(max_length=50, default="", blank=True)
    title = models.CharField(max_length=300)
    info_hash = models.CharField(max_length=200, default="", blank=True)
    seeders = models.IntegerField(default=0)
    leechers = models.IntegerField(default=0)
    backdrop_path = models.CharField(max_length=200, default="", blank=True)
    poster_path = models.CharField(max_length=200, default="", blank=True)
    category = models.CharField(max_length=8, default="201")
    overview = models.TextField()
    release_date = models.DateField(null=True, blank=True)
    download_path = models.CharField(max_length=300, default=".", blank=True)
    hls_available = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} {self.release_date} {self.tmdb_id}"
