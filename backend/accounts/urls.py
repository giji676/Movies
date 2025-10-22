from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.urls import path
from . import views

urlpatterns = [
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("refresh/", views.RefreshTokenView.as_view(), name="jwt-refresh"),
    path("profile/", views.UserProfileView.as_view(), name="user-profile"),
    path("settings/", views.UserSettingsView.as_view(), name="user-settings"),
    path("register/", views.CreateUserView.as_view(), name="register"),
]
