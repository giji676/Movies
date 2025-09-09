import os
import sys
import json
import time
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
<<<<<<< HEAD
            help="Force re-conversion even if already converted",
=======
            help="Force conversion even if already converted",
>>>>>>> main
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

        video_info  = self.get_video_info(movie_path)
        total_duration = video_info["duration"]
        ffmpeg_cmd = self.build_ffmpeg_command(movie_path, m3u8_path, segment_pattern, video_info)

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
                if total_duration and line.startswith("out_time_ms="):
                    t_ms = line.split("=")[1]
                    try:
                        current_seconds = int(t_ms)/100_000_000
                        percent = (current_seconds / total_duration) * 100
                        # Overwrite the same line
                        #print(f"\rProgress: {percent:.1f}% ({current_seconds:.1f}s)   ", end="", flush=True)
                        self.stdout.write(f"\rProgress: {percent:.1f}% ({current_seconds:.1f}s)", ending="")
                        self.stdout.flush()
                    except Exception:
                        pass
                elif line.startswith("progress=end"):
                    self.stdout.write("\rProgress: 100.0% - Conversion complete!")

            process.wait()
            return process.returncode == 0

        logger.info(video_info)
        logger.info(ffmpeg_cmd)
        logger.info("Attempting fast HLS conversion (copy) for %s", movie.title)
        if run_ffmpeg(ffmpeg_cmd):
            movie.hls_available = True
            movie.save(update_fields=["hls_available"])
            logger.info("HLS conversion done for %s", movie.title)
        else:
            movie.hls_available = False
            movie.save(update_fields=["hls_available"])
            logger.warning("HLS conversion failed for %s", movie.title)

    def get_video_info(self, path):
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

    def build_ffmpeg_command(self, input_path, output_path, segment_pattern, video_info):
        """
        Build FFmpeg command based on input file info.

        Args:
            input_path (str): Path to the source video.
            output_path (str): Path to the output video.
            segment_pattern (str): Pattern to specify how the output .ts segments should be named.
            video_info (dict): Must contain 'container', 'video_codec', 'audio_codec'.

        Returns:
            list: FFmpeg command ready to be run.
        """
        cmd = ["ffmpeg", "-i", input_path]

        # Video
        if video_info["video_codec"].lower() != "h264":
            cmd += ["-c:v", "libx264", "-preset", "fast", "-crf", "23"]
        else:
            cmd += ["-c:v", "copy"]

        # Audio
        if video_info["audio_codec"].lower() != "aac":
            cmd += ["-c:a", "aac", "-b:a", "128k"]
        else:
            cmd += ["-c:a", "copy"]

        # Container
        """
        if video_info["container"].lower() not in ["mp4", "mov"]:
            output_path = output_path.rsplit(".", 1)[0] + ".mp4"
        """
        stream_cmd = [
            "-map", "0",
        ]

        log_cmd = [
            "-loglevel", "info",
            "-progress", "pipe:1",
        ]
        hls_cmd = [
            "-f", "hls",
            "-hls_time", "10",
            "-hls_playlist_type", "vod",
            "-hls_segment_filename", segment_pattern
        ]
        cmd = cmd + stream_cmd + log_cmd + hls_cmd

        cmd.append(output_path)
        return cmd

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
