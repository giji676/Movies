from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import CustomUser

class UserSettingsTest(APITestCase):
    def setUp(self):
        self.url = reverse("user-settings")
        self.email = "test@example.com"
        self.password = "strongpassword123"
        self.user_data = {
            "email": self.email,
            "password": self.password
        }
        self.user = CustomUser.objects.create_user(
            email=self.email,
            password=self.password
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_valid_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("theme", response.data)

class UserProfileTest(APITestCase):
    def setUp(self):
        self.url = reverse("user-profile")
        self.email = "test@example.com"
        self.password = "strongpassword123"
        self.user_data = {
            "email": self.email,
            "password": self.password
        }
        self.user = CustomUser.objects.create_user(
            email=self.email,
            password=self.password
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_valid_access(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], self.email)
        self.assertNotIn("password", response.data)

    def test_invalid_access(self):
        self.client.logout()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual("not_authenticated", response.data["detail"].code)

class LoginTest(APITestCase):
    def setUp(self):
        self.url = reverse("login")
        self.email = "test@example.com"
        self.password = "strongpassword123"
        self.user_data = {
            "email": self.email,
            "password": self.password
        }
        self.user = CustomUser.objects.create_user(
            email=self.email,
            password=self.password
        )

    def test_valid_login(self):
        response = self.client.post(self.url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("success", response.data["message"].lower())
        self.assertIn("refresh_token_exp", response.data)
        self.assertIn("access_token_exp", response.data)

        self.assertIn("refresh_token", response.cookies)
        self.assertIn("access_token", response.cookies)
        access_cookie = response.cookies["access_token"]
        refresh_cookie = response.cookies["refresh_token"]
        self.assertTrue(access_cookie["httponly"])
        self.assertTrue(refresh_cookie["httponly"])
        self.assertEqual(access_cookie["path"], "/")
        self.assertEqual(refresh_cookie["path"], "/")

    def test_missing_credentials(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("invalid credentials", response.data["error"].lower())

    def test_invalid_email(self):
        response = self.client.post(self.url, {"email": "invalid_email@mail.com"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("invalid credentials", response.data["error"].lower())

class RegisterTest(APITestCase):
    def setUp(self):
        self.url = reverse("register")
        self.email = "test@example.com"
        self.password = "strongpassword123"
        self.user_data = {
            "email": self.email,
            "password": self.password
        }

    def test_register(self):
        response = self.client.post(self.url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_missing_email(self):
        response = self.client.post(self.url, {"password": self.password})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_password(self):
        response = self.client.post(self.url, {"email": self.email})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_already_existing_user(self):
        # Register once initially
        self.client.post(self.url, self.user_data)
        # Register second time
        response = self.client.post(self.url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_credentials(self):
        self.client.logout()
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["email"][0].code, "required")
        self.assertEqual(response.data["password"][0].code, "required")
