from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser
from movie import settings

ACCESS_TOKEN = settings.SIMPLE_JWT["AUTH_COOKIE"]
REFRESH_TOKEN = settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"]

class RefreshTokenTest(APITestCase):
    def setUp(self):
        self.url = reverse("jwt-refresh")
        self.email = "test@example.com"
        self.password = "strongpassword123"
        self.user = CustomUser.objects.create_user(
            email=self.email,
            password=self.password
        )
        self.refresh = RefreshToken.for_user(self.user)
        self.access = str(self.refresh.access_token)
        self.refresh_token = str(self.refresh)
        self.client = APIClient()

    def test_refresh_with_valid_token(self):
        self.client.cookies[REFRESH_TOKEN] = self.refresh_token
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token refreshed", response.data["message"].lower())
        self.assertIn("refresh_token_exp", response.data)
        self.assertIn("access_token_exp", response.data)
        # Check cookies
        self.assertIn(ACCESS_TOKEN, response.cookies)
        self.assertIn(REFRESH_TOKEN, response.cookies)
        access_cookie = response.cookies[ACCESS_TOKEN]
        refresh_cookie = response.cookies[REFRESH_TOKEN]
        self.assertTrue(access_cookie["httponly"])
        self.assertTrue(refresh_cookie["httponly"])

    def test_refresh_missing_cookie(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("refresh token missing", response.data["error"].lower())

    def test_refresh_invalid_cookie(self):
        self.client.cookies[REFRESH_TOKEN] = "invalidtoken"
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("invalid refresh token", response.data["error"].lower())

class LogoutTest(APITestCase):
    def setUp(self):
        self.url = reverse("logout")
        self.email = "test@example.com"
        self.password = "strongpassword123"
        self.user = CustomUser.objects.create_user(
            email=self.email,
            password=self.password
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_logout_removes_cookies(self):
        self.client.cookies[ACCESS_TOKEN] = "dummy_access"
        self.client.cookies[REFRESH_TOKEN] = "dummy_refresh"

        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("logged out", response.data["message"].lower())
        
        # Ensure cookies are deleted
        self.assertIn(ACCESS_TOKEN, response.cookies)
        self.assertIn(REFRESH_TOKEN, response.cookies)
        self.assertEqual(response.cookies[ACCESS_TOKEN].value, "")
        self.assertEqual(response.cookies[REFRESH_TOKEN].value, "")

    def test_logout_without_tokens(self):
        # No cookies set
        self.client.logout()
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("logged out", response.data["message"].lower())
        # Cookies should still exist but be empty
        self.assertIn(ACCESS_TOKEN, response.cookies)
        self.assertIn(REFRESH_TOKEN, response.cookies)
        self.assertEqual(response.cookies[ACCESS_TOKEN].value, "")
        self.assertEqual(response.cookies[REFRESH_TOKEN].value, "")

    def test_logout_without_being_logged_in(self):
        # No access or refresh cookies set
        response = self.client.post(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("logged out", response.data["message"].lower())

        # Ensure cookies are still returned but empty
        self.assertIn(ACCESS_TOKEN, response.cookies)
        self.assertIn(REFRESH_TOKEN, response.cookies)
        self.assertEqual(response.cookies[ACCESS_TOKEN].value, "")
        self.assertEqual(response.cookies[REFRESH_TOKEN].value, "")

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

        self.assertIn(ACCESS_TOKEN, response.cookies)
        self.assertIn(REFRESH_TOKEN, response.cookies)
        access_cookie = response.cookies[ACCESS_TOKEN]
        refresh_cookie = response.cookies[REFRESH_TOKEN]
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
