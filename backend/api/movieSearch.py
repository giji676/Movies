import os
import logging
import requests
import urllib.parse
from torrentp import TorrentDownloader
from dotenv import load_dotenv
from pathlib import Path

env_path = Path('.') / '.env.local'

load_dotenv(dotenv_path=env_path)

logger = logging.getLogger("movies")

class MovieSearch:
    def search(self, query, cat=None):
        base_url = "https://apibay.org/"
        url = f"{base_url}q.php?q={query}&cat={cat}"
        data = requests.get(url).json()

        tmdb = TMDB()
        movies = []

        for movie in data:
            if not movie.get("imdb"):
                continue
            movie["tmdb_id"] = tmdb.imdbIDLookup(movie["imdb"])
            if movie["tmdb_id"]:
                movie["tmdb"] = tmdb.getMovieByTMDBID(movie["tmdb_id"])
                movies.append(movie)

        result = {
            "tmdb_config": tmdb.config,
            "movies": movies
        }
        #with open("movie_dump.json", "w") as f:
        #    json.dump(result["movies"][0], f, indent=2)

        return result

    def getMagnetLink(self, torrent):
        info_hash = torrent['info_hash']
        name = urllib.parse.quote(torrent['name'])
        trackers = [
            'udp://tracker.opentrackr.org:1337/announce',
            'udp://tracker.torrent.eu.org:451/announce',
            'udp://tracker.openbittorrent.com:80/announce',
        ]
        tr = '&'.join(f'tr={urllib.parse.quote(t)}' for t in trackers)
        magnet = f"magnet:?xt=urn:btih:{info_hash}&dn={name}&{tr}"
        return magnet

    async def download(self, uri, path="."):
        """ asyncio.run(download(...)) """
        logger.info("starting async download at: %s", path)
        torrent_file = TorrentDownloader(uri, path)
        await torrent_file.start_download()

class TMDB:
    def __init__(self):
        self.API_KEY = os.getenv("TMDB_API_KEY")
        self.BASE_URL = "https://api.themoviedb.org/3"
        self.config = self._getConfig()

    def _getConfig(self):
        url = f"{self.BASE_URL}/configuration"
        params = {'api_key': self.API_KEY}
        headers = {"accept": "application/json"}
        response = requests.get(url, headers=headers, params=params)
        return response.json()

    def searchMovie(self, query):
        url = f"{self.BASE_URL}/search/movie"
        params = {'api_key': self.API_KEY, 'query': query}
        headers = {"accept": "application/json"}
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()['results']

    def getMovieByTMDBID(self, tmdb_id):
        url = f"{self.BASE_URL}/movie/{tmdb_id}"
        params = {"api_key": self.API_KEY}
        headers = {"accept": "application/json"}
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        movie_info = response.json()
        return movie_info

    def imdbIDLookup(self, imdb_id):
        url = f"{self.BASE_URL}/find/{imdb_id}"
        params = {"api_key": self.API_KEY, "external_source": "imdb_id"}

        response = requests.get(url, params=params)
        if response.status_code != 200:
            return None

        data = response.json()
        movie_results = data.get("movie_results", [])
        if not movie_results:
            return None

        tmdb_id = movie_results[0]["id"]
        return tmdb_id

    def getMovieCredits(self, movie_id):
        url = f"{self.BASE_URL}/movie/{movie_id}/credits"
        params = {'api_key': self.API_KEY}
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()

    def getMovieCast(self, movie_id):
        url = f"{self.BASE_URL}/movie/{movie_id}/credits"
        params = {'api_key': self.API_KEY}
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()["cast"]

    def getMovieCrew(self, movie_id):
        url = f"{self.BASE_URL}/movie/{movie_id}/credits"
        params = {'api_key': self.API_KEY}
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()["crew"]

    def getPopularMovies(self, page=1):
        url = f"{self.BASE_URL}/movie/popular?language=en-US&page={page}"
        params = {'api_key': self.API_KEY}
        headers = {"accept": "application/json"}
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()

    def buildImageURL(self, movie_id, type="poster"):
        movie = self.getMovieByTMDBID(movie_id)
        image_path = ""
        # poser_sizes go from smallest -> biggest. Last one (-1) index is the original size (very big)
        # -2 index is biggest, thats not the original size (much smaller, around 780px)
        poster_size_index = -2
        if type == "poster":
            size = self.config["images"]["poster_sizes"][poster_size_index]
            image_path = movie["poster_path"]
        elif type == "backdrop":
            size = self.config["images"]["backdrop_sizes"][poster_size_index]
            image_path = movie["backdrop_path"]
        else:
            size = self.config["images"]["poster_sizes"][poster_size_index]
            image_path = movie["poster_path"]
        return f"{self.config["images"]["secure_base_url"]}{size}{image_path}"
