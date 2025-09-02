from django.test import TestCase

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
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.playlist_url = reverse("playlist-movie")  # your URL name

    def test_add_movie_to_playlist(self):
        response = self.client.post(self.playlist_url, {"tmdb_id": self.movie.tmdb_id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(PlaylistMovie.objects.filter(author=self.user, tmdb_id=self.movie).exists())
