from django.urls import path
from django.views.generic import RedirectView
from . import views

urlpatterns = [
    path("", RedirectView.as_view(url="/movie/", permanent=False)),
    path("movie/", views.ShowAvailableMovies.as_view(), name="show-available-movies"),
    path("movie/search/", views.MovieSearch.as_view(), name="movie-search"),
    path("movie/populars/", views.MoviePopulars.as_view(), name="movie-populars"),
]
