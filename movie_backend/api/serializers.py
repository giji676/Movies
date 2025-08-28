from rest_framework import serializers
from .models import Movie

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
