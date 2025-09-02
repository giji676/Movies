from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path("", RedirectView.as_view(url="/movie/", permanent=False)),
    path("movie/", views.ShowAvailableMovies.as_view(), name="show-available-movies"),
    path("movie/search/", views.Search.as_view(), name="search"),
    path("movie/search-tpb/", views.SearchTPB.as_view(), name="search-tpb"),
    path("movie/populars/", views.MoviePopulars.as_view(), name="movie-populars"),
    path("movie/stream-to-client/", views.StreamToClient.as_view(), name="stream-to-client"),
    path("playlist-movie/", views.PlaylistMovieCreate.as_view(), name="playlist-movie"),
    path("playlist-movie/delete/<int:tmdb_id>/", views.PlaylistMovieDelete.as_view(), name="delete-playlist-movie"),
]
