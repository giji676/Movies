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

logger = logging.getLogger("movies")

""" TODO: set duration after download automatically """

class Command(BaseCommand):
    help = 'Fetches and populates movie data from TMDB IDs'
    DOWNLOAD_PATH = "/var/www/media/downloads"

    def handle(self, *args, **kwargs):
        self.tmdb = TMDB()
        page = 1
        while True:
            popular_movies = self.tmdb.getPopularMovies(page=page)
            for movie in popular_movies["results"]:
                tmdb_id = movie["id"]
                if Movie.objects.filter(tmdb_id=tmdb_id).exists():
                    logger.info("Skipping %s (already exists)", movie["title"])
                    continue
                logger.info("Processing %s", movie["title"])
                tpb_data = self.download(movie)
                if not tpb_data:
                    logger.info("No TPB results found for %s", movie["title"])
                    continue
                movie_path = os.path.join(self.DOWNLOAD_PATH, str(movie["id"]))
                movie_obj, created = Movie.objects.update_or_create(
                    tmdb_id=tmdb_id,
                    defaults={
                        "title": movie["title"],
                        "overview": movie["overview"],
                        "release_date": movie["release_date"],
                        "backdrop_path": "",
                        "poster_path": "",
                        "imdb": tpb_data["imdb"],
                        "category": tpb_data["category"],
                        "download_path": movie_path,
                        "hls_available": False,
                    }
                )
                logger.info("Saved: %s data", movie["title"])

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
                if created:
                    torrent_path = os.path.join(movie_obj.download_path, "torrent")
                    movie_path = self.get_movie_file(torrent_path)
                    movie_path = os.path.join(torrent_path, movie_path)
                    movie_info = self.get_movie_info(movie_path)
                    movie_obj.duration = movie_info["duration"]
                    movie_obj.save(update_fields=["duration"])
                    # Start HLS conversion in a new thread
                    #threading.Thread(target=self.convert_to_hls, args=(movie_obj,), daemon=True).start()
                    pass

            logger.info("page %s done", page)
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
            logger.info("Couldn't locate movie file for HLS conversion (%s", movie.tmdb_id)
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

        logger.info("Attempting fast HLS conversion (copy) for %s", movie.title)
        try:
            subprocess.run(ffmpeg_copy_cmd, check=True, stdout=subprocess.DEVNULL)
            logger.info("Attempting fast HLS conversion (copy) for %s", movie.title)
        except subprocess.CalledProcessError:
            logger.info("Copy failed, falling back to re-encoding for %s", movie.title)
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
            logger.info("HLS conversion (re-encode) finished for %s", movie.title)

        movie.hls_available = True
        movie.save(update_fields=["hls_available"])
        logger.info("HLS conversion finished for %s", movie.title)

    def download_image(self, url, path):
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            with open(path, "wb") as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
        except Exception as e:
            logger.warning("Failed to download %s: %s", url, e)

    def download(self, tmdb_json):
        title = tmdb_json["title"]
        release_year = tmdb_json["release_date"].split("-")[0]
        m_search = MovieSearch()
        results = m_search.search(f"{title} {release_year}")

        if results["movies"]:
            movie_match = results["movies"][0]
            id_match = False
            for movie in results["movies"]:
                imdb_id = self.tmdb.imdbIDLookup(movie["imdb"])
                tmdb_id = tmdb_json["id"]

                if int(movie["seeders"]) < 10:
                    continue

                if imdb_id == tmdb_id:
                    movie_match = movie
                    id_match = True
                    break
            if not id_match or int(movie_match["seeders"]) < 10:
                return None

            magnet_link = m_search.getMagnetLink(movie_match)
            movie_path = os.path.join(self.DOWNLOAD_PATH, str(tmdb_json["id"]))
            os.makedirs(movie_path, exist_ok=True)

            movie_path = os.path.join(movie_path, "torrent")
            os.makedirs(movie_path, exist_ok=True)

            asyncio.run(m_search.download(magnet_link, path=movie_path))
            return movie_match
        return None

    def get_movie_info(self, path):
        cmd = [
            "ffprobe",
            "-v", "error",
            "-show_entries",
            "format=format_name,duration:stream=codec_type,codec_name,bit_rate",
            "-of", "json",
            path
        ]

        try:
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
            data = json.loads(result.stdout)

            # Format (container type)
            container_format = data.get("format", {}).get("format_name", "Unknown")
            duration = float(data.get("format", {}).get("duration", 0))

            # Codecs and bitrates
            video_codec = None
            audio_codec = None
            video_bitrate = None
            audio_bitrate = None

            for stream in data.get("streams", []):
                if stream.get("codec_type") == "video" and not video_codec:
                    video_codec = stream.get("codec_name")
                    video_bitrate = int(stream.get("bit_rate", 0)) if stream.get("bit_rate") else None
                elif stream.get("codec_type") == "audio" and not audio_codec:
                    audio_codec = stream.get("codec_name")
                    audio_bitrate = int(stream.get("bit_rate", 0)) if stream.get("bit_rate") else None

            return {
                "container": container_format,
                "duration": duration,
                "video_codec": video_codec or "None",
                "video_bitrate": video_bitrate,
                "audio_codec": audio_codec or "None",
                "audio_bitrate": audio_bitrate
            }

        except subprocess.CalledProcessError as e:
            print("Error running ffprobe:", e.stderr)
            return None
