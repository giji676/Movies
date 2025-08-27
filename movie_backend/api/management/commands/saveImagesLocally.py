import os
import requests
from django.core.management.base import BaseCommand
from api.models import Movie
from api.movieSearch import TMDB

class Command(BaseCommand):
    help = "Download TMDB poster and backdrop images locally for all movies"

    def handle(self, *args, **kwargs):
        tmdb = TMDB()
        movies = Movie.objects.all()
        for movie in movies:
            self.stdout.write(f"Processing: {movie.title} ({movie.tmdb_id})")
            movie_path = os.path.join(movie.download_path, "images")
            os.makedirs(movie_path, exist_ok=True)

            # Poster
            poster_file = os.path.join(movie_path, "poster.jpg")
            if not os.path.isfile(poster_file):
                self.download_image(tmdb.buildImageURL(movie.tmdb_id, "poster"), poster_file)
                self.stdout.write(f"Downloaded poster for {movie.title}")
            else:
                self.stdout.write(f"Poster already exists for {movie.title}")

            # Backdrop
            backdrop_file = os.path.join(movie_path, "backdrop.jpg")
            if not os.path.isfile(backdrop_file):
                self.download_image(tmdb.buildImageURL(movie.tmdb_id, "backdrop"), backdrop_file)
                self.stdout.write(f"Downloaded backdrop for {movie.title}")
            else:
                self.stdout.write(f"Backdrop already exists for {movie.title}")
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
            self.stderr.write(f"Failed to download {url}: {e}")
