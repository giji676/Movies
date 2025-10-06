from django.urls import path
from . import views

urlpatterns = [
    path("", views.RoomView.as_view()),
    path("create/", views.CreateRoomView.as_view(), name="create-room"),
]
