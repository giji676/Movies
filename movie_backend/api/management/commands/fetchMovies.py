from django.core.management.base import BaseCommand
from api.models import Movie
from api.movieSearch import MovieSearch, TMDB
import os
import time
import asyncio

class Command(BaseCommand):
    help = 'Fetches and populates movie data from TMDB IDs'
    DOWNLOAD_PATH = "/var/www/media/downloads"

    def handle(self, *args, **kwargs):
        page = 1
        popular_movies = TMDB().getPopularMovies(page=page)
        for movie in popular_movies["results"]:
            tmdb_id = movie["id"]
            if Movie.objects.filter(tmdb_id=tmdb_id).exists():
                print(f"skipping {movie['title']} (already exists)")
                #continue
            print(f"processing {movie["title"]}")
            tpb_data = self.download(movie)
            if not tpb_data:
                print("no tpb results found")
                continue
            movie_path = os.path.join(self.DOWNLOAD_PATH, str(movie["id"]))
            Movie.objects.update_or_create(
                tmdb_id=tmdb_id,
                defaults={
                    "title": movie["title"],
                    "overview": movie["overview"],
                    "release_date": movie["release_date"],
                    "backdrop_path": movie["backdrop_path"],
                    "poster_path": movie["poster_path"],
                    "seeders": int(tpb_data["seeders"]),
                    "imdb": tpb_data["imdb"],
                    "leechers": int(tpb_data["leechers"]),
                    "info_hash": tpb_data["info_hash"],
                    "category": tpb_data["category"],
                    "download_path": movie_path,
                }
            )
            print(f"Saved: {movie['title']} data")
            print()

            time.sleep(1.5)  # delay to avoid rate-limits

    def download(self, tmdb):
        title = tmdb["title"]
        m_search = MovieSearch()
        results = m_search.search(f"{title}")
        if results["movies"]:
            movie_match = results["movies"][0]
            for movie in results["movies"]:
                imdb_id = TMDB().imdbIDLookup(movie["imdb"])
                tmdb_id = tmdb["id"]
                if imdb_id == tmdb_id:
                    movie_match = movie
                    break
            magnet_link = m_search.getMagnetLink(movie_match)
            movie_path = os.path.join(self.DOWNLOAD_PATH, str(tmdb["id"]))
            if not os.path.exists(movie_path):
                os.mkdir(movie_path)
            asyncio.run(m_search.download(magnet_link, path=movie_path))
            return movie_match
        else:
            return None
