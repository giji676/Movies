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
        while True:
            popular_movies = TMDB().getPopularMovies(page=page)
            for movie in popular_movies["results"]:
                tmdb_id = movie["id"]
                if Movie.objects.filter(tmdb_id=tmdb_id).exists():
                    print(f"skipping {movie['title']} (already exists)")
                    continue
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
            print(f"page {page} done")
            print()
            page += 1

    def download(self, tmdb):
        title = tmdb["title"]
        release_year = tmdb["release_date"].split("-")[0]
        m_search = MovieSearch()
        results = m_search.search(f"{title} {release_year}")

        if results["movies"]:
            movie_match = results["movies"][0]
            id_match = False
            for movie in results["movies"]:
                imdb_id = TMDB().imdbIDLookup(movie["imdb"])
                tmdb_id = tmdb["id"]

                if int(movie["seeders"]) < 10:
                    continue

                if imdb_id == tmdb_id:
                    movie_match = movie
                    id_match = True
                    break
            if not id_match or int(movie_match["seeders"]) < 10:
                return None

            magnet_link = m_search.getMagnetLink(movie_match)
            movie_path = os.path.join(self.DOWNLOAD_PATH, str(tmdb["id"]))
            if not os.path.exists(movie_path):
                os.mkdir(movie_path)

            movie_path = os.path.join(movie_path, "torrent")
            if not os.path.exists(movie_path):
                os.mkdir(movie_path)

            asyncio.run(m_search.download(magnet_link, path=movie_path))
            return movie_match
        return None
