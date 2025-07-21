from django.urls import path
from django.views.generic import RedirectView
from . import views

urlpatterns = [
    path('', RedirectView.as_view(url='/movie/', permanent=False)),
    path("movie/", views.MovieShowAvailable.as_view(), name="movie-show-available"),
    path("movie/search/", views.MovieSearchAPI.as_view(), name="movie-search-api"),
    path("movie/stream/", views.MovieStream.as_view(), name="movie-stream"),
    path("movie/stream/ts/<str:name>", views.GetTS.as_view(), name="get-ts"),
    path("movie/populars/", views.MoviePopulars.as_view(), name="movie-populars"),
    path("movie/download/", views.StreamMovie.as_view(), name="movie-stream-new"),
]
