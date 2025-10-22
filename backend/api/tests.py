import uuid
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient, APIRequestFactory
from rest_framework import status
from rest_framework.request import Request
from django.contrib.auth import get_user_model
from api.serializers import MovieSerializer
from api.models import Movie, PlaylistMovie
from unittest.mock import Mock
from django.utils import timezone

class MovieSearchTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="user@example.com", password="password123"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.movie1 = Movie.objects.create(title="Movie 1", tmdb_id=1)
        self.movie2 = Movie.objects.create(title="Movie 2", tmdb_id=2)
        self.movie3 = Movie.objects.create(title="Movie 3", tmdb_id=3)

        self.search_url = reverse("search")
        self.search_suggest_url = reverse("search-suggest")

    def test_empty_search(self):
        response = self.client.get(self.search_url, {"query": ""})
        self.assertEqual(response.status_code, 400);

    def test_search(self):
        response = self.client.get(self.search_url, {"query": "Movie"})
        self.assertEqual(response.status_code, 200);
        self.assertEqual(len(response.data["movies"]), 3);

    def test_non_existant_search(self):
        query = str(uuid.uuid4().hex)
        response = self.client.get(self.search_url, {"query": query})
        self.assertEqual(response.status_code, 200);
        self.assertEqual(len(response.data["movies"]), 0);

    def test_empty_search_suggest(self):
        response = self.client.get(self.search_suggest_url, {"query": ""})
        self.assertEqual(response.status_code, 200);

    def test_search_suggest(self):
        response = self.client.get(self.search_suggest_url, {"query": "Movie"})
        self.assertEqual(response.status_code, 200);
        self.assertEqual(len(response.data), 3);

    def test_non_existant_search_suggest(self):
        query = str(uuid.uuid4().hex)
        response = self.client.get(self.search_suggest_url, {"query": query})
        self.assertEqual(response.status_code, 200);
        self.assertEqual(len(response.data), 0);

class PlaylistMovieListTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="user@example.com", password="password123"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.movie1 = Movie.objects.create(title="Movie 1", tmdb_id=1)
        self.movie2 = Movie.objects.create(title="Movie 2", tmdb_id=2)
        self.movie3 = Movie.objects.create(title="Movie 3", tmdb_id=3)

        # Create PlaylistMovies with different combinations
        PlaylistMovie.objects.create(author=self.user, tmdb=self.movie1, watch_later=True, watch_history=True)
        PlaylistMovie.objects.create(author=self.user, tmdb=self.movie2, watch_later=True, watch_history=False)
        PlaylistMovie.objects.create(author=self.user, tmdb=self.movie3, watch_later=False, watch_history=True)

        self.url = reverse("playlist-movie-list")

    def test_list_all_playlist_movies(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 3)

    def test_filter_watch_later_true(self):
        response = self.client.get(self.url, {"watch_later": "true"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
        tmdb_ids = {movie["movie"]["tmdb_id"] for movie in response.data}
        self.assertEqual(tmdb_ids, {1, 2})

    def test_filter_watch_history_true(self):
        response = self.client.get(self.url, {"watch_history": "true"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)
        tmdb_ids = {movie["movie"]["tmdb_id"] for movie in response.data}
        self.assertEqual(tmdb_ids, {1, 3})

    def test_filter_both_watch_later_and_watch_history_true(self):
        response = self.client.get(self.url, {"watch_later": "true", "watch_history": "true"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["movie"]["tmdb_id"], 1)

    def test_filter_watch_later_false(self):
        response = self.client.get(self.url, {"watch_later": "false"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["movie"]["tmdb_id"], 3)

    def test_filter_watch_history_false(self):
        response = self.client.get(self.url, {"watch_history": "false"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["movie"]["tmdb_id"], 2)

class TimeStampTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="user@example.com", password="password123"
        )
        self.movie = Movie.objects.create(title="Test Movie", tmdb_id=1, duration=60)
        self.playlist_movie = PlaylistMovie.objects.create(author=self.user, tmdb=self.movie)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.update_url = reverse("playlist-update-progress", kwargs={"tmdb_id": self.movie.tmdb_id})

    def test_update_time(self):
        response = self.client.patch(self.update_url, {"time_stamp": 10})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.playlist_movie.refresh_from_db()
        self.assertEqual(self.playlist_movie.time_stamp, 10)

    def test_update_time_with_string(self):
        response = self.client.patch(self.update_url, {"time_stamp": "abcd"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_time_with_negative(self):
        response = self.client.patch(self.update_url, {"time_stamp": -10})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_time_missing_field(self):
        response = self.client.patch(self.update_url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("time_stamp", response.data)

    def test_update_time_with_nonexistent_playlist(self):
        url = reverse("playlist-update-progress", kwargs={"tmdb_id": 9999})
        response = self.client.patch(url, {"time_stamp": 100})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_complete_check(self):
        self.client.patch(self.update_url, {"time_stamp": int(self.movie.duration*0.99)})
        self.playlist_movie.refresh_from_db()
        self.assertTrue(self.playlist_movie.completed)

    def test_last_watched_updated(self):
        before = timezone.now()
        self.client.patch(self.update_url, {"time_stamp": 5})
        self.playlist_movie.refresh_from_db()
        self.assertTrue(self.playlist_movie.last_watched >= before)

    def test_create_and_update(self):
        # Try updating a non-existant playlist-movie
        # It should be created and then updated
        movie2 = Movie.objects.create(title="Test Movie2", tmdb_id=2, duration=60)
        update_url2 = reverse("playlist-update-progress", kwargs={"tmdb_id": movie2.tmdb_id})
        response = self.client.patch(update_url2, {"time_stamp": 20})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        playlist_movie = PlaylistMovie.objects.get(author=self.user, tmdb=movie2)
        self.assertEqual(playlist_movie.time_stamp, 20)

class PlaylistTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="user@example.com", password="password123"
        )

        self.movie = Movie.objects.create(title="Test Movie", tmdb_id=1)
        self.movie2 = Movie.objects.create(title="Test Movie", tmdb_id=2)
        self.playlist_movie = PlaylistMovie.objects.create(author=self.user, tmdb=self.movie)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.create_url = reverse("playlist-movie-create")
        self.modify_url = lambda tmdb_id: reverse("playlist-movie-modify", kwargs={"tmdb_id": tmdb_id})
        # self.playlist_delete_url = reverse("playlist-movie-delete", kwargs={"tmdb_id": self.movie.tmdb_id})

    def test_add_movie_to_playlist(self):
        response = self.client.post(self.create_url, {"tmdb_id": 2})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(PlaylistMovie.objects.filter(author=self.user, tmdb=self.movie).exists())

    def test_create_invalid_tmdb_id(self):
        response = self.client.post(self.create_url, {"tmdb_id": "invalid_tmdb_id"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("tmdb_id", response.data)
        self.assertEqual(response.data["tmdb_id"], "tmdb_id must be an integer")

    def test_create_nonexistent_movie(self):
        response = self.client.post(self.create_url, {"tmdb_id": 9999})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("tmdb_id", response.data)
        self.assertIn("does not exist.", response.data["tmdb_id"])

    def test_list_playlist_movies(self):
        response = self.client.get(self.create_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # since one movie was added in setUp
        self.assertEqual(response.data[0]["movie"]["tmdb_id"], self.movie.tmdb_id)

    def test_prevent_duplicate_movie_in_playlist(self):
        response = self.client.post(self.create_url, {"tmdb_id": self.movie.tmdb_id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.data)

    def test_modify_invalid_value(self):
        response = self.client.patch(self.modify_url(self.movie.tmdb_id), {
            "modify_field": "watch_later",
            "value": "invalid_value",
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("true or false", response.data["value"])

    def test_modify_value_integer(self):
        response = self.client.patch(self.modify_url(self.movie.tmdb_id), {
            "modify_field": "watch_later",
            "value": 1,  # bool(1) → True
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["data"]["watch_later"])
        response = self.client.patch(self.modify_url(self.movie.tmdb_id), {
            "modify_field": "watch_later",
            "value": 0,  # bool(0) → False
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["data"]["watch_later"])
    
    def test_create_on_modify(self):
        """
        If a PlaylistMovie does not exist for the user and movie,
        PATCHing to modify a field should create it and set the correct value.
        """
        # Ensure PlaylistMovie does NOT exist
        PlaylistMovie.objects.filter(author=self.user, tmdb=self.movie2).delete()
        self.assertFalse(
            PlaylistMovie.objects.filter(author=self.user, tmdb=self.movie2).exists()
        )

        # PATCH request to set watch_later=True
        response = self.client.patch(self.modify_url(self.movie2.tmdb_id), {"modify_field": "watch_later", "value": True})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["created"], True)

        # Check that it was created with correct field
        playlist_movie = PlaylistMovie.objects.get(author=self.user, tmdb=self.movie2)
        self.assertTrue(playlist_movie.watch_later)
        self.assertFalse(playlist_movie.watch_history)  # Default

        # Now try setting watch_history=True for another new movie
        movie3 = Movie.objects.create(title="Movie 3", tmdb_id=3)
        response = self.client.patch(self.modify_url(movie3.tmdb_id), {"modify_field": "watch_history", "value": True})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["created"], True)

        playlist_movie = PlaylistMovie.objects.get(author=self.user, tmdb=movie3)
        self.assertTrue(playlist_movie.watch_history)
        self.assertFalse(playlist_movie.watch_later)

    def test_modify_watch_later_flag(self):
        # Initially watch_later is False
        playlist_movie = PlaylistMovie.objects.get(author=self.user, tmdb=self.movie)
        self.assertFalse(playlist_movie.watch_later)

        # Set watch_later = True
        response = self.client.patch(self.modify_url(self.movie.tmdb_id), {"modify_field": "watch_later", "value": True})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        playlist_movie.refresh_from_db()
        self.assertTrue(playlist_movie.watch_later)

        # Set watch_later = False
        response = self.client.patch(self.modify_url(self.movie.tmdb_id), {"modify_field": "watch_later", "value": False})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        playlist_movie.refresh_from_db()
        self.assertFalse(playlist_movie.watch_later)

    def test_modify_watch_history_flag(self):
        # Initially watch_history is False
        playlist_movie = PlaylistMovie.objects.get(author=self.user, tmdb=self.movie)
        self.assertFalse(playlist_movie.watch_history)

        # Set watch_history = True
        response = self.client.patch(self.modify_url(self.movie.tmdb_id), {"modify_field": "watch_history", "value": True})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        playlist_movie.refresh_from_db()
        self.assertTrue(playlist_movie.watch_history)

    def test_modify_invalid_field(self):
        response = self.client.patch(self.modify_url(self.movie.tmdb_id), {"modify_field": "invalid_field", "value": False})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("modify_field", response.data)

    def test_modify_missing_value(self):
        response = self.client.patch(self.modify_url(self.movie.tmdb_id), {"modify_field": "watch_later"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("value", response.data)

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
