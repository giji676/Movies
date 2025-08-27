from rest_framework import serializers
from .models import Movie
from .movieSearch import TMDB

class MovieSerializer(serializers.ModelSerializer):
    tmdb = serializers.SerializerMethodField()

    class Meta:
        model = Movie
        fields = "__all__"

    def get_tmdb(self, obj):
        """Fetch full TMDB details for this movie"""
        tmdb = TMDB()
        try:
            return tmdb.getMovieByTMDBID(obj.tmdb_id)
        except:
            return {}
