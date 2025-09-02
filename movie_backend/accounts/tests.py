from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import Movie, PlaylistMovie

class UserAuthTests(APITestCase):
    def setUp(self):
        self.register_url = reverse("register")  # your URL name
        self.login_url = reverse("get-token")    # JWT login
        self.user_data = {
            "email": "test@example.com",
            "password": "strongpassword123"
        }

    def test_register_user(self):
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(get_user_model().objects.filter(email="test@example.com").exists())

    def test_login_user(self):
        # first create a user
        get_user_model().objects.create_user(**self.user_data)
        response = self.client.post(self.login_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

class UserProfileTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email="user@example.com", password="password123"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.profile_url = reverse("user-profile")  # make sure you have a name
        self.settings_url = reverse("user-settings")

    def test_get_profile(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], self.user.email)

    def test_update_settings(self):
        response = self.client.patch(self.settings_url, {"theme": "dark"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["theme"], "dark")
