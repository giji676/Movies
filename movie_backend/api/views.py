import os
import time
import logging

from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from django.contrib.postgres.search import TrigramSimilarity
from django.contrib.auth.models import User

from .serializers import MovieSerializer, UserSerializer, PlaylistMovieSerializer
from .models import Movie, PlaylistMovie
from .movieSearch import MovieSearch, TMDB
from .utils import serialize_movie_cached

logger = logging.getLogger("movies")
tmdb = TMDB()

class PlaylistMovieCreate(generics.ListCreateAPIView):
    serializer_class = PlaylistMovieSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return PlaylistMovie.objects.filter(author=user)
    
    def perform_create(self, serializer):
        serializer.save(
            author=self.request.user,
            tmdb_id=self.request.data.get('tmdb_id')
        )

class PlaylistMovieDelete(generics.DestroyAPIView):
    serializer_class = PlaylistMovieSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "tmdb_id"

    def get_queryset(self):
        user = self.request.user
        return PlaylistMovie.objects.filter(author=user)
    
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class StreamToClient(APIView):
    """
    Returns the HLS .m3u8 URL for a movie given its TMDB ID.
    Assumes Nginx serves /var/www/media/ as /media/ URL.
    """
    def get(self, request):
        tmdb_id = request.query_params.get("tmdb_id")
        if not tmdb_id:
            return Response({"error": "No tmdb_id provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            tmdb_id = int(tmdb_id)
        except ValueError:
            return Response({"error": "Invalid tmdb_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            movie = Movie.objects.get(tmdb_id=tmdb_id)
        except Movie.DoesNotExist:
            return Response({"error": "Movie not found"}, status=status.HTTP_404_NOT_FOUND)

        safe_title = "".join(c if c.isalnum() or c in "-_" else "_" for c in movie.title)
        hls_dir = os.path.join(movie.download_path, "hls")
        m3u8_filename = f"{safe_title}.m3u8"
        m3u8_path = os.path.join(hls_dir, m3u8_filename)

        if not os.path.isfile(m3u8_path):
            return Response({"error": "HLS not available"}, status=status.HTTP_404_NOT_FOUND)

        # Convert filesystem path to URL served by Nginx
        media_root = "/var/www/media"
        url_path = m3u8_path.replace(media_root, "").replace(os.sep, "/")
        url = f"http://{request.get_host()}/media{url_path}"

        return Response({"file_path": url}, status=status.HTTP_200_OK)

class ShowAvailableMovies(APIView):
    """Return a paginated JSON of the movies available on the server"""
    def get(self, request):
        try:
            offset = int(request.GET.get('offset', 0))
            limit = int(request.GET.get('limit', 25))
        except ValueError:
            return Response({"error": "Invalid offset or limit"}, status=status.HTTP_400_BAD_REQUEST)

        movies_qs = Movie.objects.order_by("-tmdb_id")[offset:offset + limit]
        serializer = MovieSerializer(movies_qs, many=True, context={'request': request, 'tmdb': tmdb})

        result = {
            "tmdb_config": tmdb.config,
            "movies": serializer.data,
        }
        return Response(result)

class SearchTPB(APIView):
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

class Search(APIView):
    """Search through local movies in the database with TMDB config included."""

    def get(self, request):
        query = request.query_params.get("query")
        if not query:
            return Response({"error": "No query specified"}, status=status.HTTP_400_BAD_REQUEST)

        movies = Movie.objects.annotate(
            similarity=TrigramSimilarity('title', query)
        ).filter(similarity__gt=0.15).order_by('-similarity')

        # Use cached serialization
        serialized_movies = [serialize_movie_cached(m) for m in movies]

        tmdb_config = tmdb.config

        result = {
            "tmdb_config": tmdb_config,
            "movies": serialized_movies
        }

        return Response(result, status=status.HTTP_200_OK)

class MoviePopulars(APIView):
    """ returns a json of popular movies currently """
    def get(self, request):
        page = request.query_params.get("page")
        if not page:
            page = 1
        result = tmdb.getPopularMovies(page)
        return Response(result, status=status.HTTP_200_OK)
