import os
import sys
import json
import logging
import subprocess

from api.models import Movie

class ConvertToHLS:
    def __init__(self, tmdb_id=None, force=False, verbose=False):
        self.tmdb_id = tmdb_id
        self.force = force
        self.verbose = verbose

        self.logger = logging.getLogger(__name__)
        handler = logging.StreamHandler()

        if not self.logger.handlers:
            self.logger.addHandler(handler)

        self.logger.setLevel(logging.INFO if verbose else logging.WARNING)

    def start(self):
        # If no tmdb_id is provided, convert all movies from the DB
        if self.tmdb_id:
            movie = Movie.objects.filter(tmdb_id=self.tmdb_id).first()
            if movie:
                self.convert(movie)
            else:
                self.logger.warning(f"No movie found with TMDB ID {self.tmdb_id}")
        else:
            self.logger.info("Converting all movies...")
            movies = Movie.objects.all()
            for movie in movies:
                self.convert(movie)
            self.logger.info("Finished converting all movies")

    def convert(self, movie):
        self.logger.info(f"Converting {movie.tmdb_id}...")
        if not self.force:
            if movie.hls_available and self.validate_hls_exists(movie):
                self.logger.info(f"HLS already available for {movie.title} ({movie.tmdb_id})")
                return

        torrent_path = os.path.join(movie.download_path, "torrent")
        movie_path = self.get_movie_file(torrent_path)
        if not movie_path:
            self.logger.warning(f"Couldn't locate movie file for {movie.title} ({movie.tmdb_id})");
            return

        HLS_PATH = os.path.join(movie.download_path, "hls")
        os.makedirs(HLS_PATH, exist_ok=True)

        safe_title = "".join(c if c.isalnum() or c in "-_" else "_" for c in movie.title)
        m3u8_path = os.path.join(HLS_PATH, f"{safe_title}.m3u8")
        segment_pattern = os.path.join(HLS_PATH, f"{safe_title}_%d.ts")

        video_info  = self.get_video_info(movie_path)
        duration = video_info["duration"]
        ffmpeg_cmd = self.build_ffmpeg_command(movie_path, m3u8_path, segment_pattern, video_info)

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
                if duration and line.startswith("out_time_ms="):
                    t_ms = line.split("=")[1]
                    try:
                        current_seconds = int(t_ms)/100_000_000 # TODO: validate the seconds calculation is correct!
                        percent = (current_seconds / duration) * 100
                        # Overwrite the same line
                        #print(f"\rProgress: {percent:.1f}% ({current_seconds:.1f}s)   ", end="", flush=True)
                        sys.stdout.write(f"\rProgress: {percent:.1f}% ({current_seconds:.1f}s)")
                        sys.stdout.flush()
                    except Exception:
                        pass
                elif line.startswith("progress=end"):
                    sys.stdout.write("\rProgress: 100.0% - Conversion complete!\n")
                    sys.stdout.flush()

            process.wait()
            return process.returncode == 0

        if run_ffmpeg(ffmpeg_cmd):
            movie.hls_available = True
            movie.save(update_fields=["hls_available"])
            self.logger.info(f"Finished converting")
        else:
            movie.hls_available = False
            movie.save(update_fields=["hls_available"])
            self.logger.warning(f"Conversion failed for {movie.title}")

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
            self.logger.warning(f"Invalid HLS file for {movie.title} ({movie.tmdb_id}): {e}")
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
