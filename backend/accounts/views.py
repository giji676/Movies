from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from movie.settings import SIMPLE_JWT
from .models import CustomUser, UserSettings
from .serializers import UserProfileSerializer, UserSettingsSerializer, UserRegisterSerializer
from django.contrib.auth import get_user_model
from django.conf import settings
from django.middleware import csrf
from django.contrib.auth import authenticate
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView

User = get_user_model()

def set_jwt_cookies(response, access, refresh):
    response.set_cookie(
        key=settings.SIMPLE_JWT['AUTH_COOKIE'],
        value=access,
        httponly=True,
        secure=False,  # set to True in production with HTTPS
        samesite='Lax',
        max_age=settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"],
    )
    response.set_cookie(
        key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
        value=refresh,
        httponly=True,
        secure=False,
        samesite='Lax',
        max_age=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
    )
    return response

class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])

        if refresh_token is None:
            return Response({'error': 'Refresh token missing'}, status=400)

        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
        except Exception:
            return Response({'error': 'Invalid refresh token'}, status=400)

        response = JsonResponse({
            "message": "Token refreshed",
            "refresh_token_exp": refresh["exp"],
            "access_token_exp": refresh.access_token["exp"],
        })
        response = set_jwt_cookies(response, access_token, refresh_token)
        return response

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        user = authenticate(request, email=email, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            response = JsonResponse({
                "message": "Logged in successfully",
                "refresh_token_exp": refresh["exp"],
                "access_token_exp": refresh.access_token["exp"],
            })
            response = set_jwt_cookies(response, access_token, refresh_token)
            response["X-CSRFToken"] = csrf.get_token(request)
            return response
        else:
            return Response({"error": "Invalid credentials"}, status=400)

class LogoutView(APIView):
    def post(self, request):
        response = Response({"message": "Logged out"})
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
        return response

class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # OneToOne relation: user.settings
        return self.request.user.settings

class CreateUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
