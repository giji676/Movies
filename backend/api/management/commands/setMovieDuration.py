import os
import subprocess
import logging

from django.core.management.base import BaseCommand
from api.models import Movie

logger = logging.getLogger("movies")

class Command(BaseCommand):
    help = "Go through already downloaded movies, update their duration"

    def add_arguments(self, parser):
        parser.add_argument(
            "--tmdb_id",
            type=int,
            help="TMDB ID of the movie to process",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Force process",
        )

    def handle(self, *args, **options):
        tmdb_id = options.get("tmdb_id")
        self.force = options.get("force")

        if tmdb_id:
            movie_obj = Movie.objects.filter(tmdb_id=tmdb_id).first()
            logger.info("Getting duration for %s (%s)", movie_obj.title, tmdb_id)
            if movie_obj:
                self.get_duration(movie_obj)
            else:
                logger.info("No movie found with TMDB ID %s", tmdb_id)
        else:
            logger.info("Getting duration for all movies")
            movies = Movie.objects.all()
            for movie in movies:
                self.get_duration(movie)

    def get_duration(self, movie):
        if not self.force:
            if movie.duration > 1:
                logger.info("Duration already available for %s (%s)", movie.title, movie.tmdb_id)
                return

        torrent_path = os.path.join(movie.download_path, "torrent")
        movie_path = self.get_movie_file(torrent_path)
        if not movie_path:
            logger.warning("Couldn't locate movie file for %s (%s)", movie.title, movie.tmdb_id)
            return

        try:
            result = subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "default=noprint_wrappers=1:nokey=1", movie_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=True,
            )
            duration = float(result.stdout.strip())
        except Exception as e:
            logger.warning(f"Failed to get duration: {e}")
            duration = 1

        duration = int(duration)
        movie.duration = duration
        movie.save(update_fields=["duration"])
        logger.info("Set duration (%s) for %s (%s)", duration, movie.title, movie.tmdb_id)

    def get_movie_file(self, torrent_path):
        video_extensions = ['.mp4', '.mkv', '.avi', '.mov']
        selected_file = None
        largest_size = 0

        for root, dirs, files in os.walk(torrent_path):
            for file in files:
                file_path = os.path.join(root, file)
                if any(file_path.lower().endswith(ext) for ext in video_extensions):
                    file_size = os.path.getsize(file_path)
                    if file_size > largest_size:
                        largest_size = file_size
                        selected_file = file_path

        return selected_file
