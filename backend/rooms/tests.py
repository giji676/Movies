import json
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.urls import reverse
from django.contrib.auth import get_user_model
from rooms.models import Room, RoomUser, RoomUserPrivileges
from api.models import Movie

User = get_user_model()

class ManageRoomTest(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(email="owner@example.com", password="password123")
        self.guest = User.objects.create_user(email="guest@example.com", password="guest123")
        self.last_user = User.objects.create_user(email="last@example.com", password="last123")

        self.client = APIClient()
        self.client.force_authenticate(user=self.owner)

        self.movie = Movie.objects.create(title="Movie 1", tmdb_id=1)

        self.room = Room.objects.create(movie_id=self.movie.tmdb_id, created_by=self.owner, max_users=2)

        self.owner_room_user = RoomUser.objects.get(user=self.owner, room=self.room)
        self.guest_privilege = RoomUserPrivileges.objects.create(
            room=self.room,
            name="Guest",
            play_pause=False,
            choose_movie=False,
            add_users=False,
            remove_users=False,
            change_privileges=False
        )
        self.room.add_user(self.guest, privileges=self.guest_privilege)

        self.url_name = "manage-room"

    def test_invalid_room_hash(self):
        url = reverse(self.url_name, kwargs={"room_hash": "invalid room hash"})
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthorized_user(self):
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash})
        self.client.force_authenticate(self.guest)
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_field(self):
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash})
        response = self.client.patch(url, {"invalid_field": "invalid_data"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        room = Room.objects.get(pk=self.room.pk)
        self.assertFalse(hasattr(room, "invalid_field"))

    def test_invalid_data(self):
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash})
        response = self.client.patch(url, {"max_users": "invalid_data"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        room = Room.objects.get(pk=self.room.pk)
        self.assertNotEqual(getattr(room, "max_users"), "invalid_data")

    def test_set_password(self):
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash})
        response = self.client.patch(url, {
            "is_private": True,
            "password": "testpass",
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        room = Room.objects.get(pk=self.room.pk)
        self.assertTrue(room.is_private)
        # Check it's not stored as plain text (same as input)
        self.assertNotEqual(room.password_hash, "testpass")
        self.assertTrue(room.check_password("testpass"))

class RoomUserViewTest(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(email="owner@example.com", password="password123")
        self.guest = User.objects.create_user(email="guest@example.com", password="guest123")
        self.last_user = User.objects.create_user(email="last@example.com", password="last123")

        self.client = APIClient()
        self.client.force_authenticate(user=self.guest)

        self.movie = Movie.objects.create(title="Movie 1", tmdb_id=1)

        self.room = Room.objects.create(movie_id=self.movie.tmdb_id, created_by=self.owner, max_users=2)

        self.owner_room_user = RoomUser.objects.get(user=self.owner, room=self.room)
        self.guest_privilege = RoomUserPrivileges.objects.create(
            room=self.room,
            name="Guest",
            play_pause=True,
            choose_movie=False,
            add_users=False,
            remove_users=False,
            change_privileges=False
        )
        self.room.add_user(self.guest, privileges=self.guest_privilege)

        self.url_name = "room-user"

    def test_invalid_user(self):
        self.client.force_authenticate(user=self.last_user)
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertNotIn("room_user", response.data)
        self.assertIn("not found", response.data["error"])

    def test_invalid_room_hash(self):
        url = reverse(self.url_name, kwargs={"room_hash": "invalid room hash"})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertNotIn("room_user", response.data)

    def test_get_room_user_successfully(self):
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("room_user", response.data)
        self.assertTrue(response.data["room_user"]["privileges"]["play_pause"])
        self.assertFalse(response.data["room_user"]["privileges"]["choose_movie"])

class JoinRoomViewTest(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(email="owner@example.com", password="password123")
        self.guest = User.objects.create_user(email="guest@example.com", password="guest123")
        self.last_user = User.objects.create_user(email="last@example.com", password="last123")

        self.client = APIClient()
        self.client.force_authenticate(user=self.guest)

        self.movie = Movie.objects.create(title="Movie 1", tmdb_id=1)

        self.room = Room.objects.create(movie_id=self.movie.tmdb_id, created_by=self.owner, max_users=2)
        self.room.add_user(self.guest)

        self.owner_room_user = RoomUser.objects.get(user=self.owner, room=self.room)

        self.url_name = "join-room"

    def test_join_room_successfully(self):
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(RoomUser.objects.filter(user=self.guest, room=self.room).exists())

    def test_join_room_already_in_room(self):
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Should not create duplicate
        users_count = RoomUser.objects.filter(user=self.guest, room=self.room).count()
        self.assertEqual(users_count, 1)

    def test_join_room_full(self):
        self.client.force_authenticate(user=self.last_user)
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("room_full", response.data["error"])

    def test_join_room_invalid_hash(self):
        url = reverse(self.url_name, kwargs={"room_hash": "invalidhash"})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Room not found", response.data["error"])

    def test_join_valid_password(self):
        self.room.set_password("roompass123")
        self.room.is_private = True
        self.room.save()
        self.room.refresh_from_db()
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash})
        response = self.client.post(url, data={"password": "roompass123"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_join_invalid_password(self):
        self.room.set_password("roompass123")
        self.room.is_private = True
        self.room.save()
        self.room.refresh_from_db()
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash})
        response = self.client.post(url, data={"password": "invalidpadd"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_join_missing_password(self):
        self.room.set_password("roompass123")
        self.room.is_private = True
        self.room.save()
        self.room.refresh_from_db()
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash})
        response = self.client.post(url, data={})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class EditUserPrivilegesTest(APITestCase):
    def setUp(self):
        # Users
        self.owner = User.objects.create_user(email="owner@example.com", password="password123")
        self.guest = User.objects.create_user(email="guest@example.com", password="guest123")
        self.other_user = User.objects.create_user(email="other@example.com", password="other123")

        self.client = APIClient()
        self.client.force_authenticate(user=self.owner)

        self.movie = Movie.objects.create(title="Movie 1", tmdb_id=1)

        self.room = Room.objects.create(movie_id=self.movie.tmdb_id, created_by=self.owner, max_users=3)

        self.owner_privilege = self.room.privilege_roles.get(name="Owner")

        self.guest_privilege = RoomUserPrivileges.objects.create(
            room=self.room,
            name="Guest",
            play_pause=False,
            choose_movie=False,
            add_users=False,
            remove_users=False,
            change_privileges=False
        )

        self.owner_room_user = RoomUser.objects.get(user=self.owner, room=self.room)
        self.guest_room_user = RoomUser.objects.create(user=self.guest, room=self.room, privileges=self.guest_privilege)

        self.url_name = "manage-user-detail"

    def test_edit_user_privileges_success(self):
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash, "user_id": self.guest.id})
        response = self.client.patch(url, {"play_pause": True, "add_users": True})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.guest_room_user.refresh_from_db()
        self.assertTrue(self.guest_room_user.privileges.play_pause)
        self.assertTrue(self.guest_room_user.privileges.add_users)

    def test_edit_user_not_in_room(self):
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash, "user_id": self.other_user.id})
        response = self.client.patch(url, {"play_pause": True})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Target user not in room", response.data["error"])

    def test_edit_user_requester_no_privilege(self):
        # Authenticate as guest without change_privileges
        self.client.force_authenticate(user=self.guest)
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash, "user_id": self.owner.id})
        response = self.client.patch(url, {"play_pause": False})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Not enough privilege", response.data["error"])

    def test_edit_user_requester_not_in_room(self):
        # Authenticate as a user not in room
        self.client.force_authenticate(user=self.other_user)
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash, "user_id": self.guest.id})
        response = self.client.patch(url, {"play_pause": True})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("You are not in this room", response.data["error"])

    def test_edit_user_invalid_room_hash(self):
        url = reverse(self.url_name, kwargs={"room_hash": "invalidhash", "user_id": self.guest.id})
        response = self.client.patch(url, {"play_pause": True})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Room not found", response.data["error"])

    def test_edit_user_no_valid_fields(self):
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash, "user_id": self.guest.id})
        response = self.client.patch(url, {"invalid_field": True})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("No valid privilege fields provided", response.data["error"])

class RemoveUserFromRoomTest(APITestCase):
    def setUp(self):
        # Users
        self.owner = User.objects.create_user(email="owner@example.com", password="password123")
        self.guest = User.objects.create_user(email="guest@example.com", password="guest123")
        self.other_user = User.objects.create_user(email="other@example.com", password="other123")

        self.client = APIClient()
        self.client.force_authenticate(user=self.owner)

        self.movie = Movie.objects.create(title="Movie 1", tmdb_id=1)

        self.room = Room.objects.create(movie_id=self.movie.tmdb_id, created_by=self.owner, max_users=3)

        self.guest_privilege = RoomUserPrivileges.objects.create(
            room=self.room,
            name="Guest",
            play_pause=False,
            choose_movie=False,
            add_users=False,
            remove_users=False,
            change_privileges=False
        )

        self.owner_privilege = self.room.privilege_roles.get(name="Owner")
        self.guest_room_user = RoomUser.objects.create(user=self.guest, room=self.room, privileges=self.guest_privilege)

        self.url_name = "manage-user-detail"

    def test_delete_user_successfully(self):
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash, "user_id": self.guest.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(RoomUser.objects.filter(user=self.guest, room=self.room).exists())

    def test_delete_user_not_in_room(self):
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash, "user_id": self.other_user.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(RoomUser.objects.filter(user=self.other_user, room=self.room).exists())

    def test_delete_user_no_privilege(self):
        # Authenticate as guest who cannot remove users
        self.client.force_authenticate(user=self.guest)
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash, "user_id": self.owner.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Not enough privilege", response.data["error"])

    def test_delete_user_requester_not_in_room(self):
        # Authenticate as a user not in the room
        self.client.force_authenticate(user=self.other_user)
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash, "user_id": self.guest.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("You are not in this room", response.data["error"])

    def test_delete_user_invalid_room_hash(self):
        url = reverse(self.url_name, kwargs={"room_hash": "invalidhash", "user_id": self.guest.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Room not found", response.data["error"])

    # def test_delete_owner(self):
    #     url = reverse(self.url_name, kwargs={"room_hash": "invalidhash", "user_id": self.owner.id})
    #     response = self.client.delete(url)
    #     self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    #     self.assertFalse(RoomUser.objects.filter(user=self.owner, room=self.room).exists())

    def test_delete_all_users(self):
        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash, "user_id": self.guest.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(RoomUser.objects.filter(user=self.guest, room=self.room).exists())

        url = reverse(self.url_name, kwargs={"room_hash": self.room.room_hash, "user_id": self.owner.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(RoomUser.objects.filter(user=self.owner, room=self.room).exists())

        self.room.refresh_from_db()
        self.assertFalse(self.room.is_active)


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
        self.url = reverse("manage-user", kwargs={"room_hash": self.room.room_hash})

    def test_add_user_successfully(self):
        response = self.client.post(self.url, {
            "email": self.other_user_email,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        exists = RoomUser.objects.filter(user=self.other_user, room=self.room).exists()
        self.assertTrue(exists)

    def test_add_user_over_max_limit(self):
        self.client.post(self.url, {
            "email": self.other_user_email,
        })
        response = self.client.post(self.url, {
            "email": self.last_user_email,
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_add_user_missing_email(self):
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_user_invalid_room_hash(self):
        url = reverse("manage-user", kwargs={"room_hash": "invalidhash"})
        response = self.client.post(url, {
            "email": self.other_user_email,
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_add_user_nonexistent_user(self):
        response = self.client.post(self.url, {
            "email": "non-existent@example.com",
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_not_in_room_cannot_add(self):
        new_user = User.objects.create_user(email="outsider@example.com", password="pass123")
        self.client.force_authenticate(user=new_user)

        response = self.client.post(self.url, {
            "email": self.other_user_email,
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
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_add_existing_user(self):
        self.client.post(self.url, {
            "email": self.other_user_email,
        })
        response = self.client.post(self.url, {
            "email": self.other_user_email,
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

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
