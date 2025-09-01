from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Movie, PlaylistMovie

class MovieSerializer(serializers.ModelSerializer):
    tmdb = serializers.SerializerMethodField()

    class Meta:
        model = Movie
        fields = "__all__"

    def get_tmdb(self, obj):
        request = self.context.get('request')
        tmdb_obj = self.context.get('tmdb')
        if request and request.query_params.get('include_tmdb') == 'true':
            try:
                return tmdb_obj.getMovieByTMDBID(obj.tmdb_id)
            except:
                return {}
        return None

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class PlaylistMovieSerializer(serializers.ModelSerializer):
    movie = MovieSerializer(source='tmdb_id', read_only=True)

    class Meta:
        model = PlaylistMovie
        fields = ["id", "time_stamp", "last_watched", "movie"]
