import os
import time
import json
import threading
from django.http import FileResponse, JsonResponse, StreamingHttpResponse, Http404
from rest_framework import status
from rest_framework.response import Response
from .movieSearch import MovieSearch, TMDB
from rest_framework.views import APIView
import libtorrent as lt
from .models import Movie
from .serializers import MovieSerializer


class MovieShowAvailable(APIView):
    def get(self, request):
        movies = Movie.objects.all()
        serializer = MovieSerializer(movies, many=True)

        result = {
            "tmdb_config": TMDB().getConfig(),
            "movies": serializer.data,
        }
        return Response(result)

class MovieSearchAPI(APIView):
    def get(self, request):
        query = request.query_params.get("query")
        cat = request.query_params.get("cat")
        count = request.query_params.get("count")
        try:
            count = int(count)
        except:
            count = None

        if not query:
            return Response({"error": "No query specified"}, status=status.HTTP_400_BAD_REQUEST)

        result = MovieSearch().search(query, cat=cat)
        limited_movies = result["movies"][:count]

        limited_result = {
            "tmdb_config": result["tmdb_config"],
            "movies": limited_movies
        }
        return Response(limited_result, status=status.HTTP_200_OK)

class MoviePopulars(APIView):
    def get(self, request):
        page = request.query_params.get("page")
        if not page:
            page = 1
        tmdb = TMDB()
        result = tmdb.getPopularMovies(page)
        return Response(result, status=status.HTTP_200_OK)

class MovieStream(APIView):
    def get(self, request):
        path = f"./Avengers: Endgame/output_new.m3u8"
        return FileResponse(open(path, 'rb'), content_type='application/vnd.apple.mpegurl')

class GetTS(APIView):
    def get(self, request, name):
        path = f"./Avengers: Endgame/{name}"
        return FileResponse(open(path, 'rb'), content_type='application/vnd.apple.mpegurl')

class StreamMovie(APIView):
    DOWNLOAD_PATH = "/var/www/media/downloads"
    PUBLIC_BASE_URL = "http://127.0.0.1:8000/media/downloads"
    downloads = {}  # { tmdb_id: {"movie_file": str, "status": "downloading"/"done" } }

    def get(self, request):
        tmdb_id = request.query_params.get("tmdb_id")

        with open("./movie_dump.json", "r") as f:
            data = json.load(f)
        tmdb_id = str(data["tmdb_id"])

        movie_dir = os.path.join(self.DOWNLOAD_PATH, tmdb_id)

        if tmdb_id not in self.downloads:
            self.downloads[tmdb_id] = {"movie_file": None, "status": "starting"}
            threading.Thread(target=self.start_download, args=(tmdb_id,), daemon=True).start()
            print("Started download in background")

        while self.downloads[tmdb_id]["movie_file"] is None:
            print("Waiting for metadata to get movie file...")
            time.sleep(1)

        movie_file = self.downloads[tmdb_id]["movie_file"]
        #public_url = f"{self.PUBLIC_BASE_URL}/{tmdb_id}/{movie_file}"
        public_url = request.build_absolute_uri(f"/media/downloads/{tmdb_id}/{movie_file}")

        return Response({"url": public_url}, status=200)

    def start_download(self, tmdb_id):
        with open("./movie_dump.json", "r") as f:
            data = json.load(f)
        movie_dir = os.path.join(self.DOWNLOAD_PATH, tmdb_id)
        os.makedirs(movie_dir, exist_ok=True)

        magnet_link = MovieSearch().getMagnetLink(data)

        ses = lt.session()
        params = {
            'save_path': movie_dir,
            'storage_mode': lt.storage_mode_t.storage_mode_sparse,
        }
        handle = lt.add_magnet_uri(ses, magnet_link, params)
        handle.set_sequential_download(True)

        while not handle.has_metadata():
            print("Fetching metadata...")
            time.sleep(1)

        torrent_info = handle.get_torrent_info()
        fs = torrent_info.files()
        num_files = fs.num_files()

        video_extensions = ['.mp4', '.mkv', '.avi', '.mov']
        largest_size = 0
        selected_file = None

        for idx in range(num_files):
            file_path = fs.file_path(idx)
            file_size = fs.file_size(idx)

            if any(file_path.lower().endswith(ext) for ext in video_extensions):
                if file_size > largest_size:
                    largest_size = file_size
                    selected_file = file_path

        if selected_file:
            self.downloads[tmdb_id]["movie_file"] = selected_file
            self.downloads[tmdb_id]["status"] = "downloading"

        while not handle.is_seed():
            s = handle.status()
            print(f"Progress: {s.progress * 100:.2f}%")
            time.sleep(1)

        self.downloads[tmdb_id]["status"] = "done"
        print("Download complete.")
