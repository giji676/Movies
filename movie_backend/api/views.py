from django.http import FileResponse
from rest_framework import status
from rest_framework.response import Response
from .movieSearch import MovieSearch
from rest_framework.views import APIView


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

class MovieStream(APIView):
    def get(self, request):
        path = f"./Avengers: Endgame/output_new.m3u8"
        return FileResponse(open(path, 'rb'), content_type='application/vnd.apple.mpegurl')

class GetTS(APIView):
    def get(self, request, name):
        path = f"./Avengers: Endgame/{name}"
        return FileResponse(open(path, 'rb'), content_type='application/vnd.apple.mpegurl')
