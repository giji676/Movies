from django.core.cache import cache
from .serializers import MovieSerializer

CACHE_TTL = 60 * 60  # 1 hour

def serialize_movie_cached(movie):
    cache_key = f"movie_serialized_{movie.tmdb_id}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data
    serialized = MovieSerializer(movie).data
    cache.set(cache_key, serialized, CACHE_TTL)
    return serialized
