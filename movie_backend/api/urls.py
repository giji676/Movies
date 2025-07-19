from django.urls import path
from . import views

urlpatterns = [
    path("movie/search/", views.MovieSearchAPI.as_view(), name="movie-search-api"),
    path("movie/stream/", views.MovieStream.as_view(), name="movie-stream"),
    path("movie/stream/ts/<str:name>", views.GetTS.as_view(), name="get-ts"),
    path("movie/populars/", views.MoviePopulars.as_view(), name="movie-populars"),
]
