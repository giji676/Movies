from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Movie, PlaylistMovie

User = get_user_model()

class MovieSerializer(serializers.ModelSerializer):
    tmdb = serializers.SerializerMethodField()

    class Meta:
        model = Movie
        fields = "__all__"

    def get_tmdb(self, obj):
        request = self.context.get('request')
        tmdb_class_obj = self.context.get('tmdb')
        if request and request.query_params.get('include_tmdb') == 'true':
            try:
                return tmdb_class_obj.getMovieByTMDBID(obj.tmdb_id)
            except:
                return {}
        return None

class PlaylistMovieSerializer(serializers.ModelSerializer):
    movie = MovieSerializer(source='tmdb', read_only=True)

    class Meta:
        model = PlaylistMovie
        fields = ["id", "time_stamp", "last_watched", "movie", "watch_later", "watch_history", "completed"]
