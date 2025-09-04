import os
import subprocess
import logging

from django.core.management.base import BaseCommand
from api.models import Movie

logger = logging.getLogger("movies")

class Command(BaseCommand):
    help = "Converts movies to HLS format. If TMDB_ID is given, only converts that one."

    def add_arguments(self, parser):
        parser.add_argument(
            "--tmdb_id",
            type=int,
            help="TMDB ID of the movie to convert",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Force conversion even if already converted",
        )

    def handle(self, *args, **options):
        tmdb_id = options.get("tmdb_id")
        self.force = options.get("force")

        if tmdb_id:
            logger.info("Converting movie with TMDB ID: %s", tmdb_id)
            movie_obj = Movie.objects.filter(tmdb_id=tmdb_id).first()
            if movie_obj:
                self.convert_to_hls(movie_obj)
            else:
                logger.info("No movie found with TMDB ID %s", tmdb_id)
        else:
            logger.info("Converting all movies")
            movies = Movie.objects.all()
            for movie in movies:
                self.convert_to_hls(movie)

    def convert_to_hls(self, movie):
        if not self.force:
            if movie.hls_available and self.validate_hls_exists(movie):
                logger.info("HLS already available for %s (%s)", movie.title, movie.tmdb_id)
                return

        logger.info("Generating HLS for %s (%s)", movie.title, movie.tmdb_id)

        torrent_path = os.path.join(movie.download_path, "torrent")
        movie_path = self.get_movie_file(torrent_path)
        if not movie_path:
            logger.warning("Couldn't locate movie file for %s (%s)", movie.title, movie.tmdb_id)
            return

        HLS_PATH = os.path.join(movie.download_path, "hls")
        os.makedirs(HLS_PATH, exist_ok=True)

        safe_title = "".join(c if c.isalnum() or c in "-_" else "_" for c in movie.title)
        m3u8_path = os.path.join(HLS_PATH, f"{safe_title}.m3u8")
        segment_pattern = os.path.join(HLS_PATH, f"{safe_title}_%d.ts")

        # First get total duration
        try:
            result = subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "default=noprint_wrappers=1:nokey=1", movie_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=True,
            )
            total_duration = float(result.stdout.strip())
        except Exception as e:
            logger.warning(f"Failed to get duration: {e}")
            total_duration = None

        # Helper to run ffmpeg with progress reporting
        def run_ffmpeg(cmd):
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
            )

            for line in process.stdout:
                line = line.strip()
                if total_duration and line.startswith("out_time="):
                    t = line.split("=")[1].split(".")[0]  # ignore microseconds
                    try:
                        h, m, s = map(int, t.split(":"))
                        current_seconds = h*3600 + m*60 + s
                        percent = (current_seconds / total_duration) * 100
                        # Overwrite the same line
                        self.stdout.write(f"\rProgress: {percent:.1f}%", end="", flush=True)
                    except Exception:
                        pass
                elif line.startswith("progress=end"):
                    self.stdout.write("\rProgress: 100.0% - Conversion complete!")

            process.wait()
            return process.returncode == 0

        # Try copy first
        ffmpeg_copy_cmd = [
            "ffmpeg",
            "-i", movie_path,
            "-c", "copy",
            "-map", "0:v:0",
            "-map", "0:a:0",
            "-loglevel", "warning",
            "-progress", "pipe:1",
            "-nostats",
            "-f", "hls",
            "-hls_time", "10",
            "-hls_playlist_type", "vod",
            "-hls_segment_filename", segment_pattern,
            m3u8_path
        ]

        logger.info("Attempting fast HLS conversion (copy) for %s", movie.title)
        if not run_ffmpeg(ffmpeg_copy_cmd):
            logger.info("Copy failed, falling back to re-encoding for %s", movie.title)
            ffmpeg_reencode_cmd = [
                "ffmpeg",
                "-i", movie_path,
                "-c:v", "libx264",
                "-c:a", "aac",
                "-loglevel", "warning",
                "-progress", "pipe:1",
                "-nostats",
                "-f", "hls",
                "-hls_time", "10",
                "-hls_playlist_type", "vod",
                "-hls_segment_filename", segment_pattern,
                m3u8_path
            ]
            run_ffmpeg(ffmpeg_reencode_cmd)
            logger.info("HLS conversion (re-encode) finished for %s", movie.title)

        movie.hls_available = True
        movie.save(update_fields=["hls_available"])
        logger.info("HLS conversion done for %s", movie.title)

    def validate_hls_exists(self, movie):
        safe_title = "".join(c if c.isalnum() or c in "-_" else "_" for c in movie.title)
        m3u8_path = os.path.join(movie.download_path, "hls", f"{safe_title}.m3u8")

        if not os.path.isfile(m3u8_path):
            return False

        try:
            result = subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", m3u8_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=True,
            )
            duration = float(result.stdout.strip())
            return duration > 0
        except Exception as e:
            logger.warning("Invalid HLS file for %s (%s): %s", movie.title, movie.tmdb_id, e)
            return False

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
