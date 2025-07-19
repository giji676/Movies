from rest_framework import serializers
from .models import Movie

class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = "__all__"
        #fields = ["id", "title", "description", "published_date", "seeders", "leechers"]
