import os
import logging

from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError, NotFound
from django.contrib.postgres.search import TrigramSimilarity
from django.shortcuts import get_object_or_404

from .serializers import MovieSerializer, PlaylistMovieSerializer
from .models import Movie, PlaylistMovie
from .movieSearch import MovieSearch, TMDB
from .utils import serialize_movie_cached

logger = logging.getLogger("movies")
tmdb = TMDB()

class PlaylistMovieList(generics.ListAPIView):
    """
    Returns a list of playlist movies for the authenticated user.
    Can filter by watch_later or watch_history using query params:
        ?watch_later=true
        ?watch_history=true
    """
    serializer_class = PlaylistMovieSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = PlaylistMovie.objects.filter(author=user).order_by("-added_at")

        watch_later = self.request.query_params.get("watch_later")
        watch_history = self.request.query_params.get("watch_history")

        filters = {}
        if watch_later is not None:
            filters["watch_later"] = watch_later.lower() == "true"
        if watch_history is not None:
            filters["watch_history"] = watch_history.lower() == "true"

        if filters:
            queryset = queryset.filter(**filters)

        return queryset

class PlaylistMovieModify(generics.UpdateAPIView):
    serializer_class = PlaylistMovieSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "tmdb_id"

    def patch(self, request, *args, **kwargs):
        tmdb_id = self.kwargs.get("tmdb_id")
        modify_field = request.data.get("modify_field")
        value = request.data.get("value")

        if modify_field not in ["watch_later", "watch_history"]:
            raise ValidationError({"modify_field": "Must be 'watch_later' or 'watch_history'."})

        if value is None:
            raise ValidationError({"value": "This field is required and should be true or false."})

        if isinstance(value, str):
            if value.lower() == "true":
                value = True
            elif value.lower() == "false":
                value = False
            else:
                raise ValidationError({"value": "Must be true or false."})
        else:
            value = bool(value)

        movie = get_object_or_404(Movie, tmdb_id=tmdb_id)

        playlist_movie, created = PlaylistMovie.objects.get_or_create(
            author=request.user,
            tmdb=movie,
            defaults={modify_field: value}
        )

        if not created:
            setattr(playlist_movie, modify_field, value)
            playlist_movie.save()

        serializer = self.get_serializer(playlist_movie)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK

        return Response({
            "message": f"{modify_field} set to {value}.",
            "created": created,
            "data": serializer.data
        }, status=status_code)

class UpdateTimeStamp(generics.UpdateAPIView):
    serializer_class = PlaylistMovieSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "tmdb_id"

    def patch(self, request, *args, **kwargs):
        tmdb_id = self.kwargs.get("tmdb_id")
        time_stamp = request.data.get("time_stamp")

        if time_stamp is None:
            raise ValidationError({"time_stamp": "This field is required."})

        try:
            time_stamp = int(time_stamp)
        except ValueError:
            raise ValidationError({"time_stamp": "This field must be a positive integer."})

        if time_stamp < 0:
            raise ValidationError({"time_stamp": "This field must be a positive integer."})

        movie = get_object_or_404(Movie, tmdb_id=tmdb_id)

        playlist_movie, created = PlaylistMovie.objects.get_or_create(
            author=request.user,
            tmdb=movie,
            defaults={"time_stamp": time_stamp}
        )

        if not created:
            playlist_movie.update_time_stamp(time_stamp)

        serializer = self.get_serializer(playlist_movie)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK

        return Response({
            "message": "Time stamp updated." if not created else "PlaylistMovie created with time stamp.",
            "created": created,
            "data": serializer.data
        }, status=status_code)

class PlaylistMovieCreate(generics.ListCreateAPIView):
    """ deprecated - playlist movie automatically created if it doesn't exist from modify endpoint """
    serializer_class = PlaylistMovieSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return PlaylistMovie.objects.filter(author=user)

    def perform_create(self, serializer):
        tmdb_id = self.request.data.get('tmdb_id')
        # validate movie exists with that tmdb id
        try:
            movie = Movie.objects.get(tmdb_id=tmdb_id)
        except Movie.DoesNotExist:
            raise ValidationError({"tmdb_id": "Movie with this TMDB ID does not exist."})

        user = self.request.user
        # check for duplicate
        if PlaylistMovie.objects.filter(author=user, tmdb=movie).exists():
            raise ValidationError({"detail": "This movie is already in your playlist."})
        serializer.save(author=user, tmdb=movie)

class StreamToClient(APIView):
    permission_classes = [AllowAny]
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
