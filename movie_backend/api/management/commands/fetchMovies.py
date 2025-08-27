import os
import asyncio
import subprocess
import threading

from django.core.management.base import BaseCommand
from api.models import Movie
from api.movieSearch import MovieSearch, TMDB

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
                print(f"processing {movie['title']}")
                tpb_data = self.download(movie)
                if not tpb_data:
                    print("no tpb results found")
                    continue
                movie_path = os.path.join(self.DOWNLOAD_PATH, str(movie["id"]))
                movie_obj, created = Movie.objects.update_or_create(
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
                        "hls_available": False,
                    }
                )
                print(f"Saved: {movie['title']} data")
                print()
                if created:
                    # Start HLS conversion in a new thread
                    #threading.Thread(target=self.convert_to_hls, args=(movie_obj,), daemon=True).start()
                    pass

            print(f"page {page} done")
            print()
            page += 1

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

    def convert_to_hls(self, movie):
        torrent_path = os.path.join(movie.download_path, "torrent")
        movie_path = self.get_movie_file(torrent_path)
        if not movie_path:
            print("Couldn't locate movie file for HLS conversion")
            return

        HLS_PATH = os.path.join(movie.download_path, "hls")
        os.makedirs(HLS_PATH, exist_ok=True)

        safe_title = "".join(c if c.isalnum() or c in "-_" else "_" for c in movie.title)
        m3u8_path = os.path.join(HLS_PATH, f"{safe_title}.m3u8")
        segment_pattern = os.path.join(HLS_PATH, f"{safe_title}_%d.ts")

        ffmpeg_copy_cmd = [
            "ffmpeg",
            "-i", movie_path,
            "-c", "copy",
            "-map", "0:v:0",
            "-map", "0:a:0",
            "-loglevel", "panic",
            "-f", "hls",
            "-hls_time", "10",
            "-hls_playlist_type", "vod",
            "-hls_segment_filename", segment_pattern,
            m3u8_path
        ]

        print(f"Attempting fast HLS conversion (copy) for {movie.title}")
        try:
            subprocess.run(ffmpeg_copy_cmd, check=True, stdout=subprocess.DEVNULL)
            print(f"HLS conversion (copy) finished for {movie.title}")
        except subprocess.CalledProcessError:
            print(f"Copy failed, falling back to re-encoding for {movie.title}")
            ffmpeg_reencode_cmd = [
                "ffmpeg",
                "-i", movie_path,
                "-c:v", "libx264",
                "-c:a", "aac",
                "-loglevel", "panic",
                "-f", "hls",
                "-hls_time", "10",
                "-hls_playlist_type", "vod",
                "-hls_segment_filename", segment_pattern,
                m3u8_path
            ]
            subprocess.run(ffmpeg_reencode_cmd, check=True, stdout=subprocess.DEVNULL)
            print(f"HLS conversion (re-encode) finished for {movie.title}")

        movie.hls_available = True
        movie.save(update_fields=["hls_available"])
        print(f"HLS conversion finished for {movie.title}")

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
            os.makedirs(movie_path, exist_ok=True)

            movie_path = os.path.join(movie_path, "torrent")
            os.makedirs(movie_path, exist_ok=True)

            asyncio.run(m_search.download(magnet_link, path=movie_path))
            return movie_match
        return None
