from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import Movie, PlaylistMovie

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
