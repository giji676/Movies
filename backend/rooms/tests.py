import json
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.urls import reverse
from django.contrib.auth import get_user_model
from rooms.models import Room, RoomUser, RoomUserPrivileges
from api.models import Movie

User = get_user_model()

class AddUserToRoomTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="user@example.com", password="password123"
        )
        self.other_user_email = "other@example.com"
        self.last_user_email = "last@example.com"
        self.other_user = User.objects.create_user(
            email=self.other_user_email, password="password456"
        )
        self.last_user = User.objects.create_user(
            email=self.last_user_email, password="password456"
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.movie1 = Movie.objects.create(title="Movie 1", tmdb_id=1)

        self.room = Room(
            movie_id=self.movie1.tmdb_id,
            created_by=self.user,
            is_private=True,
            max_users=2,
        )
        self.room.save()
        self.url = reverse("add-user")

    def test_add_user_successfully(self):
        response = self.client.post(self.url, {
            "email": self.other_user_email,
            "room_hash": self.room.room_hash,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        exists = RoomUser.objects.filter(user=self.other_user, room=self.room).exists()
        self.assertTrue(exists)

    def test_add_user_over_max_limit(self):
        self.client.post(self.url, {
            "email": self.other_user_email,
            "room_hash": self.room.room_hash,
        })
        response = self.client.post(self.url, {
            "email": self.last_user_email,
            "room_hash": self.room.room_hash,
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_add_user_missing_email(self):
        response = self.client.post(self.url, {
            "room_hash": self.room.room_hash,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_user_missing_room_hash(self):
        response = self.client.post(self.url, {
            "email": self.other_user_email,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_user_invalid_room_hash(self):
        response = self.client.post(self.url, {
            "email": self.other_user_email,
            "room_hash": "invalidhash",
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_add_user_nonexistent_user(self):
        response = self.client.post(self.url, {
            "email": "non-existent@example.com",
            "room_hash": self.room.room_hash,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_not_in_room_cannot_add(self):
        new_user = User.objects.create_user(email="outsider@example.com", password="pass123")
        self.client.force_authenticate(user=new_user)

        response = self.client.post(self.url, {
            "email": self.other_user_email,
            "room_hash": self.room.room_hash,
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_without_add_privilege_cannot_add(self):
        guest_privilege = RoomUserPrivileges.objects.create(
            room=self.room,
            name="Guest",
            play_pause=True,
            choose_movie=False,
            add_users=False,
            remove_users=False,
            change_privileges=False
        )

        # Replace the default "Owner" with "Guest"
        room_user = RoomUser.objects.get(user=self.user, room=self.room)
        room_user.privileges = guest_privilege
        room_user.save()

        response = self.client.post(self.url, {
            "email": self.other_user_email,
            "room_hash": self.room.room_hash,
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_add_existing_user(self):
        self.client.post(self.url, {
            "email": self.other_user_email,
            "room_hash": self.room.room_hash,
        })
        response = self.client.post(self.url, {
            "email": self.other_user_email,
            "room_hash": self.room.room_hash,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        count = RoomUser.objects.filter(user__email=self.other_user_email, room=self.room).count()
        self.assertEqual(count, 1)

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
        self.assertEqual(room_user.privileges.change_privileges, True)

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
