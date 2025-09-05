from django.urls import path
from django.views.generic import RedirectView
from . import views

urlpatterns = [
    path("", RedirectView.as_view(url="/movie/", permanent=False)),
    path("movie/", views.ShowAvailableMovies.as_view(), name="show-available-movies"),
    path("movie/search/", views.Search.as_view(), name="search"),
    path("movie/search-tpb/", views.SearchTPB.as_view(), name="search-tpb"),
    path("movie/populars/", views.MoviePopulars.as_view(), name="movie-populars"),
    path("movie/stream-to-client/", views.StreamToClient.as_view(), name="stream-to-client"),
    #path("playlist-movies/", views.PlaylistMovieList.as_view(), name="playlist-movie-list"),
    path("playlist-movie-create/", views.PlaylistMovieCreate.as_view(), name="playlist-movie-create"),
    path("playlist-movie/modify/<int:tmdb_id>/", views.PlaylistMovieModify.as_view(), name="playlist-movie-modify"),
    path("playlist/<int:tmdb_id>/update-progress/", views.UpdateTimeStamp.as_view(), name="playlist-update-progress"),
]
