from django.urls import reverse
from rest_framework.test import APITestCase, APIClient, APIRequestFactory
from rest_framework import status
from rest_framework.request import Request
from django.contrib.auth import get_user_model
from api.serializers import MovieSerializer
from api.models import Movie, PlaylistMovie
from unittest.mock import Mock

class PlaylistTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="user@example.com", password="password123"
        )

        self.movie = Movie.objects.create(title="Test Movie", tmdb_id=1)
        self.playlist_movie = PlaylistMovie.objects.create(author=self.user, tmdb_id=self.movie)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.playlist_create_url = reverse("playlist-movie-create")
        self.playlist_delete_url = reverse("playlist-movie-delete", kwargs={"tmdb_id": self.movie.tmdb_id})

    def test_add_movie_to_playlist(self):
        response = self.client.post(self.playlist_create_url, {"tmdb_id": self.movie.tmdb_id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(PlaylistMovie.objects.filter(author=self.user, tmdb_id=self.movie).exists())

    def test_delete_movie_from_playlist(self):
        response = self.client.delete(self.playlist_delete_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(PlaylistMovie.objects.filter(author=self.user, tmdb_id=self.movie).exists())

class MovieSerializerTest(APITestCase):
    def setUp(self):
        self.movie = Movie.objects.create(title="Test Movie", tmdb_id=1)
        self.factory = APIRequestFactory()

    def test_tmdb_included_when_param_is_true(self):
        # Arrange: mock TMDB service
        fake_tmdb_data = {"title": "Fake TMDB Movie", "year": 2021}
        mock_tmdb = Mock()
        mock_tmdb.getMovieByTMDBID.return_value = fake_tmdb_data

        # Act: Create DRF-wrapped request
        request = self.factory.get('/movies/?include_tmdb=true')
        drf_request = Request(request)

        # Act: Serialize movie with correct context
        serializer = MovieSerializer(
            self.movie,
            context={"request": drf_request, "tmdb": mock_tmdb}
        )
        data = serializer.data

        # Assert: tmdb field matches fake data
        self.assertEqual(data["tmdb"], fake_tmdb_data)
        mock_tmdb.getMovieByTMDBID.assert_called_once_with(self.movie.tmdb_id)

    def test_tmdb_returns_empty_dict_on_failure(self):
        mock_tmdb = Mock()
        mock_tmdb.getMovieByTMDBID.side_effect = Exception("TMDB error")

        request = self.factory.get('/movies/?include_tmdb=true')
        drf_request = Request(request)

        serializer = MovieSerializer(
            self.movie,
            context={"request": drf_request, "tmdb": mock_tmdb}
        )
        data = serializer.data

        self.assertEqual(data["tmdb"], {})

    def test_tmdb_not_included_when_param_is_missing(self):
        mock_tmdb = Mock()

        request = self.factory.get('/movies/')  # No include_tmdb param
        drf_request = Request(request)
        serializer = MovieSerializer(
            self.movie,
            context={"request": drf_request, "tmdb": mock_tmdb}
        )
        data = serializer.data

        self.assertIsNone(data["tmdb"])
        mock_tmdb.getMovieByTMDBID.assert_not_called()
