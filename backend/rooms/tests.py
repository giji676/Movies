from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.urls import reverse
from django.contrib.auth import get_user_model
from rooms.models import Room, RoomUser
from api.models import Movie

User = get_user_model()

class CreateCodeTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="user@example.com", password="password123"
        )
        self.other_user = User.objects.create_user(
            email="other@example.com", password="password456"
        )
        self.last_user = User.objects.create_user(
            email="last@example.com", password="password789"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.movie1 = Movie.objects.create(title="Movie 1", tmdb_id=1)

        self.url = reverse("create-room")

    def test_create_room_successfully(self):
        response = self.client.post(self.url, {
            "movie_id": self.movie1.tmdb_id,
            "is_private": False,
            "max_users": 2,
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Room.objects.count(), 1)
        room = Room.objects.first()
        self.assertEqual(room.created_by, self.user)
        self.assertEqual(room.max_users, 2)
        room_user = RoomUser.objects.get(user=self.user, room=room)
        self.assertEqual(room_user.role, "owner")

    def test_create_room_with_password(self):
        response = self.client.post(self.url, {
            "movie_id": self.movie1.tmdb_id,
            "password": "pass1",
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        room = Room.objects.first()
        self.assertTrue(room.check_password("pass1"))

    def test_create_room_without_movie_id(self):
        response = self.client.post(self.url, {
            "is_private": False,
        })

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
