import os
import json
import asyncio
import subprocess
import requests
import threading
import logging

from django.core.management.base import BaseCommand
from api.models import Movie
from api.movieSearch import MovieSearch, TMDB
from utils.convertToHLS import ConvertToHLS
from dotenv import load_dotenv

DOWNLOAD_PATH  = os.environ.get("DOWNLOAD_PATH", "/media/downloads")

logger = logging.getLogger("movies")

class Command(BaseCommand):
    help = "Download popular movies to database, including the images, but not movie file"

    def add_arguments(self, parser):
        parser.add_argument(
            "--tmdb_id",
            type=int,
            help="TMDB ID of the movie to download",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Force conversion even if movie's already in the database",
        )
        parser.add_argument(
            "--amount",
            required=True,
            type=int,
            help="How many movies to download",
        )

    def handle(self, *args, **kwargs):
        input_tmdb_id = kwargs.get("tmdb_id")
        force = kwargs.get("force")
        amount = kwargs.get("amount")

        self.tmdb = TMDB()
        page = 1
        count = 0
        while True:
            popular_movies = self.tmdb.getPopularMovies(page=page)
            for movie in popular_movies["results"]:
                if count == amount:
                    logger.info(f"Finished downloading all movies ({count})")
                    return
                tmdb_id = movie["id"]
                logger.info(f"Processing {movie['title']} ({tmdb_id})")

                if Movie.objects.filter(tmdb_id=tmdb_id).exists() and not force:
                    logger.info(f"Already exists, skipping")
                    count += 1
                    continue

                movie_path = os.path.join(DOWNLOAD_PATH, str(movie["id"]))
                movie_obj, created = Movie.objects.update_or_create(
                    tmdb_id=tmdb_id,
                    defaults={
                        "title": movie["title"],
                        "overview": movie["overview"],
                        "release_date": movie["release_date"],
                        "backdrop_path": "",
                        "poster_path": "",
                        #"imdb": tpb_data["imdb"],
                        #"category": tpb_data["category"],
                        "download_path": movie_path,
                        "hls_available": False,
                    }
                )
                count += 1
                logger.info(f"Saved TMDB data ({count}/{amount})")

                images_path = os.path.join(movie_path, "images")
                os.makedirs(images_path, exist_ok=True)

                poster_rel = os.path.join("images", "poster.jpg")
                poster_file = os.path.join(images_path, "poster.jpg")
                backdrop_rel = os.path.join("images", "backdrop.jpg")
                backdrop_file = os.path.join(images_path, "backdrop.jpg")

                try:
                    # Download poster
                    if movie["poster_path"] and not os.path.isfile(poster_file):
                        poster_url = self.tmdb.buildImageURL(tmdb_id, "poster")
                        self.download_image(poster_url, poster_file)
                        logger.info("Downloaded poster for %s", movie["title"])
                    # Download backdrop
                    if movie["backdrop_path"] and not os.path.isfile(backdrop_file):
                        backdrop_url = self.tmdb.buildImageURL(tmdb_id, "backdrop")
                        self.download_image(backdrop_url, backdrop_file)
                        logger.info("Downloaded backdrop for %s", movie["title"])

                    # Update local paths in DB
                    movie_obj.poster_path = poster_rel
                    movie_obj.backdrop_path = backdrop_rel
                    movie_obj.save(update_fields=["poster_path", "backdrop_path"])
                except Exception as e:
                    logger.warning("Image download failed for %s (%s): %s", movie["title"], tmdb_id, e)
            logger.info("page %s done", page)
            page += 1

    def download_image(self, url, path):
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            with open(path, "wb") as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
        except Exception as e:
            logger.warning(f"Failed to download {url}: {e}")
