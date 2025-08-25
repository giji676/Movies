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
    def get(self, request):
        movies = Movie.objects.all()
        serializer = MovieSerializer(movies, many=True)

        result = {
            "tmdb_config": TMDB().getConfig(),
            "movies": serializer.data,
        }
        return Response(result)

class MovieSearch(APIView):
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

