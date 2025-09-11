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
    tmdb = models.ForeignKey(
        "Movie",
        on_delete=models.DO_NOTHING,
        related_name="playlist_entries"
    )

    # Progress tracking
    time_stamp = models.IntegerField(default=0)  # seconds watched
    last_watched = models.DateTimeField(null=True)

    # User-facing lists
    watch_later = models.BooleanField(default=False)
    watch_history = models.BooleanField(default=False)
    completed = models.BooleanField(default=False)

    # Permanent history (never removed)
    watched_at = models.DateTimeField(null=True)
    completed_at = models.DateTimeField(null=True)

    # Record creation
    added_at = models.DateTimeField(auto_now_add=True)

    COMPLETION_THRESHOLD = 0.9

    class Meta:
        unique_together = ("author", "tmdb")
        indexes = [
            models.Index(fields=["author", "watch_later"]),
            models.Index(fields=["author", "watch_history"]),
            models.Index(fields=["author", "completed"]),
        ]

    def __str__(self):
        return f"{self.tmdb.title} ({self.author.email})"

    # Override save to auto-update last_watched
    def save(self, *args, **kwargs):
        if self.time_stamp > 0:
            self.last_watched = timezone.now()
            if not self.watched_at:
                self.watched_at = timezone.now()
        if self.completed and not self.completed_at:
            self.completed_at = timezone.now()
        super().save(*args, **kwargs)

    # Helper to safely update progress
    def update_time_stamp(self, seconds: int):
        self.time_stamp = max(0, seconds)
        if self.time_stamp > 0:
            self.last_watched = timezone.now()
            if not self.watched_at:
                self.watched_at = timezone.now()
        self.check_and_mark_completed()
        self.save()

    # Helper to mark as completed
    def mark_completed(self):
        self.completed = True
        if not self.completed_at:
            self.completed_at = timezone.now()
        self.save()

    def check_and_mark_completed(self):
        if not self.tmdb.duration:
            return  # skip if duration unknown
        if self.time_stamp >= int(self.tmdb.duration * self.COMPLETION_THRESHOLD):
            self.mark_completed()
