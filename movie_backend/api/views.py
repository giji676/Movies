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

class ShowAvailableMovies(APIView):
    """ return the json of all the movies available on the server """
    def get(self, request):
        movies = Movie.objects.all()
        serializer = MovieSerializer(movies, many=True)

        result = {
            "tmdb_config": TMDB().getConfig(),
            "movies": serializer.data,
        }
        return Response(result)

class MovieSearch(APIView):
    """
        queries apibay (ThePirrateBay) for a movie
        returns list of movies from the query reuslt
    """
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
    """ returns a json of popular movies currently """
    def get(self, request):
        page = request.query_params.get("page")
        if not page:
            page = 1
        tmdb = TMDB()
        result = tmdb.getPopularMovies(page)
        return Response(result, status=status.HTTP_200_OK)

class StreamToClient(APIView):
    """ returns the path of the movie file, given the tmdb id """
    def get(self, request):
        tmdb_id = request.query_params.get("tmdb_id")
        if not tmdb_id:
            return Response({"error": "No tmdb_id specified"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            movie = Movie.objects.get(tmdb_id=tmdb_id)
        except Movie.DoesNotExist:
            return Response({"error": "Movie not found"}, status=status.HTTP_404_NOT_FOUND)

        path = movie.download_path
        if not os.path.exists(path):
            return Response({"error": "Download path not found"}, status=status.HTTP_404_NOT_FOUND)

        video_extensions = ['.mp4', '.mkv', '.avi', '.mov']
        selected_file = None
        largest_size = 0

        for root, dirs, files in os.walk(path):
            for file in files:
                file_path = os.path.join(root, file)
                if any(file_path.lower().endswith(ext) for ext in video_extensions):
                    file_size = os.path.getsize(file_path)
                    if file_size > largest_size:
                        largest_size = file_size
                        selected_file = file_path

        if selected_file:
            # Get relative path after /var/www/media
            relative_path = os.path.relpath(selected_file, '/var/www/media')
            public_url = request.build_absolute_uri(f"/media/{relative_path}".replace("\\", "/"))
            return Response({"file_path": public_url}, status=status.HTTP_200_OK)
        return Response({"error": "No video file found"}, status=status.HTTP_404_NOT_FOUND)
