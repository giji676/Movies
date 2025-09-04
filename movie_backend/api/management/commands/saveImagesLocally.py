import os
import requests
import logging
from django.core.management.base import BaseCommand
from api.models import Movie
from api.movieSearch import TMDB

logger = logging.getLogger("movies")

class Command(BaseCommand):
    help = "Download TMDB poster and backdrop images locally for all movies"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Force download even if already converted",
        )

    def handle(self, *args, **kwargs):
        self.force = kwargs.get("force")
        tmdb = TMDB()
        movies = Movie.objects.all()
        for movie in movies:
            logger.info("Processing: %s (%s)", movie.title, movie.tmdb_id)

            movie_path = os.path.join(movie.download_path, "images")
            os.makedirs(movie_path, exist_ok=True)

            # Poster
            poster_file = os.path.join(movie_path, "poster.jpg")
            if not os.path.isfile(poster_file) or self.force:
                self.download_image(tmdb.buildImageURL(movie.tmdb_id, "poster"), poster_file)
                logger.info("Downloaded poster for %s", movie.title)
            else:
                logger.info("Poster already exists for %s", movie.title)

            # Backdrop
            backdrop_file = os.path.join(movie_path, "backdrop.jpg")
            if not os.path.isfile(backdrop_file) or self.force:
                self.download_image(tmdb.buildImageURL(movie.tmdb_id, "backdrop"), backdrop_file)
                logger.info("Downloaded backdrop for %s", movie.title)
            else:
                logger.info("Backdrop already exists for %s", movie.title)

            # Update DB paths
            movie.poster_path = os.path.join("images", "poster.jpg")
            movie.backdrop_path = os.path.join("images", "backdrop.jpg")
            movie.save(update_fields=["poster_path","backdrop_path"])

    def download_image(self, url, path):
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            with open(path, "wb") as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
        except Exception as e:
            logger.warning("Failed to download %s: %s", url, e)
