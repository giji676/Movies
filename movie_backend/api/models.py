from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.conf import settings
from django.utils import timezone

class Movie(models.Model):
    tmdb_id = models.IntegerField(primary_key=True)
    imdb = models.CharField(max_length=50, default="", blank=True)
    title = models.CharField(max_length=300)
    backdrop_path = models.CharField(max_length=200, default="", blank=True)
    poster_path = models.CharField(max_length=200, default="", blank=True)
    category = models.CharField(max_length=8, default="201")
    overview = models.TextField()
    release_date = models.DateField(null=True, blank=True)
    download_path = models.CharField(max_length=300, default=".", blank=True)
    hls_available = models.BooleanField(default=False)
    duration = models.PositiveIntegerField(default=1,
                                                 help_text="seconds",
                                                 validators=[MinValueValidator(0)])

    def __str__(self):
        return f"{self.title} {self.release_date} {self.tmdb_id}"

class PlaylistMovie(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="playlist_movies"
    )
    tmdb_id = models.ForeignKey(
        "Movie",
        on_delete=models.DO_NOTHING,
        related_name="playlist_entries"
    )
    time_stamp = models.IntegerField(default=0)
    watch_later = models.BooleanField(default=False)
    watch_history = models.BooleanField(default=False)
    completed = models.BooleanField(default=False)
    added_at = models.DateTimeField(auto_now_add=True)
    last_watched = models.DateTimeField(null=True)

    class Meta:
        unique_together = ("author", "tmdb_id")
        indexes = [
            models.Index(fields=["author", "watch_later"]),
            models.Index(fields=["author", "watch_history"]),
            models.Index(fields=["author", "completed"]),
        ]

    def __str__(self):
        return f"{self.tmdb_id.title} ({self.author.email})"

    # Override save to auto-update last_watched
    def save(self, *args, **kwargs):
        if self.time_stamp > 0:
            self.last_watched = timezone.now()
        super().save(*args, **kwargs)

    # Optional helper to update time_stamp safely
    def update_time_stamp(self, seconds: int):
        self.time_stamp = seconds
        self.last_watched = timezone.now()
        self.save()
